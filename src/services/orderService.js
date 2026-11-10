import crypto from "crypto";
import pool from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";
import { recordActivity } from "./auditService.js";
import { createNotification } from "./notificationService.js";
import { validateCoupon } from "./discountService.js";

function generateOrderCode() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${dateStr}-${rand}`;
}

export async function createOrder(customerId, { carId, paymentMethod, customerNote, couponCode, depositAmount: customDeposit }, req = null) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check car status and lock row
    const [cars] = await connection.execute(
      "SELECT id, name, price, status FROM cars WHERE id = ? FOR UPDATE",
      [carId]
    );

    if (!cars.length) {
      throw new HttpError(404, "Không tìm thấy xe.");
    }

    const car = cars[0];
    if (car.status !== "available") {
      throw new HttpError(400, "Xe này hiện không còn khả dụng để đặt mua.");
    }

    let finalTotalPrice = Number(car.price);
    let noteWithCoupon = customerNote || "";

    if (couponCode) {
      try {
        const discountResult = validateCoupon(couponCode, finalTotalPrice);
        finalTotalPrice = discountResult.finalPrice;
        const couponNote = `[Mã giảm giá: ${discountResult.code} (-${discountResult.discountAmount.toLocaleString("vi-VN")} đ)]`;
        noteWithCoupon = noteWithCoupon ? `${noteWithCoupon} | ${couponNote}` : couponNote;
      } catch (couponErr) {
        throw new HttpError(400, `Mã giảm giá không hợp lệ: ${couponErr.message}`);
      }
    }

    const orderCode = generateOrderCode();
    // Standard deposit is 10% or minimum 20,000,000 VND
    const defaultMinDeposit = Math.max(20000000, Math.round(finalTotalPrice * 0.1));
    const depositAmount = customDeposit ? Math.max(20000000, Number(customDeposit)) : defaultMinDeposit;

    const [orderResult] = await connection.execute(
      `INSERT INTO orders
       (order_code, customer_id, car_id, total_price, deposit_amount, status, payment_method, customer_note)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [orderCode, customerId, carId, finalTotalPrice, depositAmount, paymentMethod || "bank_transfer", noteWithCoupon || null]
    );

    const orderId = orderResult.insertId;

    // Reserve car so others cannot book or buy simultaneously
    await connection.execute("UPDATE cars SET status = 'reserved' WHERE id = ?", [carId]);

    await connection.commit();

    // Notify customer
    createNotification({
      userId: customerId,
      type: "order_created",
      title: "Đặt mua xe thành công!",
      message: `Đơn hàng ${orderCode} cho chiếc xe ${car.name} đã được khởi tạo. Vui lòng hoàn tất đặt cọc.`,
      data: { orderId, orderCode, carId }
    }).catch(() => {});

    await recordActivity({
      userId: customerId,
      action: "create_order",
      entityType: "order",
      entityId: orderId,
      newValues: { orderCode, carId, totalPrice },
      req
    });

    return getOrderById(orderId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function getOrderById(id, currentUser = null) {
  const [rows] = await pool.execute(
    `SELECT o.id, o.order_code, o.customer_id, u.full_name as customer_name,
            u.email as customer_email, u.phone as customer_phone,
            o.car_id, c.name as car_name, c.brand as car_brand, c.image_url as car_image,
            o.total_price, o.deposit_amount, o.status, o.payment_method,
            o.customer_note, o.staff_note, o.handled_by, h.full_name as handler_name,
            o.created_at, o.updated_at
     FROM orders o
     JOIN users u ON o.customer_id = u.id
     JOIN cars c ON o.car_id = c.id
     LEFT JOIN users h ON o.handled_by = h.id
     WHERE o.id = ? LIMIT 1`,
    [id]
  );

  if (!rows.length) {
    throw new HttpError(404, "Không tìm thấy đơn hàng.");
  }

  const order = rows[0];

  if (currentUser && currentUser.role === "customer" && order.customer_id !== currentUser.id) {
    throw new HttpError(403, "Bạn không có quyền xem đơn hàng này.");
  }

  // Fetch payments for this order
  const [payments] = await pool.execute(
    "SELECT id, amount, method, transaction_id, status, paid_at, notes, created_at FROM payments WHERE order_id = ? ORDER BY id DESC",
    [id]
  );
  order.payments = payments;

  return order;
}

export async function listMyOrders(customerId, query) {
  const { page, limit, offset } = getPaginationParams(query, 10);

  const [countRows] = await pool.execute(
    "SELECT COUNT(*) as total FROM orders WHERE customer_id = ?",
    [customerId]
  );
  const total = Number(countRows[0].total);

  const [rows] = await pool.execute(
    `SELECT o.id, o.order_code, o.car_id, c.name as car_name, c.brand as car_brand,
            c.image_url as car_image, o.total_price, o.deposit_amount, o.status,
            o.payment_method, o.created_at
     FROM orders o
     JOIN cars c ON o.car_id = c.id
     WHERE o.customer_id = ?
     ORDER BY o.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    [customerId]
  );

  return {
    data: rows,
    meta: buildPaginationMeta(page, limit, total)
  };
}

export async function listAllOrders(query) {
  const { page, limit, offset } = getPaginationParams(query, 15);
  const where = [];
  const params = [];

  if (query.status) {
    where.push("o.status = ?");
    params.push(query.status);
  }

  if (query.search) {
    where.push("(o.order_code LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ?)");
    const term = `%${query.search.trim()}%`;
    params.push(term, term, term);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM orders o JOIN users u ON o.customer_id = u.id ${whereSql}`,
    params
  );
  const total = Number(countRows[0].total);

  const [rows] = await pool.execute(
    `SELECT o.id, o.order_code, o.customer_id, u.full_name as customer_name,
            u.phone as customer_phone, o.car_id, c.name as car_name, c.brand as car_brand,
            o.total_price, o.deposit_amount, o.status, o.payment_method,
            o.handled_by, o.created_at
     FROM orders o
     JOIN users u ON o.customer_id = u.id
     JOIN cars c ON o.car_id = c.id
     ${whereSql}
     ORDER BY o.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return {
    data: rows,
    meta: buildPaginationMeta(page, limit, total)
  };
}

export async function updateOrderStatus(id, { status, staffNote }, staffUser, req = null) {
  const order = await getOrderById(id);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE orders
       SET status = ?, staff_note = ?, handled_by = ?
       WHERE id = ?`,
      [status, staffNote !== undefined ? staffNote : order.staff_note, staffUser.id, id]
    );

    // Adjust car inventory status depending on order status transition
    if (status === "cancelled") {
      await connection.execute("UPDATE cars SET status = 'available' WHERE id = ?", [order.car_id]);
    } else if (status === "completed") {
      await connection.execute("UPDATE cars SET status = 'sold' WHERE id = ?", [order.car_id]);
    }

    await connection.commit();

    // Notify customer
    createNotification({
      userId: order.customer_id,
      type: "order_status_updated",
      title: "Cập nhật đơn hàng",
      message: `Đơn hàng ${order.order_code} của bạn đã được cập nhật sang trạng thái: "${status}".`,
      data: { orderId: id, status }
    }).catch(() => {});

    await recordActivity({
      userId: staffUser.id,
      action: "update_order_status",
      entityType: "order",
      entityId: id,
      oldValues: { status: order.status },
      newValues: { status, staffNote },
      req
    });

    return getOrderById(id);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function recordPayment(orderId, { amount, method, transactionId, notes }, staffUser, req = null) {
  const order = await getOrderById(orderId);

  const [result] = await pool.execute(
    `INSERT INTO payments (order_id, amount, method, transaction_id, status, paid_at, notes)
     VALUES (?, ?, ?, ?, 'completed', NOW(), ?)`,
    [orderId, Number(amount), method, transactionId || null, notes || null]
  );

  // If order was pending, advance to deposit_paid
  if (order.status === "pending") {
    await pool.execute(
      "UPDATE orders SET status = 'deposit_paid', handled_by = ? WHERE id = ?",
      [staffUser.id, orderId]
    );
  }

  // Notify customer
  createNotification({
    userId: order.customer_id,
    type: "payment_received",
    title: "Thanh toán thành công",
    message: `Đã ghi nhận thanh toán số tiền ${Number(amount).toLocaleString("vi-VN")} đ cho đơn hàng ${order.order_code}.`,
    data: { orderId, amount, paymentId: result.insertId }
  }).catch(() => {});

  await recordActivity({
    userId: staffUser.id,
    action: "record_payment",
    entityType: "payment",
    entityId: result.insertId,
    newValues: { orderId, amount, method, transactionId },
    req
  });

  return getOrderById(orderId);
}

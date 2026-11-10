import pool from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { emailService } from "./emailService.js";
import { createNotification } from "./notificationService.js";
import { recordActivity } from "./auditService.js";

const statuses = ["pending", "confirmed", "completed", "cancelled", "no_show"];

function formatBookingRow(b) {
  let bookingDate = "";
  let timeSlot = "09:00";
  if (b.scheduled_at) {
    const d = new Date(b.scheduled_at);
    if (!Number.isNaN(d.getTime())) {
      bookingDate = d.toISOString().split("T")[0];
      timeSlot = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
  }

  return {
    ...b,
    notes: b.note,
    booking_date: bookingDate,
    time_slot: timeSlot,
    car: {
      id: b.car_id,
      name: b.car_name,
      brand: b.brand,
      image_url: b.image_url,
      year: b.year || null
    },
    user: {
      id: b.customer_id,
      full_name: b.customer_name || null,
      phone: b.contact_phone || b.customer_phone || null,
      email: b.customer_email || null
    }
  };
}

export async function createBooking(customerId, data, req = null) {
  const carId = Number(data.carId || data.car_id);
  if (!Number.isInteger(carId) || carId < 1) {
    throw new HttpError(400, "Vui lòng chọn xe cần lái thử.");
  }

  let scheduledDateStr = data.scheduledAt;
  if (!scheduledDateStr && (data.booking_date || data.bookingDate)) {
    const d = data.booking_date || data.bookingDate;
    const t = data.time_slot || data.timeSlot || "09:00";
    scheduledDateStr = `${d}T${t}:00`;
  }

  const scheduled = scheduledDateStr ? new Date(scheduledDateStr) : null;
  if (!scheduled || Number.isNaN(scheduled.getTime())) {
    throw new HttpError(400, "Thời gian hẹn lái thử không hợp lệ.");
  }

  let contactPhone = (data.contactPhone || data.phone || req?.user?.phone || "").trim();
  if (!contactPhone || contactPhone.length < 8) {
    const [uRows] = await pool.execute("SELECT phone FROM users WHERE id = ? LIMIT 1", [customerId]);
    if (uRows.length && uRows[0].phone) {
      contactPhone = uRows[0].phone.trim();
    }
  }

  if (!contactPhone || contactPhone.length < 8) {
    contactPhone = "0900000000"; // fallback default
  }

  const note = data.note || data.notes || null;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [cars] = await connection.execute(
      "SELECT id, name, brand, year, image_url FROM cars WHERE id = ? AND status = 'available' FOR UPDATE",
      [carId]
    );
    if (!cars.length) throw new HttpError(409, "Xe không còn khả dụng để đặt lịch.");

    const car = cars[0];

    const [conflicts] = await connection.execute(
      `SELECT id FROM bookings WHERE car_id = ? AND scheduled_at = ?
       AND status IN ('pending','confirmed') FOR UPDATE`,
      [carId, scheduled]
    );
    if (conflicts.length) throw new HttpError(409, "Xe đã có lịch hẹn tại thời điểm này.");

    const [result] = await connection.execute(
      `INSERT INTO bookings (customer_id, car_id, scheduled_at, contact_phone, note)
       VALUES (?, ?, ?, ?, ?)`,
      [customerId, carId, scheduled, contactPhone, note]
    );
    const bookingId = result.insertId;

    await connection.commit();

    // Fetch customer info for email and notification
    const [users] = await pool.execute(
      "SELECT full_name, email FROM users WHERE id = ? LIMIT 1",
      [customerId]
    );
    if (users.length) {
      const user = users[0];
      emailService.sendBookingConfirmation(user.email, user.full_name, {
        carName: `${car.brand} ${car.name}`,
        scheduledAt: scheduled,
        phone: contactPhone,
        status: "Đang chờ duyệt"
      });

      createNotification({
        userId: customerId,
        type: "booking_created",
        title: "Đặt lịch lái thử thành công",
        message: `Lịch hẹn lái thử xe ${car.name} lúc ${scheduled.toLocaleString("vi-VN")} đã được gửi.`,
        data: { bookingId, carId }
      });
    }

    await recordActivity({
      userId: customerId,
      action: "create_booking",
      entityType: "booking",
      entityId: bookingId,
      req
    });

    return { id: bookingId, status: "pending" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listMyBookings(customerId) {
  const [rows] = await pool.execute(
    `SELECT b.id, b.car_id, c.name AS car_name, c.brand, c.image_url, c.year,
            b.scheduled_at, b.contact_phone, b.note, b.status, b.staff_note, b.created_at
     FROM bookings b JOIN cars c ON c.id = b.car_id
     WHERE b.customer_id = ? ORDER BY b.scheduled_at DESC`,
    [customerId]
  );
  return rows.map(formatBookingRow);
}

export async function listBookings(filters = {}) {
  const where = [];
  const params = [];
  const rawStatus = filters.status;
  if (rawStatus && rawStatus !== "all" && rawStatus !== "undefined" && rawStatus !== "") {
    // Only apply status filter if it's a valid value; silently ignore invalid ones
    if (statuses.includes(rawStatus)) {
      where.push("b.status = ?");
      params.push(rawStatus);
    }
  }
  const [rows] = await pool.execute(
    `SELECT b.*, c.name AS car_name, c.brand, c.image_url, c.year,
            u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
            h.full_name AS handler_name
     FROM bookings b
     JOIN cars c ON c.id = b.car_id
     JOIN users u ON u.id = b.customer_id
     LEFT JOIN users h ON h.id = b.handled_by
     ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY b.scheduled_at DESC LIMIT 200`,
    params
  );
  return rows.map(formatBookingRow);
}

export async function updateBooking(id, staffId, data, req = null) {
  if (!statuses.includes(data.status)) throw new HttpError(400, "Trạng thái lịch hẹn không hợp lệ.");

  const [bookingRows] = await pool.execute(
    `SELECT b.id, b.customer_id, b.scheduled_at, c.name as car_name
     FROM bookings b JOIN cars c ON b.car_id = c.id
     WHERE b.id = ? LIMIT 1`,
    [id]
  );
  if (!bookingRows.length) throw new HttpError(404, "Không tìm thấy lịch hẹn.");

  const booking = bookingRows[0];
  const staffNote = data.staffNote || data.staff_note || null;

  const [result] = await pool.execute(
    "UPDATE bookings SET status = ?, handled_by = ?, staff_note = ? WHERE id = ?",
    [data.status, staffId, staffNote, id]
  );
  if (!result.affectedRows) throw new HttpError(404, "Không tìm thấy lịch hẹn.");

  createNotification({
    userId: booking.customer_id,
    type: "booking_status_updated",
    title: "Cập nhật lịch hẹn lái thử",
    message: `Lịch hẹn lái thử xe ${booking.car_name} đã chuyển sang trạng thái: "${data.status}".`,
    data: { bookingId: id, status: data.status }
  });

  await recordActivity({
    userId: staffId,
    action: "update_booking_status",
    entityType: "booking",
    entityId: id,
    newValues: { status: data.status, staffNote },
    req
  });

  return { id: Number(id), status: data.status };
}

export async function cancelMyBooking(id, customerId, req = null) {
  const [result] = await pool.execute(
    `UPDATE bookings SET status = 'cancelled'
     WHERE id = ? AND customer_id = ? AND status = 'pending'`,
    [id, customerId]
  );
  if (!result.affectedRows) {
    throw new HttpError(409, "Không tìm thấy lịch hẹn hoặc lịch hẹn không còn ở trạng thái chờ.");
  }

  await recordActivity({
    userId: customerId,
    action: "cancel_booking",
    entityType: "booking",
    entityId: id,
    req
  });
}

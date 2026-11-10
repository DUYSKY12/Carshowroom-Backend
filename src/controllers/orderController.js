import * as orderService from "../services/orderService.js";
import { validateCoupon, getAvailableCoupons } from "../services/discountService.js";

export async function checkCoupon(req, res) {
  const { code, carPrice } = req.body;
  const result = validateCoupon(code, carPrice);
  res.json({
    success: true,
    message: `Áp dụng mã giảm giá "${result.code}" thành công!`,
    data: result
  });
}

export async function listAvailableCoupons(req, res) {
  const coupons = getAvailableCoupons();
  res.json({
    success: true,
    data: coupons
  });
}

export async function createOrder(req, res) {
  const result = await orderService.createOrder(req.user.id, req.body, req);
  res.status(201).json({
    success: true,
    message: "Đặt mua xe thành công.",
    data: result
  });
}

export async function getOrder(req, res) {
  const order = await orderService.getOrderById(req.params.id, req.user);
  res.json({
    success: true,
    data: order
  });
}

export async function listMyOrders(req, res) {
  const result = await orderService.listMyOrders(req.user.id, req.query);
  res.json({
    success: true,
    data: result.data,
    meta: result.meta
  });
}

export async function listAllOrders(req, res) {
  const result = await orderService.listAllOrders(req.query);
  res.json({
    success: true,
    data: result.data,
    meta: result.meta
  });
}

export async function updateOrderStatus(req, res) {
  const result = await orderService.updateOrderStatus(req.params.id, req.body, req.user, req);
  res.json({
    success: true,
    message: "Cập nhật trạng thái đơn hàng thành công.",
    data: result
  });
}

export async function recordPayment(req, res) {
  const result = await orderService.recordPayment(req.params.id, req.body, req.user, req);
  res.status(201).json({
    success: true,
    message: "Ghi nhận thanh toán thành công.",
    data: result
  });
}

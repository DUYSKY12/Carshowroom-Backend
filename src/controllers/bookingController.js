import * as bookingService from "../services/bookingService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const createBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.createBooking(req.user.id, req.body, req);
  res.status(201).json({ success: true, data });
});

export const myBookings = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await bookingService.listMyBookings(req.user.id) });
});

export const allBookings = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await bookingService.listBookings(req.query) });
});

export const updateBooking = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await bookingService.updateBooking(req.params.id, req.user.id, req.body, req) });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  await bookingService.cancelMyBooking(req.params.id, req.user.id, req);
  res.json({ success: true, message: "Đã hủy lịch hẹn." });
});

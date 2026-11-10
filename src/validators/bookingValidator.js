import { z } from "zod";

export const createBookingSchema = z.object({
  carId: z.coerce.number().int().positive().optional(),
  car_id: z.coerce.number().int().positive().optional(),
  scheduledAt: z.string().optional(),
  booking_date: z.string().optional(),
  time_slot: z.string().optional(),
  contactPhone: z.string().max(30).trim().optional().nullable(),
  phone: z.string().max(30).trim().optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
}).refine(data => data.carId || data.car_id, {
  message: "Vui lòng chọn xe",
  path: ["carId"]
}).refine(data => {
  const dtStr = data.scheduledAt || (data.booking_date ? `${data.booking_date}T${data.time_slot || "09:00"}:00` : null);
  if (!dtStr) return false;
  const date = new Date(dtStr);
  return !Number.isNaN(date.getTime());
}, {
  message: "Thời gian hẹn không hợp lệ",
  path: ["scheduledAt"]
});

export const updateBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
  staffNote: z.string().max(1000).optional().nullable(),
  staff_note: z.string().max(1000).optional().nullable()
});

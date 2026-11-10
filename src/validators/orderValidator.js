import { z } from "zod";

export const createOrderSchema = z.object({
  carId: z.coerce.number().int().positive("Vui lòng chọn xe").optional(),
  car_id: z.coerce.number().int().positive("Vui lòng chọn xe").optional(),
  paymentMethod: z.string().max(50).optional().nullable(),
  payment_method: z.string().max(50).optional().nullable(),
  customerNote: z.string().max(2000).optional().nullable(),
  customer_note: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  couponCode: z.string().max(50).optional().nullable(),
  coupon_code: z.string().max(50).optional().nullable(),
  depositAmount: z.coerce.number().min(0).optional().nullable(),
  deposit_amount: z.coerce.number().min(0).optional().nullable()
}).transform(data => {
  data.carId = data.carId || data.car_id;
  data.paymentMethod = data.paymentMethod || data.payment_method || "bank_transfer";
  data.customerNote = data.customerNote || data.customer_note || data.notes || "";
  data.couponCode = data.couponCode || data.coupon_code || null;
  data.depositAmount = data.depositAmount ?? data.deposit_amount ?? null;
  return data;
});

export const checkCouponSchema = z.object({
  code: z.string().min(1, "Vui lòng nhập mã giảm giá").max(50),
  carPrice: z.coerce.number().min(0, "Giá xe không hợp lệ")
});

export const updateOrderSchema = z.object({
  status: z.enum(["pending", "deposit_paid", "processing", "completed", "cancelled"]),
  staffNote: z.string().max(2000).optional().nullable()
});

export const createPaymentSchema = z.object({
  amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
  method: z.string().min(1).max(50),
  transactionId: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable()
});

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Đánh giá tối thiểu 1 sao").max(5, "Đánh giá tối đa 5 sao"),
  title: z.string().max(200).optional().nullable(),
  content: z.string().max(5000).optional().nullable()
});

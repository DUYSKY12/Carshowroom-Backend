import { z } from "zod";

export const createLeadSchema = z.object({
  customerName: z.string().min(2, "Họ tên tối thiểu 2 ký tự").max(120).trim().optional(),
  customer_name: z.string().min(2, "Họ tên tối thiểu 2 ký tự").max(120).trim().optional(),
  email: z.string().max(190).optional().nullable(),
  phone: z.string().min(8, "Số điện thoại tối thiểu 8 ký tự").max(30).trim(),
  carId: z.coerce.number().int().positive().optional().nullable(),
  car_id: z.coerce.number().int().positive().optional().nullable(),
  budgetMin: z.coerce.number().min(0).optional().nullable(),
  budget_min: z.coerce.number().min(0).optional().nullable(),
  budgetMax: z.coerce.number().min(0).optional().nullable(),
  budget_max: z.coerce.number().min(0).optional().nullable(),
  purpose: z.string().max(255).optional().nullable(),
  source: z.enum(["website", "ai_chat", "phone", "walk_in", "other"]).optional().default("website"),
  notes: z.string().max(2000).optional().nullable()
}).refine(data => data.customerName || data.customer_name, {
  message: "Họ tên tối thiểu 2 ký tự",
  path: ["customerName"]
});

export const updateLeadSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "negotiating", "won", "lost"]),
  assignedTo: z.coerce.number().int().positive().optional().nullable(),
  assigned_to: z.coerce.number().int().positive().optional().nullable(),
  notes: z.string().max(2000).optional().nullable()
});

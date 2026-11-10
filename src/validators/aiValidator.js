import { z } from "zod";

export const aiRecommendSchema = z.object({
  budget: z.coerce.number().positive("Ngân sách phải lớn hơn 0"),
  seats: z.coerce.number().int().min(1).max(60).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  fuelType: z.enum(["gasoline", "diesel", "electric", "hybrid", "other"]).optional().nullable(),
  bodyType: z.enum(["sedan", "suv", "hatchback", "coupe", "convertible", "wagon", "van", "truck", "pickup", "mpv", "other"]).optional().nullable(),
  purpose: z.string().max(300).optional().nullable()
});

export const aiChatSchema = z.object({
  message: z.string().min(1, "Vui lòng nhập tin nhắn").max(2000),
  sessionId: z.coerce.number().int().positive().optional().nullable()
});

export const aiSearchSchema = z.object({
  query: z.string().min(1, "Vui lòng nhập nội dung tìm kiếm").max(500)
});

export const aiPriceEstimateSchema = z.object({
  brand: z.string().min(1).max(100),
  model: z.string().max(100).optional().nullable(),
  year: z.coerce.number().int().min(1886).max(2030),
  mileage_km: z.coerce.number().int().min(0).optional().default(0),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]).optional().default("good")
});

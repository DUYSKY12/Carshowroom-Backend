import { z } from "zod";

const fuelTypes = ["gasoline", "diesel", "electric", "hybrid", "other"];
const transmissions = ["automatic", "manual", "other"];
const bodyTypes = ["sedan", "suv", "hatchback", "coupe", "convertible", "wagon", "van", "truck", "pickup", "mpv", "other"];
const statuses = ["available", "reserved", "sold", "hidden"];

const baseCarSchema = z.object({
  name: z.string().min(1).max(150).trim(),
  brand: z.string().min(1).max(100).trim(),
  model: z.string().max(100).optional().nullable(),
  year: z.coerce.number().int().min(1886).max(2030),
  price: z.coerce.number().min(0),
  fuel_type: z.enum(fuelTypes).optional().default("gasoline"),
  transmission: z.enum(transmissions).optional().default("automatic"),
  body_type: z.enum(bodyTypes).optional().nullable(),
  engine_capacity: z.any().optional().nullable().transform(v => v != null && v !== "" ? String(v) : null),
  horsepower: z.coerce.number().int().min(0).max(5000).optional().nullable(),
  torque: z.string().max(50).optional().nullable(),
  drive_type: z.enum(["fwd", "rwd", "awd", "4wd"]).optional().nullable(),
  seats: z.coerce.number().int().min(1).max(60).optional().nullable(),
  mileage_km: z.coerce.number().int().min(0).optional().nullable(),
  mileage: z.coerce.number().int().min(0).optional().nullable(),
  color: z.string().max(60).optional().nullable(),
  interior_color: z.string().max(60).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  features: z.any().optional().nullable(),
  image_url: z.string().max(500).optional().nullable(),
  status: z.enum(statuses).optional().default("available")
});

export const createCarSchema = baseCarSchema.transform(data => {
  // Map mileage -> mileage_km if mileage_km is missing
  if (data.mileage_km == null && data.mileage != null) {
    data.mileage_km = data.mileage;
  }
  delete data.mileage;
  return data;
});

export const updateCarSchema = baseCarSchema.partial().transform(data => {
  if (data.mileage_km == null && data.mileage != null) {
    data.mileage_km = data.mileage;
  }
  delete data.mileage;
  return data;
});

export const carQuerySchema = z.object({
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  year: z.coerce.number().int().optional(),
  fuelType: z.enum(fuelTypes).optional(),
  transmission: z.enum(transmissions).optional(),
  bodyType: z.enum(bodyTypes).optional(),
  keyword: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12)
});

export const compareSchema = z.object({
  carIds: z.array(z.coerce.number().int().positive()).min(2).max(4)
});

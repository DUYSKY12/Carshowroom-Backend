import pool from "../config/db.js";
import { config } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export async function recommendCars(input, userId = null) {
  const budget = Number(input.budget);
  if (!Number.isFinite(budget) || budget <= 0) {
    throw new HttpError(400, "Ngân sách phải là số lớn hơn 0.");
  }

  const seats = input.seats == null ? null : Number(input.seats);
  if (seats != null && (!Number.isInteger(seats) || seats < 1 || seats > 60)) {
    throw new HttpError(400, "Số chỗ ngồi không hợp lệ.");
  }

  const where = ["status='available'", "price <= ?"];
  const params = [budget];
  if (input.brand) { where.push("brand=?"); params.push(input.brand); }
  if (input.fuelType) { where.push("fuel_type=?"); params.push(input.fuelType); }
  if (seats) { where.push("seats >= ?"); params.push(seats); }

  const [cars] = await pool.execute(
    `SELECT id, name, brand, model, year, price, fuel_type, transmission,
      seats, mileage_km, description, image_url
     FROM cars WHERE ${where.join(" AND ")}
     ORDER BY price ASC LIMIT 10`,
    params
  );

  const purpose = typeof input.purpose === "string" ? input.purpose.slice(0, 300) : "";
  const response = {
    provider: config.aiProvider,
    mode: "rule_based",
    explanation: cars.length
      ? `Tìm thấy ${cars.length} mẫu xe đang có trong dữ liệu, nằm trong ngân sách ${budget.toLocaleString("vi-VN")} VND${purpose ? ` và có thể xem xét theo nhu cầu: ${purpose}` : ""}. Hãy kiểm tra thông số và liên hệ showroom trước khi quyết định.`
      : "Chưa tìm thấy xe phù hợp với các tiêu chí hiện tại. Bạn có thể tăng ngân sách hoặc thay đổi bộ lọc.",
    recommendations: cars
  };

  await pool.execute(
    `INSERT INTO ai_interactions (user_id, intent, request_summary, response_summary, recommended_car_ids, provider)
     VALUES (?, 'car_recommendation', ?, ?, ?, ?)`,
    [
      userId, JSON.stringify({ budget, seats, brand: input.brand || null, fuelType: input.fuelType || null, purpose }),
      response.explanation, JSON.stringify(cars.map(car => car.id)), config.aiProvider
    ]
  );

  return response;
}

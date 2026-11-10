import pool from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";

export async function addFavorite(userId, carId) {
  // Check car exists
  const [car] = await pool.execute("SELECT id FROM cars WHERE id = ? LIMIT 1", [carId]);
  if (!car.length) {
    throw new HttpError(404, "Không tìm thấy xe.");
  }

  try {
    await pool.execute(
      "INSERT INTO favorites (user_id, car_id) VALUES (?, ?)",
      [userId, carId]
    );
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return { success: true, message: "Xe này đã có trong danh sách yêu thích của bạn." };
    }
    throw err;
  }

  return { success: true, message: "Đã thêm vào danh sách yêu thích." };
}

export async function removeFavorite(userId, carId) {
  const [result] = await pool.execute(
    "DELETE FROM favorites WHERE user_id = ? AND car_id = ?",
    [userId, carId]
  );

  if (!result.affectedRows) {
    throw new HttpError(404, "Xe không nằm trong danh sách yêu thích.");
  }

  return { success: true, message: "Đã xóa khỏi danh sách yêu thích." };
}

export async function listFavorites(userId, query) {
  const { page, limit, offset } = getPaginationParams(query, 12);

  const [countRows] = await pool.execute(
    "SELECT COUNT(*) as total FROM favorites WHERE user_id = ?",
    [userId]
  );
  const total = Number(countRows[0].total);

  const [rows] = await pool.execute(
    `SELECT f.id as favorite_id, f.created_at as favorited_at,
            c.id, c.name, c.brand, c.model, c.year, c.price,
            c.fuel_type, c.transmission, c.body_type, c.seats,
            c.mileage_km, c.color, c.image_url, c.status
     FROM favorites f
     JOIN cars c ON f.car_id = c.id
     WHERE f.user_id = ?
     ORDER BY f.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    [userId]
  );

  return {
    data: rows,
    meta: buildPaginationMeta(page, limit, total)
  };
}

export async function checkFavorite(userId, carId) {
  const [rows] = await pool.execute(
    "SELECT id FROM favorites WHERE user_id = ? AND car_id = ? LIMIT 1",
    [userId, carId]
  );
  return { isFavorited: rows.length > 0 };
}

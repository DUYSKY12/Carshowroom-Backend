import pool from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";

export async function createReview(userId, carId, { rating, title, content }) {
  const [car] = await pool.execute("SELECT id FROM cars WHERE id = ? LIMIT 1", [carId]);
  if (!car.length) {
    throw new HttpError(404, "Không tìm thấy xe.");
  }

  const [existing] = await pool.execute(
    "SELECT id FROM reviews WHERE user_id = ? AND car_id = ? LIMIT 1",
    [userId, carId]
  );
  if (existing.length) {
    throw new HttpError(409, "Bạn đã gửi đánh giá cho chiếc xe này rồi.");
  }

  const [result] = await pool.execute(
    `INSERT INTO reviews (user_id, car_id, rating, title, content, is_approved)
     VALUES (?, ?, ?, ?, ?, TRUE)`, // Set to true by default or configurable
    [userId, carId, Number(rating), title ? title.trim() : null, content ? content.trim() : null]
  );

  return getReviewById(result.insertId);
}

export async function getReviewById(id) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.user_id, u.full_name as user_name, u.avatar_url as user_avatar,
            r.car_id, c.name as car_name, r.rating, r.title, r.content,
            r.is_approved, r.created_at, r.updated_at
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     JOIN cars c ON r.car_id = c.id
     WHERE r.id = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) {
    throw new HttpError(404, "Không tìm thấy đánh giá.");
  }
  return rows[0];
}

export async function listCarReviews(carId, query) {
  const { page, limit, offset } = getPaginationParams(query, 10);

  const [countRows] = await pool.execute(
    "SELECT COUNT(*) as total FROM reviews WHERE car_id = ? AND is_approved = TRUE",
    [carId]
  );
  const total = Number(countRows[0].total);

  // Compute average rating
  const [avgRows] = await pool.execute(
    "SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE car_id = ? AND is_approved = TRUE",
    [carId]
  );
  const avgRating = Number(avgRows[0].avg_rating || 0).toFixed(1);

  const [rows] = await pool.execute(
    `SELECT r.id, r.user_id, u.full_name as user_name, u.avatar_url as user_avatar,
            r.rating, r.title, r.content, r.created_at
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.car_id = ? AND r.is_approved = TRUE
     ORDER BY r.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    [carId]
  );

  return {
    data: rows,
    summary: {
      averageRating: Number(avgRating),
      totalReviews: total
    },
    meta: buildPaginationMeta(page, limit, total)
  };
}

export async function listAllReviews(query) {
  const { page, limit, offset } = getPaginationParams(query, 15);
  const where = [];
  const params = [];

  if (query.isApproved !== undefined && query.isApproved !== "") {
    where.push("r.is_approved = ?");
    params.push(query.isApproved === "true" || query.isApproved === true);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM reviews r ${whereSql}`,
    params
  );
  const total = Number(countRows[0].total);

  const [rows] = await pool.execute(
    `SELECT r.id, r.user_id, u.full_name as user_name, u.email as user_email,
            r.car_id, c.name as car_name, c.brand as car_brand,
            r.rating, r.title, r.content, r.is_approved, r.created_at
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     JOIN cars c ON r.car_id = c.id
     ${whereSql}
     ORDER BY r.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return {
    data: rows,
    meta: buildPaginationMeta(page, limit, total)
  };
}

export async function approveReview(id, isApproved = true) {
  const [result] = await pool.execute(
    "UPDATE reviews SET is_approved = ? WHERE id = ?",
    [isApproved, id]
  );
  if (!result.affectedRows) {
    throw new HttpError(404, "Không tìm thấy đánh giá.");
  }
  return { success: true, message: isApproved ? "Đã duyệt đánh giá." : "Đã hủy duyệt đánh giá." };
}

export async function deleteReview(id, currentUser) {
  const [rows] = await pool.execute("SELECT user_id FROM reviews WHERE id = ? LIMIT 1", [id]);
  if (!rows.length) {
    throw new HttpError(404, "Không tìm thấy đánh giá.");
  }

  const review = rows[0];
  if (currentUser.role !== "admin" && review.user_id !== currentUser.id) {
    throw new HttpError(403, "Bạn không có quyền xóa đánh giá này.");
  }

  await pool.execute("DELETE FROM reviews WHERE id = ?", [id]);
  return { success: true, message: "Đã xóa đánh giá thành công." };
}

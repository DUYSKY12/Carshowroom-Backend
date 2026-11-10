import pool from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";
import logger from "../config/logger.js";

export async function createNotification({ userId, type, title, message, data = null }) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, type, title, message, data, is_read)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );
    return { id: result.insertId };
  } catch (err) {
    logger.error(`Failed to create notification: ${err.message}`);
    return null;
  }
}

export async function listUserNotifications(userId, query) {
  const { page, limit, offset } = getPaginationParams(query, 15);
  const where = ["user_id = ?"];
  const params = [userId];

  if (query.unreadOnly === "true") {
    where.push("is_read = FALSE");
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM notifications ${whereSql}`,
    params
  );
  const total = Number(countRows[0].total);

  const [rows] = await pool.execute(
    `SELECT id, type, title, message, data, is_read, created_at
     FROM notifications
     ${whereSql}
     ORDER BY id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return {
    data: rows,
    meta: buildPaginationMeta(page, limit, total)
  };
}

export async function markAsRead(id, userId) {
  const [result] = await pool.execute(
    "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  if (!result.affectedRows) {
    throw new HttpError(404, "Không tìm thấy thông báo.");
  }
  return { success: true, message: "Đã đánh dấu đã đọc." };
}

export async function markAllAsRead(userId) {
  await pool.execute(
    "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
    [userId]
  );
  return { success: true, message: "Đã đánh dấu tất cả là đã đọc." };
}

export async function getUnreadCount(userId) {
  const [rows] = await pool.execute(
    "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
    [userId]
  );
  return { unreadCount: Number(rows[0].count) };
}

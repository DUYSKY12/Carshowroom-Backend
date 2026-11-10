import pool from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";
import { recordActivity } from "./auditService.js";

/**
 * List all users with filtering and pagination (Admin only)
 */
export async function listUsers(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const conditions = [];
  const params = [];

  if (query.role) {
    conditions.push("role = ?");
    params.push(query.role);
  }

  if (query.isActive !== undefined && query.isActive !== "") {
    conditions.push("is_active = ?");
    params.push(query.isActive === "true" || query.isActive === true);
  }

  if (query.search) {
    conditions.push("(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)");
    const searchTerm = `%${query.search.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count total
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM users ${whereClause}`,
    params
  );
  const total = Number(countRows[0].total);

  // Fetch paginated
  const [rows] = await pool.execute(
    `SELECT id, full_name, email, phone, role, avatar_url, email_verified, is_active, created_at, updated_at
     FROM users
     ${whereClause}
     ORDER BY id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return {
    data: rows,
    meta: buildPaginationMeta(page, limit, total)
  };
}

/**
 * Get user by ID (Admin only)
 */
export async function getUserById(id) {
  const [rows] = await pool.execute(
    `SELECT id, full_name, email, phone, role, avatar_url, email_verified, is_active, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) {
    throw new HttpError(404, "Không tìm thấy người dùng.");
  }
  return rows[0];
}

/**
 * Update user role or active status (Admin only)
 */
export async function updateUser(id, { role, isActive }, adminUser, req = null) {
  const targetUser = await getUserById(id);

  if (targetUser.id === adminUser.id && isActive === false) {
    throw new HttpError(400, "Bạn không thể tự vô hiệu hóa tài khoản của chính mình.");
  }

  const updates = [];
  const params = [];

  if (role !== undefined) {
    if (!["customer", "sales", "admin"].includes(role)) {
      throw new HttpError(400, "Role không hợp lệ.");
    }
    updates.push("role = ?");
    params.push(role);
  }

  if (isActive !== undefined) {
    updates.push("is_active = ?");
    params.push(Boolean(isActive));
  }

  if (updates.length > 0) {
    params.push(id);
    await pool.execute(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    // If deactivated, revoke all refresh tokens
    if (isActive === false) {
      await pool.execute(
        "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?",
        [id]
      );
    }

    await recordActivity({
      userId: adminUser.id,
      action: "admin_update_user",
      entityType: "user",
      entityId: id,
      oldValues: { role: targetUser.role, is_active: targetUser.is_active },
      newValues: { role, is_active: isActive },
      req
    });
  }

  return getUserById(id);
}

/**
 * Get system activity logs (Admin only)
 */
export async function getActivityLogs(query) {
  const { page, limit, offset } = getPaginationParams(query, 20);
  const conditions = [];
  const params = [];

  if (query.userId) {
    conditions.push("l.user_id = ?");
    params.push(query.userId);
  }

  if (query.entityType) {
    conditions.push("l.entity_type = ?");
    params.push(query.entityType);
  }

  if (query.action) {
    conditions.push("l.action = ?");
    params.push(query.action);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM activity_logs l ${whereClause}`,
    params
  );
  const total = Number(countRows[0].total);

  const [rows] = await pool.execute(
    `SELECT l.id, l.user_id, u.full_name as user_name, u.email as user_email,
            l.action, l.entity_type, l.entity_id, l.old_values, l.new_values,
            l.ip_address, l.user_agent, l.created_at
     FROM activity_logs l
     LEFT JOIN users u ON l.user_id = u.id
     ${whereClause}
     ORDER BY l.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return {
    data: rows,
    meta: buildPaginationMeta(page, limit, total)
  };
}

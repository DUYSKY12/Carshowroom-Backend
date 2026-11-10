import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { config } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { emailService } from "./emailService.js";
import { recordActivity } from "./auditService.js";

/**
 * Register a new user account
 */
export async function register({ fullName, email, phone, password }, req = null) {
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await pool.execute(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail]
  );
  if (existing.length) {
    throw new HttpError(409, "Email đã được đăng ký trong hệ thống.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [result] = await pool.execute(
    `INSERT INTO users (full_name, email, phone, password_hash, role, email_verified, is_active)
     VALUES (?, ?, ?, ?, 'customer', FALSE, TRUE)`,
    [fullName.trim(), normalizedEmail, phone || null, passwordHash]
  );

  const userId = result.insertId;

  // Generate 6-digit email verification code
  const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await pool.execute(
    `INSERT INTO email_verifications (user_id, code, expires_at)
     VALUES (?, ?, ?)`,
    [userId, verifyCode, expiresAt]
  );

  // Send verification email asynchronously
  emailService.sendVerificationEmail(normalizedEmail, fullName.trim(), verifyCode);

  await recordActivity({
    userId,
    action: "register",
    entityType: "user",
    entityId: userId,
    req
  });

  return createAuthSession(userId);
}

/**
 * Login with email and password
 */
export async function login({ email, password }, req = null) {
  const normalizedEmail = email.trim().toLowerCase();

  const [rows] = await pool.execute(
    `SELECT id, full_name, email, role, password_hash, is_active, email_verified
     FROM users WHERE email = ? LIMIT 1`,
    [normalizedEmail]
  );

  if (!rows.length) {
    throw new HttpError(401, "Email hoặc mật khẩu không chính xác.");
  }

  const user = rows[0];

  if (!user.is_active) {
    throw new HttpError(403, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new HttpError(401, "Email hoặc mật khẩu không chính xác.");
  }

  await recordActivity({
    userId: user.id,
    action: "login",
    entityType: "user",
    entityId: user.id,
    req
  });

  return createAuthSession(user.id);
}

/**
 * Refresh access token using a valid refresh token
 */
export async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new HttpError(400, "Vui lòng cung cấp Refresh Token.");
  }

  const tokenHash = hashToken(refreshToken);

  const [rows] = await pool.execute(
    `SELECT id, user_id, expires_at, revoked_at
     FROM refresh_tokens
     WHERE token_hash = ? LIMIT 1`,
    [tokenHash]
  );

  if (!rows.length) {
    throw new HttpError(401, "Refresh Token không hợp lệ.");
  }

  const tokenRecord = rows[0];

  if (tokenRecord.revoked_at) {
    throw new HttpError(401, "Refresh Token đã bị thu hồi.");
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    throw new HttpError(401, "Refresh Token đã hết hạn. Vui lòng đăng nhập lại.");
  }

  // Revoke current token (rotation)
  await pool.execute(
    "UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?",
    [tokenRecord.id]
  );

  // Check if user is still active
  const [userRows] = await pool.execute(
    "SELECT id, is_active FROM users WHERE id = ? LIMIT 1",
    [tokenRecord.user_id]
  );

  if (!userRows.length || !userRows[0].is_active) {
    throw new HttpError(403, "Tài khoản không còn hiệu lực.");
  }

  // Issue new session
  return createAuthSession(tokenRecord.user_id);
}

/**
 * Revoke refresh token on logout
 */
export async function logout(refreshToken) {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await pool.execute(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?",
      [tokenHash]
    );
  }
  return { success: true, message: "Đăng xuất thành công." };
}

/**
 * Verify email with 6-digit code
 */
export async function verifyEmail(email, code) {
  const normalizedEmail = email.trim().toLowerCase();

  const [userRows] = await pool.execute(
    "SELECT id, full_name, email_verified FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail]
  );

  if (!userRows.length) {
    throw new HttpError(404, "Không tìm thấy người dùng với email này.");
  }

  const user = userRows[0];
  if (user.email_verified) {
    return { message: "Email đã được xác minh trước đó." };
  }

  const [codes] = await pool.execute(
    `SELECT id, expires_at, verified_at
     FROM email_verifications
     WHERE user_id = ? AND code = ?
     ORDER BY id DESC LIMIT 1`,
    [user.id, code.trim()]
  );

  if (!codes.length) {
    throw new HttpError(400, "Mã xác minh không chính xác.");
  }

  const verification = codes[0];

  if (verification.verified_at) {
    return { message: "Mã xác minh này đã được sử dụng." };
  }

  if (new Date(verification.expires_at) < new Date()) {
    throw new HttpError(400, "Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới.");
  }

  await pool.execute(
    "UPDATE email_verifications SET verified_at = NOW() WHERE id = ?",
    [verification.id]
  );

  await pool.execute(
    "UPDATE users SET email_verified = TRUE WHERE id = ?",
    [user.id]
  );

  return { success: true, message: "Xác minh email thành công!" };
}

/**
 * Resend verification email
 */
export async function resendVerification(email) {
  const normalizedEmail = email.trim().toLowerCase();

  const [userRows] = await pool.execute(
    "SELECT id, full_name, email_verified FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail]
  );

  if (!userRows.length) {
    throw new HttpError(404, "Không tìm thấy người dùng.");
  }

  const user = userRows[0];
  if (user.email_verified) {
    throw new HttpError(400, "Tài khoản của bạn đã được xác minh.");
  }

  const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await pool.execute(
    `INSERT INTO email_verifications (user_id, code, expires_at)
     VALUES (?, ?, ?)`,
    [user.id, verifyCode, expiresAt]
  );

  await emailService.sendVerificationEmail(normalizedEmail, user.full_name, verifyCode);

  return { success: true, message: "Mã xác minh mới đã được gửi tới email của bạn." };
}

/**
 * Request password reset link
 */
export async function forgotPassword(email) {
  const normalizedEmail = email.trim().toLowerCase();

  const [rows] = await pool.execute(
    "SELECT id, full_name FROM users WHERE email = ? AND is_active = TRUE LIMIT 1",
    [normalizedEmail]
  );

  // Even if user not found, don't reveal to prevent user enumeration
  if (!rows.length) {
    return { success: true, message: "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi." };
  }

  const user = rows[0];
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.execute(
    `INSERT INTO password_resets (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [user.id, tokenHash, expiresAt]
  );

  emailService.sendPasswordResetEmail(normalizedEmail, user.full_name, rawToken);

  return { success: true, message: "Liên kết đặt lại mật khẩu đã được gửi tới email của bạn." };
}

/**
 * Reset password using token
 */
export async function resetPassword({ token, newPassword }) {
  const tokenHash = hashToken(token);

  const [rows] = await pool.execute(
    `SELECT id, user_id, expires_at, used_at
     FROM password_resets
     WHERE token_hash = ? LIMIT 1`,
    [tokenHash]
  );

  if (!rows.length || rows[0].used_at) {
    throw new HttpError(400, "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã qua sử dụng.");
  }

  const resetRecord = rows[0];
  if (new Date(resetRecord.expires_at) < new Date()) {
    throw new HttpError(400, "Liên kết đặt lại mật khẩu đã hết hạn.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await pool.execute(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [passwordHash, resetRecord.user_id]
  );

  await pool.execute(
    "UPDATE password_resets SET used_at = NOW() WHERE id = ?",
    [resetRecord.id]
  );

  // Revoke all existing refresh tokens for security
  await pool.execute(
    "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?",
    [resetRecord.user_id]
  );

  return { success: true, message: "Mật khẩu đã được thay đổi thành công. Vui lòng đăng nhập lại." };
}

/**
 * Get profile of current user
 */
export async function getProfile(userId) {
  const [rows] = await pool.execute(
    `SELECT id, full_name, email, phone, role, avatar_url, email_verified, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );

  if (!rows.length) {
    throw new HttpError(404, "Không tìm thấy người dùng.");
  }

  return rows[0];
}

/**
 * Update profile of current user
 */
export async function updateProfile(userId, { fullName, phone, avatarUrl }) {
  const updates = [];
  const params = [];

  if (fullName !== undefined) {
    updates.push("full_name = ?");
    params.push(fullName.trim());
  }
  if (phone !== undefined) {
    updates.push("phone = ?");
    params.push(phone ? phone.trim() : null);
  }
  if (avatarUrl !== undefined) {
    updates.push("avatar_url = ?");
    params.push(avatarUrl);
  }

  if (updates.length > 0) {
    params.push(userId);
    await pool.execute(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
  }

  return getProfile(userId);
}

/**
 * Change password
 */
export async function changePassword(userId, { currentPassword, newPassword }) {
  const [rows] = await pool.execute(
    "SELECT password_hash FROM users WHERE id = ? LIMIT 1",
    [userId]
  );

  if (!rows.length) {
    throw new HttpError(404, "Người dùng không tồn tại.");
  }

  const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!isMatch) {
    throw new HttpError(400, "Mật khẩu hiện tại không chính xác.");
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, userId]);

  return { success: true, message: "Đổi mật khẩu thành công." };
}

// ─────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createAuthSession(userId) {
  const [rows] = await pool.execute(
    `SELECT id, full_name, email, phone, role, avatar_url, email_verified
     FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );

  const user = rows[0];

  const accessToken = jwt.sign(
    { sub: String(user.id), role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  // Generate random refresh token
  const rawRefreshToken = crypto.randomBytes(40).toString("hex");
  const refreshTokenHash = hashToken(rawRefreshToken);
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await pool.execute(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [user.id, refreshTokenHash, refreshExpiresAt]
  );

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    expiresIn: config.jwtExpiresIn,
    user
  };
}

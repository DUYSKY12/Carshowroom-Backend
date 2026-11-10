import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { asyncHandler } from "./asyncHandler.js";
import pool from "../config/db.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Vui lòng đăng nhập để tiếp tục.");
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, "Token không hợp lệ hoặc đã hết hạn.");
  }

  const [rows] = await pool.execute(
    "SELECT id, full_name, email, phone, role, is_active FROM users WHERE id = ? LIMIT 1",
    [payload.sub]
  );

  if (!rows.length || !rows[0].is_active) {
    throw new HttpError(401, "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
  }

  req.user = rows[0];
  next();
});

export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme === "Bearer" && token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      const [rows] = await pool.execute(
        "SELECT id, full_name, email, phone, role, is_active FROM users WHERE id = ? LIMIT 1",
        [payload.sub]
      );
      if (rows.length && rows[0].is_active) {
        req.user = rows[0];
      }
    } catch {
      // Ignore token verification errors for optional auth
    }
  }
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new HttpError(403, "Bạn không có quyền thực hiện thao tác này."));
  }
  next();
};

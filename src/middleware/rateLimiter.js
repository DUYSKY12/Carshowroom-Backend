import rateLimit from "express-rate-limit";

/** Default API rate limit */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Quá nhiều yêu cầu, vui lòng thử lại sau." }
});

export const apiLimiter = globalLimiter;

/** Strict limit for auth endpoints (login, register, password reset) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Quá nhiều lần thử đăng nhập, vui lòng chờ 15 phút." }
});

/** Limit for AI endpoints to save API tokens */
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Quá nhiều yêu cầu AI, vui lòng chờ một chút." }
});

/** Limit for upload endpoints */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Quá nhiều yêu cầu upload, vui lòng thử lại sau." }
});

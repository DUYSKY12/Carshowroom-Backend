import { config } from "../config/env.js";

export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy API: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.status || 500;
  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    message: status >= 500 && config.nodeEnv === "production"
      ? "Đã xảy ra lỗi máy chủ."
      : (err.message || "Đã xảy ra lỗi."),
    ...(err.details ? { details: err.details } : {}),
    ...(config.nodeEnv === "development" && status >= 500 ? { stack: err.stack } : {})
  });
}

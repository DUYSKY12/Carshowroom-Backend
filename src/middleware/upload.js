import multer from "multer";
import path from "path";
import crypto from "crypto";
import { config } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, config.upload.dir);
  },
  filename(_req, file, cb) {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

function fileFilter(_req, file, cb) {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new HttpError(400, "Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)."), false);
  }
}

/** Upload single image field */
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxFileSize }
}).single("image");

/** Upload multiple images (accepts any field name: image, images, etc. up to 10 files) */
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxFileSize }
}).any();

/** Handle multer errors gracefully */
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new HttpError(400, "File quá lớn. Tối đa 5MB."));
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return next(new HttpError(400, "Tối đa 10 ảnh mỗi lần upload."));
    }
    return next(new HttpError(400, `Lỗi upload: ${err.message}`));
  }
  next(err);
}

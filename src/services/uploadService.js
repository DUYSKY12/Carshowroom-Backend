import fs from "fs";
import path from "path";
import sharp from "sharp";
import pool from "../config/db.js";
import { config } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import logger from "../config/logger.js";

// Ensure uploads folder exists
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

/**
 * Optimize an uploaded image using Sharp:
 * converts to WebP, limits max width to 1920px, and outputs optimized file.
 */
export async function optimizeImage(filePath) {
  try {
    const ext = path.extname(filePath);
    const optimizedPath = filePath.replace(ext, ".webp");

    await sharp(filePath)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(optimizedPath);

    // If original wasn't webp, remove original raw file
    if (ext.toLowerCase() !== ".webp") {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        logger.warn(`Could not remove unoptimized temp file: ${e.message}`);
      }
    }

    const filename = path.basename(optimizedPath);
    return `${config.apiUrl}/uploads/${filename}`;
  } catch (err) {
    logger.error(`Error optimizing image: ${err.message}`);
    // Fallback: return original file url if sharp fails
    const filename = path.basename(filePath);
    return `${config.apiUrl}/uploads/${filename}`;
  }
}

/**
 * Add gallery images to a car
 */
export async function addCarImages(carId, files) {
  if (!files || files.length === 0) {
    throw new HttpError(400, "Vui lòng chọn ít nhất một hình ảnh.");
  }

  // Check if car exists
  const [cars] = await pool.execute("SELECT id, image_url FROM cars WHERE id = ?", [carId]);
  if (!cars.length) {
    throw new HttpError(404, "Không tìm thấy xe.");
  }
  const car = cars[0];

  const results = [];
  const hasExistingPrimary = Boolean(car.image_url);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const imageUrl = await optimizeImage(file.path);
    const isPrimary = !hasExistingPrimary && i === 0;

    const [insertResult] = await pool.execute(
      `INSERT INTO car_images (car_id, image_url, is_primary, sort_order)
       VALUES (?, ?, ?, ?)`,
      [carId, imageUrl, isPrimary, i]
    );

    // If set as primary, update main car image_url
    if (isPrimary) {
      await pool.execute("UPDATE cars SET image_url = ? WHERE id = ?", [imageUrl, carId]);
    }

    results.push({
      id: insertResult.insertId,
      carId,
      imageUrl,
      isPrimary,
      sortOrder: i
    });
  }

  return results;
}

/**
 * Get all gallery images for a car
 */
export async function getCarImages(carId) {
  const [rows] = await pool.execute(
    "SELECT id, car_id, image_url, is_primary, sort_order, created_at FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC, id ASC",
    [carId]
  );
  return rows;
}

/**
 * Delete a car image
 */
export async function deleteCarImage(carId, imageId) {
  const [rows] = await pool.execute(
    "SELECT id, image_url, is_primary FROM car_images WHERE id = ? AND car_id = ?",
    [imageId, carId]
  );

  if (!rows.length) {
    throw new HttpError(404, "Không tìm thấy hình ảnh này.");
  }

  const image = rows[0];

  // Try to remove file from disk
  try {
    const filename = path.basename(image.image_url);
    const filePath = path.join(config.upload.dir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    logger.warn(`Could not delete file from disk: ${err.message}`);
  }

  await pool.execute("DELETE FROM car_images WHERE id = ?", [imageId]);

  // If the deleted image was primary, set another image as primary
  if (image.is_primary) {
    const [remaining] = await pool.execute(
      "SELECT id, image_url FROM car_images WHERE car_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1",
      [carId]
    );
    if (remaining.length) {
      await pool.execute("UPDATE car_images SET is_primary = TRUE WHERE id = ?", [remaining[0].id]);
      await pool.execute("UPDATE cars SET image_url = ? WHERE id = ?", [remaining[0].image_url, carId]);
    } else {
      await pool.execute("UPDATE cars SET image_url = NULL WHERE id = ?", [carId]);
    }
  }

  return { success: true, message: "Đã xóa hình ảnh thành công." };
}

/**
 * Set an image as primary for a car
 */
export async function setPrimaryImage(carId, imageId) {
  const [rows] = await pool.execute(
    "SELECT id, image_url FROM car_images WHERE id = ? AND car_id = ?",
    [imageId, carId]
  );

  if (!rows.length) {
    throw new HttpError(404, "Không tìm thấy hình ảnh này.");
  }

  const image = rows[0];

  // Reset all other images to non-primary
  await pool.execute("UPDATE car_images SET is_primary = FALSE WHERE car_id = ?", [carId]);
  // Set chosen image as primary
  await pool.execute("UPDATE car_images SET is_primary = TRUE WHERE id = ?", [imageId]);
  // Update main car table
  await pool.execute("UPDATE cars SET image_url = ? WHERE id = ?", [image.image_url, carId]);

  return { success: true, message: "Đã cập nhật ảnh đại diện xe." };
}

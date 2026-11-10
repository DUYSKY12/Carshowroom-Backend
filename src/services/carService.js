import pool from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";
import { getCarImages } from "./uploadService.js";

const allowedStatuses = ["available", "reserved", "sold", "hidden"];
const allowedFuel = ["gasoline", "diesel", "electric", "hybrid", "other"];
const allowedTransmission = ["automatic", "manual", "other"];

export async function listCars(query, isAdminOrSales = false) {
  const { page, limit, offset } = getPaginationParams(query, 12, 50);
  const where = [];
  const params = [];

  // Visibility
  if (isAdminOrSales && query.status) {
    where.push("status = ?");
    params.push(query.status);
  } else if (!isAdminOrSales) {
    where.push("status = 'available'");
  }

  if (query.brand) {
    where.push("brand = ?");
    params.push(query.brand);
  }

  if (query.bodyType) {
    where.push("body_type = ?");
    params.push(query.bodyType);
  }

  if (query.minPrice !== undefined && query.minPrice !== "") {
    where.push("price >= ?");
    params.push(Number(query.minPrice));
  }

  if (query.maxPrice !== undefined && query.maxPrice !== "") {
    where.push("price <= ?");
    params.push(Number(query.maxPrice));
  }

  if (query.year !== undefined && query.year !== "") {
    where.push("year = ?");
    params.push(Number(query.year));
  }

  if (query.seats !== undefined && query.seats !== "") {
    where.push("seats = ?");
    params.push(Number(query.seats));
  }

  if (query.fuelType) {
    where.push("fuel_type = ?");
    params.push(query.fuelType);
  }

  if (query.transmission) {
    where.push("transmission = ?");
    params.push(query.transmission);
  }

  if (query.keyword) {
    where.push("(name LIKE ? OR brand LIKE ? OR model LIKE ? OR description LIKE ?)");
    const term = `%${String(query.keyword).trim().slice(0, 100)}%`;
    params.push(term, term, term, term);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Sorting
  let orderBy = "ORDER BY created_at DESC";
  if (query.sort === "price_asc") orderBy = "ORDER BY price ASC";
  else if (query.sort === "price_desc") orderBy = "ORDER BY price DESC";
  else if (query.sort === "year_desc") orderBy = "ORDER BY year DESC";
  else if (query.sort === "views_desc") orderBy = "ORDER BY view_count DESC";

  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM cars ${whereSql}`, params);
  const total = Number(countRows[0].total);

  const [rows] = await pool.execute(
    `SELECT id, name, brand, model, year, price, fuel_type, transmission, body_type,
            seats, mileage_km, color, interior_color, horsepower, torque, description,
            features, image_url, status, view_count, created_at
     FROM cars ${whereSql} ${orderBy} LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return {
    items: rows,
    pagination: buildPaginationMeta(page, limit, total)
  };
}

export async function getCar(id, includeHidden = false) {
  const [rows] = await pool.execute(
    `SELECT * FROM cars WHERE id = ? ${includeHidden ? "" : "AND status <> 'hidden'"} LIMIT 1`,
    [id]
  );
  if (!rows.length) throw new HttpError(404, "Không tìm thấy ô tô.");

  const car = rows[0];

  // Increment view count asynchronously
  pool.execute("UPDATE cars SET view_count = view_count + 1 WHERE id = ?", [id]).catch(() => {});

  // Fetch gallery images
  const images = await getCarImages(id);
  car.images = images;

  return car;
}

export async function createCar(data) {
  const [result] = await pool.execute(
    `INSERT INTO cars
     (name, brand, model, year, price, fuel_type, transmission, body_type,
      engine_capacity, horsepower, torque, drive_type, seats, mileage_km,
      color, interior_color, description, features, image_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name.trim(),
      data.brand.trim(),
      data.model ? data.model.trim() : null,
      Number(data.year),
      Number(data.price),
      data.fuel_type || "gasoline",
      data.transmission || "automatic",
      data.body_type || null,
      data.engine_capacity || null,
      data.horsepower ? Number(data.horsepower) : null,
      data.torque || null,
      data.drive_type || null,
      data.seats ? Number(data.seats) : null,
      data.mileage_km !== undefined && data.mileage_km !== null ? Number(data.mileage_km) : null,
      data.color || null,
      data.interior_color || null,
      data.description || null,
      data.features ? JSON.stringify(data.features) : null,
      data.image_url || null,
      data.status || "available"
    ]
  );
  return getCar(result.insertId, true);
}

export async function updateCar(id, data) {
  const [exists] = await pool.execute("SELECT id FROM cars WHERE id = ? LIMIT 1", [id]);
  if (!exists.length) throw new HttpError(404, "Không tìm thấy ô tô.");

  const fields = [
    "name", "brand", "model", "year", "price", "fuel_type", "transmission", "body_type",
    "engine_capacity", "horsepower", "torque", "drive_type", "seats", "mileage_km",
    "color", "interior_color", "description", "features", "image_url", "status"
  ];

  const updates = [];
  const params = [];

  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      let val = data[field];
      if (field === "features" && typeof val === "object") {
        val = JSON.stringify(val);
      }
      params.push(val);
    }
  }

  if (updates.length > 0) {
    params.push(id);
    await pool.execute(`UPDATE cars SET ${updates.join(", ")} WHERE id = ?`, params);
  }

  return getCar(id, true);
}

export async function deleteCar(id) {
  const [result] = await pool.execute(
    "UPDATE cars SET status = 'hidden' WHERE id = ? AND status <> 'sold'",
    [id]
  );
  if (!result.affectedRows) throw new HttpError(404, "Không tìm thấy ô tô hoặc xe đã bán.");
}

/**
 * Compare multiple cars side by side (2 to 4 cars)
 */
export async function compareCars(carIds) {
  if (!Array.isArray(carIds) || carIds.length < 2 || carIds.length > 4) {
    throw new HttpError(400, "Vui lòng chọn từ 2 đến 4 xe để so sánh.");
  }

  const placeholders = carIds.map(() => "?").join(",");
  const [rows] = await pool.execute(
    `SELECT id, name, brand, model, year, price, fuel_type, transmission, body_type,
            engine_capacity, horsepower, torque, drive_type, seats, mileage_km,
            color, interior_color, features, image_url, status
     FROM cars WHERE id IN (${placeholders})`,
    carIds
  );

  if (rows.length < 2) {
    throw new HttpError(400, "Không tìm thấy đủ thông tin các xe để so sánh.");
  }

  return rows;
}

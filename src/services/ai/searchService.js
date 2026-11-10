import pool from "../../config/db.js";
import { getAiProvider } from "./aiProviderFactory.js";
import logger from "../../config/logger.js";

/**
 * Natural language car search powered by AI parameter extraction and SQL querying
 */
export async function searchCarsByNaturalLanguage(userQuery) {
  const provider = getAiProvider();

  // Prompt the LLM to extract search parameters as pure JSON
  const extractionPrompt = `
Phân tích yêu cầu tìm xe bằng tiếng Việt sau đây và trích xuất thành định dạng JSON hợp lệ (không kèm markdown, chỉ trả về JSON):
"${userQuery}"

Cấu trúc JSON mong muốn:
{
  "brand": null hoặc string tên hãng xe,
  "minPrice": null hoặc số tiền VNĐ (ví dụ "dưới 1 tỷ" -> maxPrice: 1000000000),
  "maxPrice": null hoặc số tiền VNĐ,
  "seats": null hoặc số chỗ ngồi (số nguyên, ví dụ "7 chỗ" -> 7),
  "bodyType": null hoặc "sedan" | "suv" | "hatchback" | "coupe" | "mpv" | "pickup",
  "fuelType": null hoặc "gasoline" | "diesel" | "electric" | "hybrid",
  "transmission": null hoặc "automatic" | "manual",
  "keywords": ["từ khóa phụ"]
}
`;

  let extractedParams = {};
  try {
    const rawJson = await provider.generateText(extractionPrompt, "Bạn là bộ trích xuất dữ liệu JSON chuẩn xác.");
    const cleaned = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
    extractedParams = JSON.parse(cleaned);
  } catch (err) {
    logger.warn(`AI natural language extraction fallback: ${err.message}`);
    // Basic regex fallback if LLM/JSON fails
    extractedParams = basicExtractionFallback(userQuery);
  }

  // Construct SQL query from extracted params
  const where = ["status = 'available'"];
  const params = [];

  if (extractedParams.brand) {
    where.push("brand LIKE ?");
    params.push(`%${extractedParams.brand}%`);
  }

  if (extractedParams.maxPrice && Number(extractedParams.maxPrice) > 0) {
    where.push("price <= ?");
    params.push(Number(extractedParams.maxPrice));
  }

  if (extractedParams.minPrice && Number(extractedParams.minPrice) > 0) {
    where.push("price >= ?");
    params.push(Number(extractedParams.minPrice));
  }

  if (extractedParams.seats && Number(extractedParams.seats) > 0) {
    where.push("seats >= ?");
    params.push(Number(extractedParams.seats));
  }

  if (extractedParams.bodyType) {
    where.push("body_type = ?");
    params.push(extractedParams.bodyType.toLowerCase());
  }

  if (extractedParams.fuelType) {
    where.push("fuel_type = ?");
    params.push(extractedParams.fuelType.toLowerCase());
  }

  const whereSql = where.join(" AND ");
  const [rows] = await pool.execute(
    `SELECT id, name, brand, model, year, price, fuel_type, transmission,
            body_type, seats, mileage_km, color, image_url, description
     FROM cars
     WHERE ${whereSql}
     ORDER BY price ASC
     LIMIT 10`,
    params
  );

  return {
    query: userQuery,
    interpretedCriteria: extractedParams,
    matchedCount: rows.length,
    cars: rows
  };
}

function basicExtractionFallback(query) {
  const lower = query.toLowerCase();
  const criteria = {};

  if (lower.includes("7 chỗ")) criteria.seats = 7;
  else if (lower.includes("5 chỗ")) criteria.seats = 5;

  if (lower.includes("dưới 1 tỷ") || lower.includes("dưới 1 ty")) criteria.maxPrice = 1000000000;
  else if (lower.includes("dưới 800")) criteria.maxPrice = 800000000;
  else if (lower.includes("dưới 500")) criteria.maxPrice = 500000000;

  if (lower.includes("suv") || lower.includes("gầm cao")) criteria.bodyType = "suv";
  else if (lower.includes("sedan")) criteria.bodyType = "sedan";
  else if (lower.includes("mpv")) criteria.bodyType = "mpv";

  if (lower.includes("điện")) criteria.fuelType = "electric";
  else if (lower.includes("hybrid")) criteria.fuelType = "hybrid";
  else if (lower.includes("dầu")) criteria.fuelType = "diesel";

  return criteria;
}

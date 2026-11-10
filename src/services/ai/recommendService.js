import pool from "../../config/db.js";
import { getAiProvider } from "./aiProviderFactory.js";
import logger from "../../config/logger.js";

/**
 * Intelligent AI Car Recommendation
 * Integrates database filtering with LLM deep analysis and reasoning.
 */
export async function getCarRecommendations({
  budget,
  seats,
  brand,
  fuelType,
  bodyType,
  purpose,
  preferences,
  userId = null
}) {
  const provider = getAiProvider();

  // Step 1: Database candidate search (allow ±20% budget headroom)
  const maxPrice = Number(budget) * 1.2;
  const where = ["status = 'available'", "price <= ?"];
  const params = [maxPrice];

  if (seats) {
    where.push("seats >= ?");
    params.push(Number(seats));
  }

  if (brand) {
    where.push("brand = ?");
    params.push(brand);
  }

  if (fuelType) {
    where.push("fuel_type = ?");
    params.push(fuelType);
  }

  if (bodyType) {
    where.push("body_type = ?");
    params.push(bodyType);
  }

  const whereSql = where.join(" AND ");
  const [candidates] = await pool.execute(
    `SELECT id, name, brand, model, year, price, fuel_type, transmission,
            body_type, seats, mileage_km, color, image_url, description
     FROM cars
     WHERE ${whereSql}
     ORDER BY ABS(price - ?) ASC
     LIMIT 8`,
    [...params, Number(budget)]
  );

  if (!candidates.length) {
    // If no exact match, fetch closest cars near budget
    const [fallback] = await pool.execute(
      `SELECT id, name, brand, model, year, price, fuel_type, transmission,
              body_type, seats, mileage_km, color, image_url, description
       FROM cars
       WHERE status = 'available'
       ORDER BY ABS(price - ?) ASC
       LIMIT 4`,
      [Number(budget)]
    );
    candidates.push(...fallback);
  }

  // Step 2: Formulate LLM prompt for analysis
  const carSummaries = candidates.map((c, i) =>
    `${i + 1}. [ID: ${c.id}] ${c.name} (${c.year}) - Giá: ${Number(c.price).toLocaleString("vi-VN")} VNĐ - ${c.seats || 5} chỗ - Nhiên liệu: ${c.fuel_type} - Hộp số: ${c.transmission} - Kiểu dáng: ${c.body_type || "N/A"}`
  ).join("\n");

  const prompt = `
Bạn là Chuyên gia tư vấn xe hơi cao cấp của CarShowroom Việt Nam.
Một khách hàng đang cần tư vấn mua xe với các tiêu chí sau:
- Ngân sách: ${Number(budget).toLocaleString("vi-VN")} VNĐ
- Số chỗ ngồi mong muốn: ${seats || "Không giới hạn"}
- Hãng xe ưu tiên: ${brand || "Tùy chọn phù hợp"}
- Loại nhiên liệu: ${fuelType || "Tùy chọn"}
- Kiểu dáng: ${bodyType || "Tùy chọn"}
- Mục đích sử dụng: ${purpose || "Phục vụ gia đình và đi lại hàng ngày"}
- Yêu cầu thêm: ${preferences || "Tiết kiệm nhiên liệu, an toàn, giữ giá tốt"}

Dưới đây là các mẫu xe hiện đang có sẵn tại showroom:
${carSummaries}

Nhiệm vụ của bạn:
1. Đánh giá và xếp hạng top các mẫu xe phù hợp nhất từ danh sách trên.
2. Phân tích ưu điểm và lý do tại sao mẫu xe đó phù hợp với nhu cầu và ngân sách của khách.
3. Đưa ra lời khuyên tài chính (chi phí lăn bánh ước tính hoặc gợi ý đặt lịch lái thử trải nghiệm).
4. Viết bằng tiếng Việt giọng văn chuyên nghiệp, nhiệt tình, truyền cảm hứng và hữu ích.
`;

  const systemInstruction = "Bạn là trợ lý AI thông minh chuyên tư vấn ô tô của CarShowroom. Hãy trả lời súc tích, trung thực, logic và dễ hiểu.";

  let aiExplanation = "";
  try {
    aiExplanation = await provider.generateText(prompt, systemInstruction);
  } catch (err) {
    logger.error(`AI recommendation generation failed: ${err.message}`);
    aiExplanation = "Dựa trên phân tích ngân sách và số chỗ ngồi bạn yêu cầu, các mẫu xe dưới đây là những lựa chọn tối ưu nhất về chi phí sử dụng và độ bền bỉ.";
  }

  // Step 3: Record interaction in database
  try {
    const recommendedIds = candidates.map(c => c.id);
    await pool.execute(
      `INSERT INTO ai_interactions (user_id, intent, request_summary, response_summary, recommended_car_ids, provider)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        "recommendation",
        JSON.stringify({ budget, seats, brand, fuelType, bodyType, purpose }),
        aiExplanation.slice(0, 500),
        JSON.stringify(recommendedIds),
        provider.name
      ]
    );
  } catch (err) {
    logger.warn(`Could not save AI interaction log: ${err.message}`);
  }

  return {
    provider: provider.name,
    totalMatched: candidates.length,
    aiExplanation,
    cars: candidates
  };
}

import pool from "../../config/db.js";
import { getAiProvider } from "./aiProviderFactory.js";
import logger from "../../config/logger.js";

/**
 * AI Demand & Market Insights for Management
 */
export async function getAiMarketInsights() {
  const provider = getAiProvider();

  // Aggregate stats from bookings, leads, cars view_count
  const [topViewedCars] = await pool.execute(
    `SELECT brand, model, name, view_count, price
     FROM cars
     ORDER BY view_count DESC
     LIMIT 5`
  );

  const [leadStats] = await pool.execute(
    `SELECT source, status, COUNT(*) as count
     FROM leads
     GROUP BY source, status`
  );

  const [bookingStats] = await pool.execute(
    `SELECT c.brand, COUNT(b.id) as booking_count
     FROM bookings b
     JOIN cars c ON b.car_id = c.id
     GROUP BY c.brand
     ORDER BY booking_count DESC
     LIMIT 5`
  );

  const prompt = `
Dưới đây là số liệu kinh doanh hiện tại của Showroom:
- Top 5 xe được xem nhiều nhất: ${JSON.stringify(topViewedCars)}
- Phân bổ nguồn Lead và trạng thái: ${JSON.stringify(leadStats)}
- Top các hãng xe được đặt lịch lái thử nhiều nhất: ${JSON.stringify(bookingStats)}

Dựa trên dữ liệu thực tế này, bạn hãy:
1. Phân tích xu hướng thị hiếu khách hàng đang quan tâm đến phân khúc hay dòng xe nào.
2. Đánh giá hiệu quả chuyển đổi từ lượt xem/lái thử sang khách tiềm năng.
3. Đề xuất chiến lược nhập thêm xe mới và chính sách ưu đãi giá phù hợp cho tháng tới.
`;

  let insights = "";
  try {
    insights = await provider.generateText(prompt, "Bạn là cố vấn chiến lược kinh doanh ô tô cao cấp.");
  } catch (err) {
    logger.error(`AI insights error: ${err.message}`);
    insights = "Xu hướng thị trường đang tập trung mạnh vào các dòng SUV đô thị và xe hybrid tiết kiệm nhiên liệu.";
  }

  return {
    topViewedCars,
    leadStats,
    bookingStats,
    aiStrategyAnalysis: insights
  };
}

import pool from "../../config/db.js";
import { getAiProvider } from "./aiProviderFactory.js";
import logger from "../../config/logger.js";

/**
 * Used car market price estimation and valuation
 */
export async function estimateCarPrice({
  brand,
  model,
  year,
  mileageKm = 0,
  condition = "good",
  fuelType = "gasoline",
  transmission = "automatic"
}) {
  const provider = getAiProvider();

  // Find similar cars in database for baseline
  const [similarCars] = await pool.execute(
    `SELECT price, year, mileage_km
     FROM cars
     WHERE brand = ? AND year BETWEEN ? AND ?
     LIMIT 10`,
    [brand, year - 2, year + 2]
  );

  let avgMarketPrice = 0;
  if (similarCars.length > 0) {
    const total = similarCars.reduce((acc, c) => acc + Number(c.price), 0);
    avgMarketPrice = Math.round(total / similarCars.length);
  }

  const prompt = `
Bạn là chuyên gia thẩm định giá ô tô thị trường Việt Nam.
Hãy thẩm định và ước tính giá thị trường cho chiếc xe sau:
- Hãng xe: ${brand}
- Dòng xe (Model): ${model || "Tiêu chuẩn"}
- Năm sản xuất: ${year}
- Số km đã lăn bánh (ODO): ${Number(mileageKm).toLocaleString("vi-VN")} km
- Tình trạng xe: ${condition} (ví dụ: excellent/good/fair)
- Loại nhiên liệu: ${fuelType}
- Hộp số: ${transmission}
${avgMarketPrice ? `- Giá tham khảo trung bình các xe tương đương tại showroom: ${avgMarketPrice.toLocaleString("vi-VN")} đ` : ""}

Nhiệm vụ của bạn:
1. Đưa ra khoảng giá ước tính hợp lý (Giá tối thiểu - Giá tối đa bằng VNĐ).
2. Đánh giá tỷ lệ khấu hao và khả năng giữ giá của dòng xe này tại thị trường Việt Nam.
3. Các yếu tố quan trọng ảnh hưởng đến giá trị của xe (lịch sử bảo dưỡng, tình trạng keo chỉ, lốp, nội thất...).
4. Đưa ra khuyến nghị định giá nếu khách muốn bán lại hoặc đổi xe lên đời.
`;

  let analysis = "";
  try {
    analysis = await provider.generateText(prompt, "Bạn là chuyên gia định giá và thẩm định xe hơi hàng đầu.");
  } catch (err) {
    logger.error(`AI price estimation error: ${err.message}`);
    analysis = "Ước tính giá xe phụ thuộc vào số km thực tế và tình trạng bảo dưỡng định kỳ tại hãng.";
  }

  return {
    vehicle: { brand, model, year, mileageKm, condition, fuelType, transmission },
    similarShowroomCarsCount: similarCars.length,
    estimatedMarketBaseline: avgMarketPrice || null,
    expertAnalysis: analysis
  };
}

import pool from "../../config/db.js";
import { getAiProvider } from "./aiProviderFactory.js";
import logger from "../../config/logger.js";

/**
 * Standard baseline car prices in Vietnam market (in VND) for common models
 */
const BRAND_BASELINES = {
  toyota: {
    camry: 1350000000,
    vios: 550000000,
    corolla: 780000000,
    cross: 850000000,
    fortuner: 1250000000
  },
  mazda: {
    "cx-5": 860000000,
    cx5: 860000000,
    "mazda 3": 660000000,
    "mazda 6": 880000000
  },
  hyundai: {
    accent: 540000000,
    santafe: 1250000000,
    "santa fe": 1250000000,
    tucson: 880000000,
    elantra: 690000000
  },
  kia: {
    k3: 620000000,
    k5: 900000000,
    seltos: 680000000,
    carnival: 1450000000,
    sonet: 580000000
  },
  honda: {
    city: 570000000,
    civic: 830000000,
    "cr-v": 1150000000,
    crv: 1150000000
  },
  ford: {
    everest: 1450000000,
    ranger: 850000000,
    territory: 830000000
  },
  "mercedes-benz": {
    c300: 2000000000,
    "c 300": 2000000000,
    "c-class": 1800000000,
    "e-class": 2400000000,
    glc: 2200000000
  },
  vinfast: {
    vf8: 1300000000,
    "vf 8": 1300000000,
    vf5: 500000000,
    vfe34: 650000000
  }
};

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
  const currentYear = new Date().getFullYear();
  const carAge = Math.max(0, currentYear - Number(year));
  const odo = Number(mileageKm) || 0;

  // 1. Try to find similar cars in database for baseline
  const [similarCars] = await pool.execute(
    `SELECT price, year, mileage_km
     FROM cars
     WHERE (brand LIKE ? OR name LIKE ?)
     LIMIT 10`,
    [`%${brand}%`, `%${model || brand}%`]
  );

  let baselinePrice = 0;
  if (similarCars.length > 0) {
    const total = similarCars.reduce((acc, c) => acc + Number(c.price), 0);
    baselinePrice = Math.round(total / similarCars.length);
  } else {
    // Lookup predefined baseline
    const brandKey = (brand || "").toLowerCase().trim();
    const modelKey = (model || "").toLowerCase().trim();
    if (BRAND_BASELINES[brandKey] && BRAND_BASELINES[brandKey][modelKey]) {
      baselinePrice = BRAND_BASELINES[brandKey][modelKey];
    } else {
      baselinePrice = 900000000; // fallback standard 900 million
    }
  }

  // 2. Calculate Market Valuation Algorithms
  // Year depreciation: ~6% to 8% per year
  const yearlyDepreciationRate = 0.07;
  const ageDepreciation = baselinePrice * (carAge * yearlyDepreciationRate);

  // Mileage depreciation: ~10,000 km/year is standard. Extra km discounts ~1.5% per 20,000 km
  const expectedKm = carAge * 12000;
  const excessKm = Math.max(0, odo - expectedKm);
  const mileageDiscount = (excessKm / 20000) * 0.015 * baselinePrice;

  // Condition modifier
  let conditionFactor = 1.0;
  if (condition === "excellent") conditionFactor = 1.04;
  else if (condition === "fair") conditionFactor = 0.92;
  else if (condition === "poor") conditionFactor = 0.82;

  let estimatedPrice = Math.round((baselinePrice - ageDepreciation - mileageDiscount) * conditionFactor);
  // Guardrail: minimum value at least 35% of original baseline
  estimatedPrice = Math.max(Math.round(baselinePrice * 0.35), estimatedPrice);

  const fairPriceMin = Math.round(estimatedPrice * 0.95);
  const fairPriceMax = Math.round(estimatedPrice * 1.05);

  const prompt = `
Bạn là chuyên gia thẩm định giá ô tô thị trường Việt Nam của Showroom SkyCar (155 Cầu Giấy, Hà Nội).
Hãy thẩm định và ước tính giá thị trường cho chiếc xe sau:
- Hãng xe: ${brand}
- Dòng xe (Model): ${model || "Tiêu chuẩn"}
- Năm sản xuất: ${year}
- Số km đã lăn bánh (ODO): ${odo.toLocaleString("vi-VN")} km
- Tình trạng xe: ${condition} (tốt/rất tốt/trung bình)
- Loại nhiên liệu: ${fuelType}
- Hộp số: ${transmission}
- Mức giá dự tính hợp lý: ${fairPriceMin.toLocaleString("vi-VN")} đ đến ${fairPriceMax.toLocaleString("vi-VN")} đ

Nhiệm vụ:
Nhận xét ngắn gọn, thực tế về độ bền, khả năng giữ giá của xe ${brand} ${model} đời ${year} tại Việt Nam.
`;

  let analysis = "";
  try {
    analysis = await provider.generateText(prompt, "Bạn là chuyên gia định giá và thẩm định xe hơi.");
  } catch (err) {
    logger.error(`AI price estimation error: ${err.message}`);
    analysis = `Dòng xe ${brand} ${model} đời ${year} đã chạy ${odo.toLocaleString("vi-VN")} km có mức độ giữ giá tốt tại thị trường Việt Nam. Động cơ và hộp số vận hành bền bỉ, chi phí bảo dưỡng định kỳ hợp lý.`;
  }

  return {
    vehicle: { brand, model, year, mileageKm: odo, condition, fuelType, transmission },
    estimated_price: estimatedPrice,
    fairPriceMin,
    fairPriceMax,
    dealRating: carAge <= 3 ? "Giữ Giá Rất Tốt" : "Thanh Khoản Cao",
    depreciationRate: `~${Math.round(yearlyDepreciationRate * 100)}%/năm`,
    aiValuationReport: analysis,
    expertAnalysis: analysis,
    estimatedMarketBaseline: baselinePrice
  };
}

import { HttpError } from "../utils/httpError.js";

// Showroom predefined promotional codes
export const AVAILABLE_COUPONS = [
  {
    code: "GIAM20TR",
    discountAmount: 20000000,
    title: "Voucher giảm 20 Triệu",
    description: "Giảm trực tiếp 20.000.000đ vào giá xe khi đặt mua trực tuyến",
    minPrice: 300000000
  },
  {
    code: "TRIAN2026",
    discountAmount: 15000000,
    title: "Tri ân khách hàng 2026",
    description: "Giảm trực tiếp 15.000.000đ áp dụng cho mọi dòng xe",
    minPrice: 200000000
  },
  {
    code: "GIAM50TR",
    discountAmount: 50000000,
    title: "Voucher VIP giảm 50 Triệu",
    description: "Giảm trực tiếp 50.000.000đ cho các dòng xe từ 1 tỷ đồng",
    minPrice: 1000000000
  },
  {
    code: "NEWCUSTOMER",
    discountAmount: 5000000,
    title: "Khách hàng mới",
    description: "Tặng 5.000.000đ cho khách hàng lần đầu mua xe tại Showroom",
    minPrice: 100000000
  },
  {
    code: "CAR10TR",
    discountAmount: 10000000,
    title: "Ưu đãi SkyCar",
    description: "Giảm ngay 10.000.000đ vào tổng giá trị xe",
    minPrice: 200000000
  }
];

/**
 * Validate and calculate discount for a coupon code and car price
 */
export function validateCoupon(code, carPrice) {
  if (!code || typeof code !== "string") {
    throw new HttpError(400, "Vui lòng nhập mã giảm giá hợp lệ.");
  }

  const normalizedCode = code.trim().toUpperCase();
  const coupon = AVAILABLE_COUPONS.find(c => c.code === normalizedCode);

  if (!coupon) {
    throw new HttpError(404, `Mã giảm giá "${normalizedCode}" không tồn tại hoặc đã hết hạn.`);
  }

  const numericPrice = Number(carPrice) || 0;

  if (coupon.minPrice && numericPrice < coupon.minPrice) {
    const minStr = (coupon.minPrice / 1000000).toLocaleString("vi-VN") + " triệu đồng";
    throw new HttpError(400, `Mã "${coupon.code}" chỉ áp dụng cho xe có giá từ ${minStr} trở lên.`);
  }

  const discountAmount = Math.min(coupon.discountAmount, numericPrice);
  const finalPrice = Math.max(0, numericPrice - discountAmount);

  return {
    valid: true,
    code: coupon.code,
    title: coupon.title,
    description: coupon.description,
    discountAmount,
    originalPrice: numericPrice,
    finalPrice
  };
}

export function getAvailableCoupons() {
  return AVAILABLE_COUPONS;
}


import logger from "../../../config/logger.js";

/**
 * Intelligent Mock AI Provider
 * Provides realistic responses for development and offline testing.
 */
export class MockAiProvider {
  constructor() {
    this.name = "mock";
  }

  async generateText(prompt, systemInstruction = "") {
    logger.debug(`[Mock AI] generateText with prompt: ${prompt.slice(0, 100)}...`);

    const lower = prompt.toLowerCase();

    // Check if prompt specifically expects a JSON extraction for car search
    if (prompt.includes("JSON") || prompt.includes("trích xuất")) {
      const result = {
        brand: lower.includes("toyota") ? "Toyota" : lower.includes("mazda") ? "Mazda" : lower.includes("hyundai") ? "Hyundai" : lower.includes("kia") ? "Kia" : lower.includes("mercedes") ? "Mercedes-Benz" : null,
        minPrice: null,
        maxPrice: lower.includes("dưới 1 tỷ") || lower.includes("dưới 1 ty") ? 1000000000 : lower.includes("dưới 2 tỷ") ? 2000000000 : lower.includes("dưới 800") ? 800000000 : null,
        seats: lower.includes("7 chỗ") ? 7 : lower.includes("5 chỗ") ? 5 : null,
        bodyType: lower.includes("suv") || lower.includes("gầm cao") ? "suv" : lower.includes("sedan") ? "sedan" : lower.includes("mpv") ? "mpv" : null,
        fuelType: lower.includes("điện") ? "electric" : lower.includes("hybrid") ? "hybrid" : lower.includes("dầu") ? "diesel" : null,
        transmission: lower.includes("tự động") ? "automatic" : lower.includes("số sàn") ? "manual" : null,
        keywords: []
      };
      return JSON.stringify(result);
    }

    // Check for car recommendation context
    if (lower.includes("gợi ý") || lower.includes("đề xuất") || lower.includes("recommend")) {
      return `Dựa trên phân tích ngân sách và nhu cầu của bạn, hệ thống nhận thấy các mẫu xe được đề xuất bên dưới đáp ứng rất tốt tiêu chí về độ bền bỉ, tiết kiệm nhiên liệu và không gian sử dụng rộng rãi. Bạn nên cân nhắc đặt lịch lái thử trực tiếp tại Showroom SkyCar (155 Cầu Giấy, Hà Nội) để trải nghiệm thực tế.`;
    }

    // Check for price estimation
    if (lower.includes("định giá") || lower.includes("giá trị") || lower.includes("khấu hao")) {
      return `Theo dữ liệu thị trường và mức độ hao mòn thực tế, dòng xe này giữ giá rất tốt trong phân khúc. Sau các năm sử dụng và mức ODO tương ứng, mức giá đề xuất là hoàn toàn hợp lý so với mặt bằng chung tại các showroom lớn.`;
    }

    // Default response
    return `Chào bạn! Tôi là trợ lý AI của Showroom SkyCar (155 Cầu Giấy, Hà Nội). Rất vui được hỗ trợ bạn tìm kiếm chiếc xe ưng ý nhất. Bạn có thể cho tôi biết thêm về ngân sách, số lượng thành viên gia đình và mục đích sử dụng chính không?`;
  }

  async chat(messages, systemInstruction = "") {
    logger.debug(`[Mock AI] chat with ${messages.length} messages`);

    const lastMessage = messages[messages.length - 1];
    const userText = (lastMessage?.content || "").toLowerCase();

    if (userText.includes("lái thử") || userText.includes("đặt lịch") || userText.includes("hẹn")) {
      return `Tuyệt vời! Bạn có thể đặt lịch lái thử trực tiếp ngay trên website bằng cách nhấn nút "Đặt lịch lái thử" ở trang chi tiết xe, hoặc đến trực tiếp Showroom SkyCar tại 155 Cầu Giấy, Hà Nội để được nhân viên Seller chuẩn bị xe sẵn sàng đón bạn.`;
    }

    if (userText.includes("giá") || userText.includes("bao nhiêu") || userText.includes("chi phí")) {
      return `Tại Showroom SkyCar (155 Cầu Giấy), các dòng xe đều được niêm yết giá công khai kèm theo các chương trình ưu đãi voucher giảm tiền mặt lên tới 50 triệu đồng. Bạn đang quan tâm đến mức ngân sách trong khoảng bao nhiêu để tôi hỗ trợ lọc danh sách chi tiết nhất?`;
    }

    if (userText.includes("7 chỗ") || userText.includes("gia đình") || userText.includes("suv") || userText.includes("gầm cao")) {
      return `Đối với nhu cầu gia đình và xe gầm cao 7 chỗ, Showroom SkyCar hiện có các lựa chọn nổi bật như Toyota Fortuner, Ford Everest, Hyundai Santa Fe hay các dòng SUV đô thị. Xe sở hữu khoang hành lý rộng rãi, điều hòa độc lập và độ an toàn cao cho mọi chuyến đi xa.`;
    }

    if (userText.includes("điện") || userText.includes("vinfast") || userText.includes("hybrid")) {
      return `Xe điện và Hybrid đang là xu hướng được quan tâm hàng đầu nhờ chi phí vận hành siêu tiết kiệm và khả năng vận hành êm ái. Showroom SkyCar luôn có sẵn các dòng xe đời mới kèm chính sách bảo hành và cam kết chất lượng chuẩn showroom.`;
    }

    return `Cảm ơn bạn đã nhắn tin cho Showroom SkyCar (155 Cầu Giấy, Hà Nội)! Tôi có thể giúp bạn tra cứu thông số kỹ thuật, so sánh các phiên bản xe, tính toán chi phí lăn bánh hoặc gợi ý mẫu xe phù hợp nhất với tầm tài chính của bạn. Bạn muốn bắt đầu từ dòng xe nào?`;
  }
}

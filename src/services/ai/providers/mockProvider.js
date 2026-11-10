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

    // Check for car recommendation context
    if (lower.includes("gợi ý") || lower.includes("đề xuất") || lower.includes("recommend")) {
      return `Dựa trên phân tích ngân sách và nhu cầu của bạn, hệ thống nhận thấy các mẫu xe được đề xuất bên dưới đáp ứng rất tốt tiêu chí về độ bền bỉ, tiết kiệm nhiên liệu và không gian sử dụng rộng rãi. Bạn nên cân nhắc đặt lịch lái thử trực tiếp để trải nghiệm cảm giác lái và các tính năng an toàn thực tế.`;
    }

    // Check for price estimation
    if (lower.includes("định giá") || lower.includes("giá trị") || lower.includes("khấu hao")) {
      return `Theo dữ liệu thị trường và mức độ hao mòn thực tế, dòng xe này giữ giá khá tốt trong phân khúc. Sau các năm sử dụng và mức ODO tương ứng, mức giá đề xuất là hoàn toàn hợp lý so với mặt bằng chung.`;
    }

    // Default response
    return `Chào bạn! Tôi là trợ lý AI của CarShowroom. Rất vui được hỗ trợ bạn tìm kiếm chiếc xe ưng ý nhất. Bạn có thể cho tôi biết thêm về ngân sách, số lượng thành viên gia đình và mục đích sử dụng chính không?`;
  }

  async chat(messages, systemInstruction = "") {
    logger.debug(`[Mock AI] chat with ${messages.length} messages`);

    const lastMessage = messages[messages.length - 1];
    const userText = (lastMessage?.content || "").toLowerCase();

    if (userText.includes("lái thử") || userText.includes("đặt lịch") || userText.includes("hẹn")) {
      return `Tuyệt vời! Bạn có thể đặt lịch lái thử trực tiếp ngay trên trang web bằng cách nhấn nút "Đặt lịch lái thử" ở trang chi tiết xe, hoặc để lại số điện thoại để chuyên viên của chúng tôi chuẩn bị xe sẵn sàng cho bạn.`;
    }

    if (userText.includes("giá") || userText.includes("bao nhiêu") || userText.includes("chi phí")) {
      return `Tại CarShowroom, các dòng xe đều được niêm yết giá công khai kèm theo các chương trình ưu đãi giảm tiền mặt hoặc tặng gói bảo dưỡng. Bạn đang quan tâm đến mức ngân sách trong khoảng bao nhiêu triệu/tỷ đồng để tôi hỗ trợ lọc danh sách chi tiết nhất?`;
    }

    if (userText.includes("7 chỗ") || userText.includes("gia đình") || userText.includes("suv")) {
      return `Đối với nhu cầu gia đình và xe gầm cao 7 chỗ, các lựa chọn nổi bật hiện nay gồm có Toyota Fortuner, Ford Everest, Hyundai Santa Fe hoặc dòng MPV rộng rãi. Các dòng xe này sở hữu khoang hành lý lớn, điều hòa phân bổ đều và vận hành êm ái trên những chuyến đi xa.`;
    }

    if (userText.includes("điện") || userText.includes("vinfast") || userText.includes("hybrid")) {
      return `Xe điện và Hybrid đang là xu hướng hàng đầu nhờ chi phí vận hành cực kỳ tiết kiệm và khả năng tăng tốc mượt mà. Showroom chúng tôi hiện có các dòng VinFast VF8, Toyota Cross Hybrid... với chính sách bảo hành pin rất ưu đãi.`;
    }

    return `Cảm ơn bạn đã nhắn tin cho CarShowroom! Tôi có thể giúp bạn tra cứu thông số kỹ thuật, so sánh các phiên bản xe, tính toán chi phí lăn bánh hoặc gợi ý mẫu xe phù hợp nhất với tầm tài chính của bạn. Bạn muốn bắt đầu từ dòng xe nào?`;
  }
}

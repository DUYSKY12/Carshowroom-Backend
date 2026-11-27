import logger from "../../../config/logger.js";

/**
 * Intelligent Mock AI Provider
 * Provides domain-specific automotive responses and strictly rejects non-car inquiries with an apology.
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
        brand: lower.includes("toyota") ? "Toyota" : lower.includes("mazda") ? "Mazda" : lower.includes("hyundai") ? "Hyundai" : lower.includes("kia") ? "Kia" : lower.includes("mercedes") ? "Mercedes-Benz" : lower.includes("honda") ? "Honda" : lower.includes("ford") ? "Ford" : lower.includes("vinfast") ? "VinFast" : null,
        minPrice: null,
        maxPrice: lower.includes("dưới 1 tỷ") || lower.includes("dưới 1 ty") ? 1000000000 : lower.includes("dưới 2 tỷ") ? 2000000000 : lower.includes("dưới 800") ? 800000000 : lower.includes("dưới 600") ? 600000000 : null,
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
    const userText = (lastMessage?.content || "").trim().toLowerCase();

    // 1. Check if the question is unrelated to cars / automotive domain
    const isCarRelated = this.isAutomotiveQuery(userText);

    if (!isCarRelated) {
      return `Xin lỗi bạn, tôi là trợ lý tư vấn chuyên trách về ô tô của Showroom SkyCar (155 Cầu Giấy, Hà Nội). Tôi chỉ có thể giải đáp các câu hỏi liên quan đến xe hơi, bảng giá xe, thông số kỹ thuật, thủ tục mua bán, đặt cọc giữ xe và đăng ký lái thử tại showroom.

Bạn có đang quan tâm đến dòng xe nào tại Showroom SkyCar để tôi hỗ trợ tư vấn không ạ?`;
    }

    // 2. Answer automotive questions comprehensively based on user inquiry

    // A. Xe dưới 1 tỷ / Giá rẻ / Phổ thông
    if (
      userText.includes("dưới 1 tỷ") ||
      userText.includes("dưới 1 ty") ||
      userText.includes("dưới một tỷ") ||
      userText.includes("tầm 1 tỷ") ||
      userText.includes("duoi 1 ty") ||
      userText.includes("tầm 800") ||
      userText.includes("tầm 500") ||
      userText.includes("tầm 600") ||
      userText.includes("dưới 800") ||
      userText.includes("giá rẻ") ||
      userText.includes("bình dân")
    ) {
      return `Hiện tại Showroom SkyCar đang có sẵn các mẫu xe cực kỳ chất lượng trong tầm giá **dưới 1 tỷ đồng**:\n\n` +
        `1. **Honda City RS (2026)** - Sedan 5 chỗ:\n` +
        `   - **Giá niêm yết:** 569.000.000 VNĐ\n` +
        `   - **Ưu điểm:** Thiết kế trẻ trung, tiết kiệm nhiên liệu vượt trội, khoang ngồi rộng rãi nhất phân khúc B.\n\n` +
        `2. **Mazda CX-5 2.0L Premium Exclusive (2023)** - SUV 5 chỗ gầm cao:\n` +
        `   - **Giá niêm yết:** 869.000.000 VNĐ\n` +
        `   - **Ưu điểm:** Kiểu dáng KODO sang trọng, nội thất bọc da cao cấp, gói an toàn chủ động i-Activsense, vận hành êm ái.\n\n` +
        `Ngoài ra showroom có hỗ trợ gói trả góp ngân hàng lãi suất ưu đãi lên tới 80% giá trị xe. Bạn có muốn đặt lịch lái thử trực tiếp mẫu xe nào tại 155 Cầu Giấy không?`;
    }

    // B. Xe từ 1 - 2 tỷ / Tầm trung & cận cao cấp
    if (
      userText.includes("1 đến 2 tỷ") ||
      userText.includes("1-2 tỷ") ||
      userText.includes("trên 1 tỷ") ||
      userText.includes("hơn 1 tỷ") ||
      userText.includes("1.5 tỷ")
    ) {
      return `Trong tầm giá **1 đến 1.5 tỷ đồng**, Showroom SkyCar có các dòng xe gia đình và doanh nhân rất được ưa chuộng:\n\n` +
        `1. **Toyota Camry 2.5Q (2024)** - Sedan hạng D cao cấp: **1.405.000.000 VNĐ** (Êm ái, sang trọng, đẳng cấp doanh nhân).\n` +
        `2. **Ford Everest Titanium 4x4 (2024)** - SUV 7 chỗ máy dầu 2 cầu: **1.499.000.000 VNĐ** (Mạnh mẽ, khung gầm vững chắc, off-road đỉnh cao).\n` +
        `3. **Hyundai Santa Fe 2.2D HTRAC Cao Cấp (2023)** - SUV 7 chỗ: **1.269.000.000 VNĐ** (Nhiều trang bị tiện nghi, máy dầu bốc và tiết kiệm).\n` +
        `4. **Honda CR-V e:HEV RS (2024)** - Crossover Hybrid thể thao: **1.259.000.000 VNĐ** (Xăng lai điện siêu mượt, cực kỳ tiết kiệm xăng).\n` +
        `5. **VinFast VF 8 Plus (2024)** - SUV điện thông minh: **1.309.000.000 VNĐ** (Công nghệ trợ lái ADAS cấp 2, bảo hành 10 năm).\n\n` +
        `Bạn muốn tư vấn kỹ hơn về dòng sedan hay gầm cao 7 chỗ?`;
    }

    // C. Xe trên 2 tỷ / Xe sang
    if (userText.includes("trên 2 tỷ") || userText.includes("hơn 2 tỷ") || userText.includes("xe sang") || userText.includes("mercedes") || userText.includes("bmw") || userText.includes("c300") || userText.includes("c 300")) {
      return `Trong phân khúc xe sang, SkyCar xin giới thiệu mẫu **Mercedes-Benz C 300 AMG (Đời 2026)**:\n\n` +
        `- **Giá bán:** 2.099.000.000 VNĐ\n` +
        `- **Động cơ:** 2.0L Turbo Mild-Hybrid EQ Boost mạnh mẽ\n` +
        `- **Nổi bật:** Gói ngoại thất thể thao AMG Line, đèn pha Digital Light tối tân, màn hình trung tâm 11.9 inch, hệ thống âm thanh vòm Burmester 3D đỉnh cao.\n\n` +
        `Xe đang có sẵn tại showroom để quý khách lái thử và nhận xe ngay trong ngày kèm ưu đãi phủ Ceramic cao cấp.`;
    }

    // D. Xe 7 chỗ / Gia đình / MPV / SUV
    if (userText.includes("7 chỗ") || userText.includes("bảy chỗ") || userText.includes("gia đình") || userText.includes("mpv") || userText.includes("carnival") || userText.includes("santa fe") || userText.includes("everest") || userText.includes("fortuner")) {
      return `Đối với nhu cầu gia đình và công việc cần xe 7 chỗ rộng rãi, Showroom SkyCar có 3 sự lựa chọn tốt nhất hiện nay:\n\n` +
        `1. **Kia Carnival 2.2D Signature (2024)** - MPV chuyên cơ mặt đất: **1.469.000.000 VNĐ**. Hàng ghế sau chuẩn thương gia có sưởi/làm mát, cửa lùa điện, không gian khoang hành khách rộng nhất phân khúc.\n` +
        `2. **Ford Everest Titanium 4x4 (2024)** - SUV 7 chỗ máy dầu 2.0 Bi-Turbo: **1.499.000.000 VNĐ**. Khung gầm rời đầm chắc, cách âm ấn tượng, an toàn vượt trội trên mọi địa hình.\n` +
        `3. **Hyundai Santa Fe 2.2D HTRAC Cao Cấp (2023)**: **1.269.000.000 VNĐ**. Thiết kế hiện đại, dẫn động 4 bánh toàn thời gian thông minh.\n\n` +
        `Bạn cần xe ưu tiên hàng ghế thương gia êm ái (như Carnival) hay xe gầm cao vượt địa hình (như Everest)?`;
    }

    // E. Xe điện / Hybrid / Tiết kiệm nhiên liệu
    if (userText.includes("điện") || userText.includes("vinfast") || userText.includes("vf8") || userText.includes("vf 8") || userText.includes("hybrid") || userText.includes("tiết kiệm xăng") || userText.includes("tiết kiệm nhiên liệu")) {
      return `Xu hướng xe xanh tiết kiệm nhiên liệu tại SkyCar hiện có hai mẫu xe tiêu biểu:\n\n` +
        `1. **VinFast VF 8 Plus (2024)** - Xe thuần điện thông minh:\n` +
        `   - **Giá:** 1.309.000.000 VNĐ\n` +
        `   - **Hiệu năng:** Tăng tốc 0-100km/h chỉ trong 5.5s, pin đi được ~400km/lần sạc, hỗ trợ trợ lý ảo thông minh tiếng Việt và tự hành ADAS.\n\n` +
        `2. **Honda CR-V e:HEV RS (2024)** - Động cơ Hybrid xăng lai điện:\n` +
        `   - **Giá:** 1.259.000.000 VNĐ\n` +
        `   - **Ưu điểm:** Mức tiêu thụ nhiên liệu chỉ khoảng **3.4 - 4.5L/100km** trong đô thị, không cần sạc điện ngoài, vận hành cực kỳ êm ái.\n\n` +
        `Showroom có sẵn trạm sạc và khu vực trải nghiệm thực tế xe xanh cho quý khách!`;
    }

    // F. Thủ tục Đặt cọc / Mua xe / Trả góp / Giấy tờ
    if (userText.includes("đặt cọc") || userText.includes("cọc") || userText.includes("trả góp") || userText.includes("thủ tục") || userText.includes("hợp đồng") || userText.includes("ngân hàng") || userText.includes("vay")) {
      return `Quy trình đặt cọc và mua xe tại Showroom SkyCar rất minh bạch và nhanh chóng:\n\n` +
        `1. **Đặt cọc giữ xe trực tuyến:** Quý khách có thể cọc từ **20.000.000 VNĐ** ngay trên website qua cổng thanh toán VNPay/Chuyển khoản để khóa xe và bảo lưu giá khuyến mãi.\n` +
        `2. **Hỗ trợ trả góp ngân hàng:** Liên kết hơn 10 ngân hàng uy tín (Vietcombank, Techcombank, VPBank...), hỗ trợ vay lên tới **80% giá trị xe**, thời hạn đến 8 năm với lãi suất ưu đãi.\n` +
        `3. **Thủ tục đơn giản:** Chỉ cần CCCD gắn chip và giấy xác nhận thu nhập (Seller của SkyCar sẽ hỗ trợ hoàn thiện hồ sơ tận nơi trong 24h).\n\n` +
        `Bạn có cần kiểm tra mức trả góp hàng tháng cho chiếc xe nào cụ thể không?`;
    }

    // G. Lái thử / Đặt lịch lái thử
    if (userText.includes("lái thử") || userText.includes("đặt lịch") || userText.includes("hẹn") || userText.includes("test drive")) {
      return `Quý khách có thể trải nghiệm lái thử hoàn toàn **miễn phí 100%** tại Showroom SkyCar:\n\n` +
        `- **Địa điểm:** 155 Cầu Giấy, Quận Cầu Giấy, Hà Nội (hoặc đăng ký lái thử tận nhà trong nội thành Hà Nội).\n` +
        `- **Cách đặt:** Nhấn vào nút **"Đặt lịch lái thử"** trên thanh menu hoặc ngay tại trang chi tiết xe, chọn ngày giờ thuận tiện.\n` +
        `- Nhân viên Seller của showroom sẽ liên hệ xác nhận và chuẩn bị sẵn xe cùng điều hòa mát mẻ đón quý khách!`;
    }

    // H. Định giá xe cũ / Đổi xe cũ lấy xe mới
    if (userText.includes("định giá") || userText.includes("bán xe") || userText.includes("thu mua") || userText.includes("thu cũ đổi mới") || userText.includes("xe lướt")) {
      return `Showroom SkyCar có dịch vụ **Định Giá Xe & Thu Cũ Đổi Mới** nhanh chóng:\n\n` +
        `1. Sử dụng tính năng **Định giá xe** trên website để biết ngay giá trị thị trường ước tính dựa trên đời xe và số km đã đi.\n` +
        `2. Kỹ thuật viên SkyCar thẩm định 176 hạng mục chi tiết tại 155 Cầu Giấy, cam kết thu mua giá tốt nhất thị trường và giải ngân trong 30 phút.\n` +
        `3. Tặng thêm voucher từ 10 - 30 triệu đồng khi khách hàng đổi xe cũ lấy xe mới tại showroom.`;
    }

    // I. Thông số kỹ thuật / So sánh chung
    if (userText.includes("so sánh") || userText.includes("thông số") || userText.includes("động cơ") || userText.includes("tiêu hao") || userText.includes("mã lực")) {
      return `Showroom SkyCar cung cấp đầy đủ công cụ **So sánh xe** đa chiều giữa các mẫu xe hot nhất (về công suất, số túi khí, dung tích bình xăng, kích thước dài x rộng x cao và tiện ích giải trí).\n\n` +
        `Bạn đang muốn so sánh trực tiếp giữa hai dòng xe nào (ví dụ: Toyota Camry vs Mercedes C 300, hoặc Ford Everest vs Santa Fe) để tôi phân tích chi tiết cho bạn?`;
    }

    // J. Hỏi về Showroom SkyCar / Địa chỉ / Giờ mở cửa / Hotline
    if (userText.includes("showroom") || userText.includes("địa chỉ") || userText.includes("ở đâu") || userText.includes("liên hệ") || userText.includes("hotline") || userText.includes("giờ làm việc") || userText.includes("skycar")) {
      return `Thông tin chính thức của Showroom SkyCar:\n\n` +
        `- **Địa chỉ:** 155 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội.\n` +
        `- **Giờ mở cửa:** 08:00 - 20:30 tất cả các ngày trong tuần (kể cả Thứ 7 & Chủ Nhật).\n` +
        `- **Hotline tư vấn 24/7:** 1900 6868 - 0988 555 155.\n` +
        `- **Dịch vụ:** Phân phối xe mới & xe lướt chính hãng, lái thử miễn phí, hỗ trợ vay trả góp 80%, bảo hành bảo dưỡng tiêu chuẩn.`;
    }

    // K. Hỏi chung về xe / Báo giá / Tư vấn xe
    return `Chào bạn! Showroom SkyCar (155 Cầu Giấy, Hà Nội) hiện có sẵn đầy đủ các mẫu xe từ Sedan hạng B, C, D (Honda City, Toyota Camry, Mercedes C 300 AMG) đến SUV/MPV 5-7 chỗ (Mazda CX-5, Ford Everest, Hyundai Santa Fe, Kia Carnival) và xe điện thông minh (VinFast VF 8).\n\n` +
      `Bạn đang muốn tìm xe trong khoảng ngân sách bao nhiêu (ví dụ: dưới 1 tỷ, 1 - 2 tỷ) hoặc cần xe mấy chỗ để tôi tư vấn phiên bản và giá lăn bánh chi tiết nhất cho bạn?`;
  }

  /**
   * Domain Guardrail: Determines if the user input is relevant to cars / showroom
   */
  isAutomotiveQuery(text) {
    if (!text || text.length < 2) return false;

    // Strong Automotive keywords
    const carTerms = [
      "xe", "ô tô", "oto", "car", "showroom", "skycar", "lái thử", "đặt cọc", "cọc",
      "mua", "bán", "giá", "tỷ", "ty", "triệu", "trieu", "tr", "vnđ", "vnd", "lăn bánh",
      "sedan", "suv", "mpv", "crossover", "hatchback", "bán tải", "pickup",
      "bảo dưỡng", "bảo hành", "nhiên liệu", "xăng", "dầu", "điện", "hybrid", "đăng kiểm",
      "toyota", "camry", "vios", "corolla", "cross", "fortuner",
      "mazda", "cx5", "cx-5", "mazda 3", "mazda 6",
      "hyundai", "santafe", "santa fe", "accent", "tucson", "elantra", "creta",
      "kia", "seltos", "carnival", "k3", "k5", "sonet", "sorento",
      "honda", "city", "civic", "crv", "cr-v", "br-v", "accord",
      "ford", "everest", "ranger", "territory", "explorer",
      "mercedes", "mercedes-benz", "c300", "c 300", "e300", "glc", "s450",
      "bmw", "320i", "520i", "x3", "x5",
      "vinfast", "vf3", "vf5", "vf6", "vf7", "vf8", "vf9", "vfe34",
      "odo", "km", "động cơ", "mã lực", "hộp số", "tự động", "số sàn",
      "trả góp", "hợp đồng", "bàn giao", "cầu giấy", "hà nội", "155",
      "chỗ", "cho", "cốp", "ghế", "nội thất", "ngoại thất", "vô lăng", "bánh xe", "lốp",
      "tư vấn", "chọn", "ngân sách", "tài chính", "so sánh", "định giá", "khấu hao"
    ];

    // Explicit non-automotive patterns
    const nonCarPatterns = [
      /nấu ăn|công thức nấu|món ăn|cách nấu|ẩm thực|nước mắm|bếp|bánh mì|phở/i,
      /thời tiết|dự báo thời tiết|trời mưa|nhiệt độ hôm nay/i,
      /lập trình|viết code|python|javascript|java|c\+\+|html|css|fix bug|react|node/i,
      /giải toán|phương trình|tích phân|đạo hàm|hóa học|vật lý/i,
      /chính trị|bầu cử|chiến tranh|tổng thống/i,
      /bài thơ|làm thơ|hát|bài hát|viết văn|kể chuyện/i,
      /thuốc|chữa bệnh|khám bệnh|bác sĩ|y tế|triệu chứng/i,
      /tình yêu|thất tình|tâm sự|bói toán|tử vi|cung hoàng đạo/i
    ];

    // If explicit non-car pattern is present and no strong car intent is present
    for (const pat of nonCarPatterns) {
      if (pat.test(text)) {
        // Exception: if the question explicitly asks about car too, evaluate further
        const containsCar = carTerms.some(term => text.includes(term));
        if (!containsCar) {
          return false;
        }
      }
    }

    // Check if at least one automotive term is present
    return carTerms.some(term => text.includes(term));
  }
}

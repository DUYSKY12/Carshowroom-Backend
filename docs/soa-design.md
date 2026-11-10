# Thiết Kế Kiến Trúc Hướng Dịch Vụ — Website Showroom Ô Tô SkyCar (SOA Architecture Design Document)

---

## 1. Tổng Quan Kiến Trúc Hệ Thống (Architectural Overview)

Hệ thống **Website Showroom Ô Tô SkyCar** (địa chỉ tại 155 Cầu Giấy, Hà Nội) được thiết kế theo mô hình **Kiến trúc Hướng Dịch vụ (Service-Oriented Architecture - SOA)** kết hợp với kiến trúc **Phân lớp (Layered Architecture)**, nhằm phục vụ trọn vẹn cả hai mục tiêu: giới thiệu xe & chăm sóc khách hàng trực tuyến, đồng thời điều hành hoạt động kinh doanh nội bộ của showroom:
- **Ranh giới nghiệp vụ độc lập (Loose Coupling & High Cohesion):** Toàn bộ hoạt động thực tế của showroom (quản lý kho xe sẵn có, xếp lịch lái thử, xử lý đơn đặt cọc giữ chỗ, chăm sóc khách hàng tiềm năng CRM, mã giảm giá) được phân chia thành từng Lớp Dịch Vụ (Service) chuyên biệt với trách nhiệm rõ ràng.
- **Giao diện chuẩn hóa (Standardized Contracts):** Toàn bộ giao tiếp giữa giao diện phía người dùng (Frontend) và hệ thống máy chủ (Backend) đều tuân thủ chuẩn RESTful API, trao đổi dữ liệu qua định dạng JSON và tài liệu OpenAPI 3.0 / Swagger.
- **Tính module hóa và sẵn sàng mở rộng (Modular & Extensible):** Cấu trúc phân lớp mạch lạc giúp Quản trị viên (Anh Duy) và Seller dễ dàng vận hành, đồng thời sẵn sàng bóc tách thành các microservice riêng biệt khi showroom mở rộng quy mô.

### 1.1 Bảng Phân Tầng Kiến Trúc Hệ Thống (Architectural Layers)

| Tầng Kiến Trúc | Công Nghệ Chủ Đạo | Trách Nhiệm & Vai Trò Chính Trong Hệ Thống |
| :--- | :--- | :--- |
| **1. Tầng Trình Diễn (Client Presentation Layer)** | React 18 SPA (Vite), React Router v6, Context API, CSS Modules | - Xây dựng giao diện tương tác người dùng mượt mà, phản hồi nhanh.<br>- Điều hướng trang động, kiểm soát phiên đăng nhập và phân quyền hiển thị.<br>- Quản lý trạng thái form biểu mẫu, kiểm tra tính hợp lệ dữ liệu phía máy khách.<br>- Hiển thị hộp thoại Modal nổi, thông báo trực quan (Toast). |
| **2. Tầng Cổng API & Bảo Mật (API Gateway & Security Layer)** | Express.js, CORS, Helmet, Rate Limiter, JWT Authenticator, Zod | - Tiếp nhận các yêu cầu HTTP/HTTPS từ phía máy khách.<br>- Bảo vệ hệ thống: Phòng chống tấn công dò mật khẩu (Brute-force), chặn mã độc qua HTTP headers.<br>- Xác thực danh tính qua chữ ký số JSON Web Token (JWT) và phân quyền vai trò (RBAC).<br>- Thẩm định và chuẩn hóa cấu trúc dữ liệu đầu vào thông qua Zod Schema. |
| **3. Tầng Dịch Vụ Nghiệp Vụ (Service Application Layer)** | 10 Dịch vụ nghiệp vụ độc lập (Identity, Catalog, Booking, Order, v.v.) | - Đóng gói toàn bộ quy tắc logic và quy trình nghiệp vụ cốt lõi.<br>- Xử lý tranh chấp tài nguyên (chống trùng lịch hẹn, khóa giữ chỗ xe).<br>- Tính toán chiết khấu ưu đãi, quản lý phễu CRM khách hàng.<br>- Đảm bảo tính toàn vẹn giao dịch (ACID Transaction Boundaries). |
| **4. Tầng Lưu Trữ & Hạ Tầng (Persistence & Infrastructure Layer)** | MySQL 8 InnoDB, Pool kết nối (mysql2), Thư viện gửi Mail SMTP | - Quản trị và lưu trữ dữ liệu bền vững trên hệ thống cơ sở dữ liệu quan hệ.<br>- Thực thi truy vấn an toàn chống SQL Injection qua cơ chế Prepared Statements.<br>- Quản lý tệp tin hình ảnh xe và gửi thư điện tử giao dịch tự động. |

---

## 2. Danh Mục Các Dịch Vụ Cốt Lõi (Service Catalog & Boundaries)

Hệ thống SkyCar phân chia thành 10 dịch vụ thành phần:

### 2.1 Identity & Access Management Service (IAM Service)
- **Mục tiêu:** Quản trị xác thực danh tính, bảo vệ phiên làm việc và phân định đặc quyền tài khoản (RBAC).
- **Chức năng:**
  - Đăng ký tài khoản khách hàng, kích hoạt qua mã số xác thực email (OTP 6 số).
  - Đăng nhập bảo mật phát hành cặp mã xác thực `accessToken` (thời hạn 15-30 phút) và `refreshToken` (thời hạn 7 ngày, lưu dạng mã hóa SHA-256).
  - Tự động cấp mới phiên đăng nhập (`/api/auth/refresh`) mà không làm gián đoạn trải nghiệm người dùng.
  - Quản lý hồ sơ cá nhân, đổi mật khẩu, quên mật khẩu và tạo mới qua liên kết an toàn có thời hạn.
  - Phân quyền nghiêm ngặt 3 cấp độ: `customer`, `sales`, `admin`.

### 2.2 Vehicle Inventory & Catalog Service
- **Mục tiêu:** Quản trị vòng đời danh mục xe, thông số kỹ thuật và tình trạng kho thực tế.
- **Chức năng:**
  - Tra cứu và phân trang danh mục xe đa tiêu chí: Hãng (`brand`), kiểu dáng (`body_type`), loại nhiên liệu (`fuel_type`), loại hộp số (`transmission`), khoảng giá (`min_price` - `max_price`), từ khóa tìm kiếm (`keyword`).
  - Quản trị bộ sưu tập ảnh xe (`car_images`): Upload nhiều ảnh đồng thời, chọn ảnh chính (`is_primary`), xóa ảnh rác.
  - Kiểm soát trạng thái kho (`available`, `reserved`, `sold`, `hidden`).
  - Ghi nhận và thống kê lượt xem xe (`view_count`).

### 2.3 Booking & Test Drive Service
- **Mục tiêu:** Điều phối và quản lý lịch hẹn lái thử trải nghiệm xe.
- **Chức năng:**
  - Khách hàng thiết lập lịch hẹn tại trang riêng (`/cars/:id/test-drive`) với ngày, khung giờ và địa điểm mong muốn.
  - Thuật toán kiểm tra và ngăn chặn trùng lịch hẹn trên cùng một xe trong cùng một khung thời gian (sử dụng câu lệnh khóa `SELECT ... FOR UPDATE` đảm bảo tính toàn vẹn giao dịch).
  - Quản trị vòng đời trạng thái lịch hẹn: `pending` ➔ `confirmed` ➔ `completed` / `cancelled` / `no_show`.
  - Khách hàng có quyền tự hủy lịch hẹn khi chưa được duyệt (`pending`).
  - Gửi email xác nhận và thông báo chuông tới khách hàng ngay khi đặt lịch hoặc khi trạng thái thay đổi.

### 2.4 Order, Deposit & Payment Service
- **Mục tiêu:** Xử lý đơn đặt mua xe, thanh toán tiền cọc giữ chỗ và quản lý hóa đơn.
- **Chức năng:**
  - Khách hàng khởi tạo đơn mua xe tại trang đặt hàng riêng biệt (`/cars/:id/order`).
  - Tích hợp động cơ tính toán mã ưu đãi (Discount Engine): Kiểm tra hợp lệ và áp dụng mã giảm giá trực tiếp vào tổng tiền xe.
  - Quản lý mức tiền đặt cọc giữ xe (mặc định tối thiểu 20.000.000 VNĐ).
  - Khóa xe sang trạng thái `reserved` ngay khi đơn cọc được thiết lập.
  - Quản lý các đợt thanh toán (`payments`) theo nhiều phương thức: Chuyển khoản ngân hàng (`bank_transfer`), Tiền mặt (`cash`), Trả góp (`installment`), Thẻ tín dụng (`credit_card`).

### 2.5 CRM & Lead Management Service
- **Mục tiêu:** Tiếp nhận, sàng lọc và nuôi dưỡng khách hàng tiềm năng.
- **Chức năng:**
  - Tự động tiếp nhận lead từ biểu mẫu tư vấn trang chủ, trang chi tiết xe hoặc kênh trao đổi trực tuyến.
  - Chuẩn hóa phễu bán hàng CRM: `new` ➔ `contacted` ➔ `qualified` ➔ `negotiating` ➔ `won` / `lost`.
  - Phân bổ chuyên viên kinh doanh phụ trách (`assigned_to`) và lưu trữ nhật ký ghi chú tư vấn (`notes`).

### 2.6 Smart Recommendation & Valuation Service
- **Mục tiêu:** Cung cấp thuật toán phân tích đối chiếu, gợi ý xe thông minh và định giá thị trường.
- **Chức năng:**
  - Gợi ý xe theo ngân sách và nhu cầu: Phân tích các tiêu chí (kiểu dáng, chỗ ngồi, công suất, tầm tiền) và xếp hạng danh sách xe sẵn có phù hợp nhất từ cơ sở dữ liệu thực.
  - Định giá & phân tích thanh khoản thị trường: Tính toán khoảng giá hợp lý (Fair Price Range), đánh giá tính cạnh tranh của giá bán (Deal Rating) và mức độ giữ giá của mẫu xe.
  - Hỗ trợ công cụ so sánh trực quan đa tiêu chí giữa các dòng xe trên cùng một bảng đối chiếu kỹ thuật.

### 2.7 Review & Rating Service
- **Mục tiêu:** Quản trị đánh giá chất lượng từ khách hàng đã trải nghiệm.
- **Chức năng:**
  - Tiếp nhận điểm số (1 - 5 sao) và nhận xét của khách hàng đối với từng dòng xe.
  - Cơ chế kiểm duyệt an toàn: Đánh giá phải được Quản trị viên duyệt (`is_approved = true`) trước khi xuất bản công khai.

### 2.8 Notification & Communication Service
- **Mục tiêu:** Kênh truyền thông đa phương tiện giữa hệ thống và người dùng.
- **Chức năng:**
  - In-App Notifications: Lưu trữ thông báo dạng chuông, tự động cập nhật số lượng tin chưa đọc trên thanh điều hướng Navbar.
  - Email Service (Nodemailer): Gửi thư điện tử định dạng HTML chuyên nghiệp (xác thực email, khôi phục mật khẩu, xác nhận lịch lái thử thành công).

### 2.9 Audit & Security Logging Service
- **Mục tiêu:** Đảm bảo an ninh, giám sát tuân thủ và lưu vết hoạt động quản trị.
- **Chức năng:**
  - Tự động lưu vết toàn bộ các thao tác nhạy cảm (Tạo/sửa/xóa xe, cập nhật trạng thái đơn hàng, đổi quyền tài khoản, cập nhật phễu lead).
  - Ghi nhận thông tin chi tiết: `userId`, `action`, `entityType`, `entityId`, `oldValues`, `newValues`, `ipAddress`, `userAgent`.
  - Cung cấp giao diện tra cứu nhật ký trực quan cho Quản trị viên (`/admin/logs`).

### 2.10 Reporting & Business Analytics Service
- **Mục tiêu:** Tổng hợp số liệu và cung cấp bức tranh vận hành cho cấp quản lý.
- **Chức năng:**
  - Thống kê thời gian thực: Tổng số xe khả dụng, số lịch lái thử trong tháng, tổng doanh thu/tiền cọc, số lượng lead đang xử lý.
  - Phân tích cơ cấu danh mục xe theo hãng sản xuất (Biểu đồ tròn trực quan).
  - Giám sát tốc độ tiếp nhận và xử lý đơn hàng/lịch hẹn mới nhất.

---

## 3. Kiến Trúc Phân Lớp (Layered Software Architecture)

Hệ thống được tổ chức nghiêm ngặt theo 4 tầng kiến trúc tách biệt:

### 3.1 Tầng Trình Diễn (Presentation Layer - Frontend)
- **Công nghệ:** React 18, Vite, React Router v6.
- **Thành phần:**
  - `components/`: Các thành phần tái sử dụng cao (Navbar, Footer, CarCard, Modal, ChatWidget, ProtectedRoute).
  - `pages/`: Các trang nghiệp vụ công khai (`HomePage`, `CarListPage`, `CarDetailPage`, `ComparePage`).
  - `pages/admin/`: Phân hệ quản trị dành riêng cho nhân viên và admin (`AdminDashboardPage`, `AdminCarsPage`, `AdminBookingsPage`, `AdminOrdersPage`, `AdminLeadsPage`, `AdminReviewsPage`, `AdminUsersPage`, `AdminLogsPage`).
  - `api.js`: Lớp bọc (API Client wrapper) chuẩn hóa các phương thức gọi HTTP, tự động đính kèm `Bearer Token` và tự động xử lý refresh token khi gặp mã lỗi 401.

### 3.2 Tầng Định Tuyến & An Ninh (Routing & Gateway Layer)
- **Công nghệ:** Express Router, CORS, Helmet, Rate Limiter.
- **Nhiệm vụ:**
  - `middleware/auth.js`: Xác minh tính hợp lệ của JWT qua Secret Key, giải mã thông tin phiên làm việc.
  - `middleware/authorize.js`: Kiểm tra vai trò tài khoản (`customer`, `sales`, `admin`) theo ma trận quyền hạn.
  - `middleware/validate.js`: Kiểm tra và ép kiểu dữ liệu đầu vào thông qua các Schema định nghĩa bằng **Zod**, trả về thông báo lỗi 400 chi tiết nếu dữ liệu không hợp lệ.
  - `middleware/errorHandler.js`: Bắt toàn bộ ngoại lệ runtime, chuẩn hóa định dạng lỗi trả về `{ success: false, message: ... }`.

### 3.3 Tầng Nghiệp Vụ (Business Logic Layer - Services)
- **Vị trí:** Thư mục `src/services/`.
- **Đặc điểm:** Hoàn toàn độc lập với giao thức HTTP (không phụ thuộc vào đối tượng `req`, `res`). Chịu trách nhiệm thực thi các phép toán logic, kiểm tra xung đột thời gian, tính toán chiết khấu voucher, và quản lý ranh giới giao dịch CSDL (Transaction Boundaries).

### 3.4 Tầng Truy Xuất Dữ Liệu & Hạ Tầng (Persistence & Infrastructure Layer)
- **Cơ sở dữ liệu:** MySQL 8 InnoDB.
- **Truy vấn:** Sử dụng `mysql2/promise` kết hợp kỹ thuật **Prepared Statements** với ký tự đại diện `?` giúp tối ưu hóa hiệu năng thực thi và loại bỏ 100% nguy cơ tấn công SQL Injection.
- **Tính toàn vẹn:** Sử dụng khóa ngoại (`FOREIGN KEY`) kết hợp `ON DELETE SET NULL` hoặc `ON DELETE CASCADE` phù hợp với nghiệp vụ lưu trữ tài chính.

---

## 4. Đặc Tả Giao Diện Dịch Vụ (Service Interface Specification)

Phần đặc tả dưới đây mô tả giao thức truyền nhận dữ liệu giữa các dịch vụ bằng bảng biểu và diễn giải chi tiết, không dùng mã lệnh lập trình.

### 4.1 Bảng Tổng Hợp Danh Mục Giao Tiếp Dịch Vụ (Service Endpoint Matrix)

| Nhóm Dịch Vụ | Phương Thức & Đường Dẫn | Quyền Hạn Truy Cập | Mục Đích Nghiệp Vụ | Dữ Liệu Đầu Vào Chính | Kết Quả Phản Hồi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Identity Service** | POST `/api/auth/register` | Công khai (Public) | Đăng ký tài khoản khách hàng mới | Họ tên, Email, Mật khẩu, Số điện thoại | Tạo tài khoản ở trạng thái chờ xác thực, gửi mã OTP qua email |
| **Identity Service** | POST `/api/auth/login` | Công khai (Public) | Đăng nhập hệ thống | Email, Mật khẩu | Trả về thông tin người dùng kèm cặp mã Access Token và Refresh Token |
| **Catalog Service** | GET `/api/cars` | Công khai (Public) | Tìm kiếm và lọc danh sách xe | Từ khóa, Hãng, Kiểu dáng, Nhiên liệu, Khoảng giá, Trang | Danh sách tóm tắt các xe thỏa mãn điều kiện và thông tin phân trang |
| **Catalog Service** | GET `/api/cars/:id` | Công khai (Public) | Xem chi tiết thông số xe | Mã định danh xe (ID) | Hồ sơ toàn diện về xe, bộ sưu tập ảnh và thông số kỹ thuật |
| **Booking Service** | POST `/api/bookings` | Khách hàng đăng nhập | Đăng ký lịch lái thử xe | Mã xe, Ngày hẹn, Khung giờ, Số điện thoại, Ghi chú địa điểm | Tạo lịch hẹn mới với trạng thái Chờ xác nhận (`pending`) |
| **Booking Service** | GET `/api/bookings/mine` | Khách hàng đăng nhập | Tra cứu lịch lái thử của bản thân | Thông tin định danh từ Token | Danh sách toàn bộ lịch hẹn của khách hàng kèm trạng thái |
| **Booking Service** | PATCH `/api/bookings/:id/cancel`| Khách hàng đăng nhập | Tự hủy lịch hẹn đang chờ duyệt | Mã lịch hẹn (ID) | Chuyển trạng thái lịch hẹn sang Đã hủy (`cancelled`) |
| **Booking Service** | PATCH `/api/bookings/:id` | Nhân viên Sales / Admin | Điều phối & Cập nhật trạng thái | Mã lịch hẹn, Trạng thái mới, Ghi chú nhân viên | Cập nhật trạng thái duyệt/hoàn thành và gửi email thông báo |
| **Order Service** | POST `/api/orders` | Khách hàng đăng nhập | Khởi tạo đơn đặt mua và cọc xe | Mã xe, Số tiền cọc, Phương thức thanh toán, Mã giảm giá, Ghi chú | Tạo đơn hàng mới, khóa xe sang trạng thái Giữ chỗ (`reserved`) |
| **Order Service** | POST `/api/orders/check-coupon`| Công khai (Public) | Kiểm tra và tính mức giảm giá | Mã voucher, Giá niêm yết của xe | Xác thực tính hợp lệ của mã và trả về số tiền được khấu trừ |
| **CRM Lead Service** | POST `/api/leads` | Công khai / Tùy chọn Auth | Tiếp nhận nhu cầu tư vấn mua xe | Họ tên khách, Số điện thoại, Email, Nhu cầu mong muốn | Lưu trữ khách hàng tiềm năng mới vào phễu chăm sóc |
| **Review Service** | POST `/api/reviews/car/:id` | Khách hàng đăng nhập | Gửi đánh giá và bình luận xe | Mã xe, Điểm đánh giá (1-5 sao), Nội dung nhận xét | Ghi nhận đánh giá ở trạng thái chờ duyệt (`is_approved = false`) |

---

### 4.2 Đặc Tả Chi Tiết: Dịch Vụ Đặt Lịch Lái Thử (Booking Service Specification)

#### A. Tham số đầu vào (Input Specification)
Giao diện tiếp nhận yêu cầu từ biểu mẫu đặt lịch lái thử riêng biệt với các trường thông tin:

| Tên trường dữ liệu | Kiểu dữ liệu | Bắt buộc | Diễn giải & Quy tắc nghiệp vụ |
| :--- | :--- | :---: | :--- |
| **Mã xe (carId)** | Số nguyên dương | Có | Mã định danh chiếc xe khách hàng muốn trải nghiệm lái thử. Xe phải đang ở trạng thái sẵn sàng (`available`). |
| **Ngày lái thử (booking_date)** | Chuỗi ngày (YYYY-MM-DD) | Có | Ngày diễn ra buổi lái thử. Bắt buộc phải là ngày trong tương lai (tối thiểu từ ngày kế tiếp trở đi). |
| **Khung giờ (time_slot)** | Chuỗi giờ (HH:mm) | Có | Lựa chọn một trong các khung giờ cố định trong ngày: Buổi sáng (08:30, 09:30, 10:30) hoặc Buổi chiều (14:00, 15:00, 16:00). |
| **Số điện thoại (contactPhone)**| Chuỗi ký tự số | Có | Số điện thoại trực tiếp của khách để nhân viên showroom liên hệ xác nhận (độ dài từ 8 đến 20 chữ số). |
| **Ghi chú trải nghiệm (note)** | Chuỗi văn bản | Không | Thông tin bổ sung bao gồm: Địa điểm nhận xe (tại Showroom SkyCar hoặc tại nhà riêng), Số giấy phép lái xe (GPLX) và các yêu cầu cung đường chạy thử. |

#### B. Kết quả phản hồi (Output Specification)
- **Trường hợp xử lý thành công (Mã HTTP 201 Created):**
  - Hệ thống xác nhận giao dịch thành công.
  - Cung cấp mã định danh lịch hẹn vừa tạo (ID số nguyên).
  - Trạng thái ban đầu của lịch hẹn được thiết lập là `pending` (Chờ nhân viên showroom xác nhận).
  - Kích hoạt quy trình ngầm: Gửi email thông báo tự động tới hòm thư của khách hàng và tạo thông báo chuông trên hệ thống.
- **Trường hợp phát sinh lỗi nghiệp vụ (Mã HTTP 400 Bad Request / 409 Conflict):**
  - Nếu xe không còn ở trạng thái kinh doanh hoặc thời gian hẹn thuộc quá khứ: Trả về thông báo lỗi yêu cầu chọn lại thời gian.
  - Nếu khung giờ trên xe đó đã có lịch hẹn được xác nhận từ trước: Báo lỗi xung đột lịch trùng để khách chọn khung giờ khác.

---

### 4.3 Đặc Tả Chi Tiết: Dịch Vụ Đặt Mua Xe & Đặt Cọc (Order & Deposit Specification)

#### A. Tham số đầu vào (Input Specification)
Giao diện nhận dữ liệu từ trang đặt mua xe trực tuyến (`/cars/:id/order`):

| Tên trường dữ liệu | Kiểu dữ liệu | Bắt buộc | Diễn giải & Quy tắc nghiệp vụ |
| :--- | :--- | :---: | :--- |
| **Mã xe (carId)** | Số nguyên dương | Có | Chiếc xe khách hàng chọn mua. |
| **Số tiền đặt cọc (depositAmount)** | Số tiền (VND) | Có | Số tiền khách hàng đồng ý cọc trước để khóa xe. Quy định mức cọc tối thiểu là **20.000.000 VNĐ**. |
| **Hình thức thanh toán (paymentMethod)** | Chuỗi danh mục | Có | Chọn một trong các hình thức: Chuyển khoản ngân hàng (`bank_transfer`), Tiền mặt tại quầy (`cash`), hoặc Hỗ trợ trả góp (`installment`). |
| **Mã ưu đãi (couponCode)** | Chuỗi ký tự | Không | Mã giảm giá do SkyCar phát hành (ví dụ: `GIAM20TR`, `VIPMEMBER`). |
| **Ghi chú nhận xe (note)** | Chuỗi văn bản | Không | Thời gian mong muốn nhận bàn giao xe, yêu cầu gắn phụ kiện, hỗ trợ đăng ký biển số. |

#### B. Kết quả phản hồi (Output Specification)
- **Trường hợp xử lý thành công (Mã HTTP 201 Created):**
  - Hệ thống tạo hồ sơ đơn hàng mới với mã số đơn hàng duy nhất.
  - Tự động tính toán và trả về: Giá niêm yết gốc của xe, Số tiền chiết khấu từ voucher, Tổng số tiền sau giảm giá, Số tiền cọc đã ghi nhận, và Số tiền còn lại khách cần thanh toán khi nhận xe.
  - Trạng thái xe trên toàn hệ thống lập tức chuyển thành `reserved` (Đã giữ chỗ).
  - Hiển thị hướng dẫn chuyển khoản chi tiết gồm: Tên ngân hàng đối tác (MBBank), Số tài khoản đại diện, Tên chủ tài khoản (`CTY CP SKYCAR VIETNAM`) và Cú pháp chuyển tiền chuẩn hóa.

---

### 4.4 Đặc Tả Chi Tiết: Dịch Vụ Kiểm Tra & Áp Dụng Voucher (Discount Specification)

#### A. Tham số đầu vào (Input Specification)
| Tên trường dữ liệu | Kiểu dữ liệu | Bắt buộc | Diễn giải & Quy tắc nghiệp vụ |
| :--- | :--- | :---: | :--- |
| **Mã giảm giá (code)** | Chuỗi ký tự | Có | Mã voucher do khách hàng nhập hoặc chọn từ danh sách ưu đãi. |
| **Giá trị xe (carPrice)** | Số tiền (VND) | Có | Giá bán niêm yết của mẫu xe đang xem xét áp dụng. |

#### B. Kết quả phản hồi (Output Specification)
- **Khi mã voucher hợp lệ:**
  - Cờ xác thực đạt giá trị đúng (`valid = true`).
  - Trả về số tiền chính xác được khấu trừ trực tiếp (ví dụ: 20.000.000 VNĐ).
  - Tên chương trình ưu đãi và văn bản mô tả điều kiện đi kèm.
- **Khi mã voucher không hợp lệ hoặc hết hạn:**
  - Cờ xác thực mang giá trị sai (`valid = false`).
  - Kèm theo lý do giải thích chi tiết bằng tiếng Việt: Mã không tồn tại, Mã đã hết lượt sử dụng, hoặc Giá trị xe chưa đạt mức tối thiểu để áp dụng chính sách ưu đãi.

---

## 5. An Ninh & Đảm Bảo Chất Lượng Hệ Thống (Quality & Security)
1. **Xác thực phi trạng thái (Stateless JWT):** Không lưu trữ session trên bộ nhớ RAM máy chủ, giúp hệ thống dễ dàng mở rộng theo chiều ngang (Horizontal Scaling).
2. **Bảo mật mật khẩu:** Toàn bộ mật khẩu người dùng được băm bằng thuật toán `bcrypt` với muối ngẫu nhiên (Salt rounds = 12).
3. **Kiểm soát tính nhất quán giao dịch (ACID Transactions):** Các hành vi như đặt lịch lái thử hoặc đặt cọc giữ xe đều kích hoạt `connection.beginTransaction()` và `SELECT ... FOR UPDATE` để chống tranh chấp dữ liệu (Race Condition).
4. **Kiểm toán toàn vẹn:** Mọi thay đổi dữ liệu từ tầng quản trị đều được ghi nhận vào bảng `activity_logs` phục vụ tra soát độc lập.

---

## 6. Lộ Trình Phát Triển Kiến Trúc (Scalability Roadmap)

1. **Giai đoạn 1 (Hiện tại - Modular Monolith SOA):**
   - Đóng gói toàn bộ các service trong cùng một Node.js process nhưng phân chia module và database schema domain hoàn toàn riêng biệt.
   - Ưu điểm: Tốc độ phát triển nhanh, độ trễ truy vấn nội bộ bằng 0, chi phí triển khai và bảo trì thấp.
2. **Giai đoạn 2 (Microservices Tách Rời):**
   - Đưa API Gateway (NGINX / Kong) đứng trước làm điểm tiếp nhận duy nhất.
   - Tách các dịch vụ có tải cao như `Vehicle Catalog Service` và `Identity Service` ra thành các Container riêng biệt chạy độc lập trên Docker/Kubernetes.
3. **Giai đoạn 3 (Kiến Trúc Hướng Sự Kiện - Event-Driven Architecture):**
   - Tích hợp Message Broker (RabbitMQ hoặc Apache Kafka).
   - Khi có sự kiện `OrderCreated` hoặc `BookingRequested`, Order Service phát tín hiệu ra Event Bus; Notification Service và CRM Service nhận sự kiện và xử lý bất đồng bộ mà không làm chậm thời gian phản hồi của người dùng.

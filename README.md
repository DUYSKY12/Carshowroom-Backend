# 🚗 SkyCar Enterprise Backend System

Backend hoàn chỉnh cho hệ thống showroom kinh doanh ô tô SkyCar, quản lý kho xe, hình ảnh WebP, đặt lịch lái thử, quy trình bán hàng CRM, mã giảm giá (voucher), đặt cọc đơn hàng và thanh toán, đánh giá & yêu thích, cùng hệ thống báo cáo quản trị toàn diện.

---

## 🌟 Tính Năng Nổi Bật

### 1. 🤖 Trí Tuệ Nhân Tạo (AI Core)
- **AI Car Advisor Chatbot**: Trợ lý tư vấn bán xe thông minh, ghi nhớ phiên trò chuyện (`chat_sessions`), am hiểu kho xe thực tế tại showroom.
- **Smart Car Recommendation**: Đề xuất xe dựa trên ngân sách, số chỗ, phong cách sống kết hợp lập luận và giải thích chuyên sâu từ AI.
- **Natural Language Search**: Tìm xe bằng ngôn ngữ tự nhiên (VD: *"Tìm cho tôi chiếc SUV 7 chỗ gầm cao dưới 1.2 tỷ tiết kiệm xăng"*).
- **Used Car Valuation**: Thẩm định và định giá xe cũ theo số km lăn bánh (ODO), năm sản xuất và tình trạng xe.
- **AI Executive Insights**: Phân tích thị hiếu khách hàng và đề xuất chiến lược nhập hàng cho ban giám đốc.
- **Hỗ trợ đa nhà cung cấp**: Google Gemini (`gemini-2.0-flash`), OpenAI (`gpt-4o-mini`), hoặc Offline Mock AI thông minh khi chưa có API key.

### 2. 🔐 Xác Thực & Quản Trị Người Dùng (Auth & Users)
- **Access Token (15m) + Refresh Token (7d)** với cơ chế Rotation an toàn chống đánh cắp phiên.
- **Xác thực Email (Email Verification)**: Gửi mã OTP 6 chữ số qua email (Nodemailer / HTML templates).
- **Quên & Đặt lại Mật khẩu (Forgot/Reset Password)** an toàn qua liên kết email có thời hạn.
- **Quản lý Hồ sơ**: Cập nhật thông tin cá nhân, avatar, đổi mật khẩu.
- **Admin User Management**: Danh sách người dùng, phân quyền (Customer / Sales / Admin), khóa/mở tài khoản.
- **Audit Activity Logs**: Ghi vết mọi thao tác quản trị và thay đổi trạng thái quan trọng.

### 3. 🏎️ Quản Lý Xe & Media (Cars & Gallery)
- Bộ lọc nâng cao: Hãng, kiểu dáng (Sedan, SUV, MPV...), tầm giá, năm sản xuất, hộp số, nhiên liệu, số chỗ.
- **Upload Album Ảnh Xe**: Tự động nén và chuyển đổi sang định dạng tối ưu WebP qua `Sharp`.
- Quản lý ảnh đại diện (Primary Image) và sắp xếp thứ tự ảnh.
- **So Sánh Xe (Car Comparison)**: So sánh thông số 2–4 xe song song.
- Tự động đếm lượt xem (View Counter) theo thời gian thực.

### 4. 🛒 Nghiệp Vụ Thương Mại & Tương Tác (E-Commerce)
- **Đơn Hàng & Đặt Cọc (Orders & Payments)**: Quy trình đặt mua xe, tự động sinh mã đơn `ORD-...`, giữ xe trong kho (`reserved` -> `sold`), ghi nhận đợt thanh toán đặt cọc.
- **Yêu Thích (Wishlist)**: Lưu xe yêu thích vào hồ sơ cá nhân.
- **Đánh Giá & Xếp Hạng (Reviews & Ratings)**: Khách hàng đánh giá 1-5 sao, ban quản trị duyệt nội dung.
- **Thông Báo In-App (Notifications)**: Thông báo trạng thái đặt cọc, duyệt lịch lái thử, đơn hàng.

### 5. 📅 Lịch Hẹn & CRM (Bookings & Leads)
- Đặt lịch lái thử xe chống trùng giờ (Transaction Row-Level Lock), tự động gửi email xác nhận.
- Quản lý phễu khách hàng tiềm năng (Leads CRM): `new` -> `contacted` -> `qualified` -> `negotiating` -> `won` / `lost`.

### 6. 📊 Báo Cáo & Thống Kê (Executive Reports)
- Dashboard KPI tổng hợp: Tồn kho, doanh thu, đơn hàng, tỷ lệ chuyển đổi Lead.
- Báo cáo doanh thu theo tháng và theo thương hiệu xe.
- Phân tích sức khỏe kho hàng và các xe tồn kho lâu ngày.

### 7. ⚙️ Tối Ưu & Bảo Trị Tự Động
- **Swagger Documentation UI**: Tương tác API trực quan tại `/api/docs`.
- **Scheduled Cron Jobs**: Tự động dọn dẹp token hết hạn và cập nhật lịch hẹn quá hạn.
- **Structured Logging**: Ghi log chuẩn hóa với Winston & Morgan (Console + File rotation).
- **Rate Limiting**: Giới hạn tần suất gọi API bảo vệ hệ thống khỏi tấn công DoS/brute force.

---

## 🚀 Hướng Dẫn Cài Đặt

### 1. Chuẩn bị môi trường
- Node.js >= 20.x
- MySQL >= 8.0

### 2. Thiết lập cơ sở dữ liệu
Chạy toàn bộ script SQL trong file:
```bash
sql/schema.sql
```
trong MySQL Workbench, DBeaver hoặc dòng lệnh MySQL:
```bash
mysql -u root -p < sql/schema.sql
```

### 3. Cấu hình biến môi trường
Sao chép `.env.example` thành `.env` và điều chỉnh các thông số:
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=car_showroom

JWT_SECRET=super_secret_car_showroom_jwt_key_at_least_32_characters_long_2027!
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cấu hình AI: mock | gemini | openai
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-2.0-flash

# SMTP Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. Nạp dữ liệu mẫu (Seed Data)
Nạp 8 mẫu xe thật tại Việt Nam cùng các tài khoản Admin, Sales, Khách hàng mẫu:
```bash
npm run seed
```

**Tài khoản đăng nhập có sẵn:**
- **Admin**: `admin@carshowroom.vn` / Mật khẩu: `Showroom@123456`
- **Sales**: `sales@carshowroom.vn` / Mật khẩu: `Showroom@123456`
- **Customer**: `customer@gmail.com` / Mật khẩu: `Showroom@123456`

### 5. Khởi động server
```bash
# Chế độ phát triển (auto reload)
npm run dev

# Hoặc chế độ chạy chính thức
npm start
```

- **API Root**: `http://localhost:5000/`
- **Kiểm tra trạng thái**: `http://localhost:5000/api/health`
- **Tài liệu Swagger UI**: `http://localhost:5000/api/docs`

---

## 📡 Danh Sách API Endpoints

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Mô tả | Quyền hạn |
|---|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản & gửi OTP email | Public |
| POST | `/api/auth/login` | Đăng nhập (trả Access + Refresh Token) | Public |
| POST | `/api/auth/refresh` | Đổi Refresh Token lấy Access Token mới | Public |
| POST | `/api/auth/logout` | Đăng xuất & thu hồi Refresh Token | Public |
| POST | `/api/auth/verify-email` | Xác thực tài khoản bằng mã 6 số | Public |
| POST | `/api/auth/resend-verification` | Gửi lại mã xác thực | Public |
| POST | `/api/auth/forgot-password` | Yêu cầu gửi link đổi mật khẩu | Public |
| POST | `/api/auth/reset-password` | Đặt lại mật khẩu mới bằng token | Public |
| GET | `/api/auth/me` | Xem hồ sơ tài khoản hiện tại | Logged in |
| PUT | `/api/auth/profile` | Cập nhật họ tên, điện thoại, avatar | Logged in |
| PUT | `/api/auth/change-password` | Đổi mật khẩu tài khoản | Logged in |

### 🤖 AI Core (`/api/ai`)
| Method | Endpoint | Mô tả | Quyền hạn |
|---|---|---|---|
| POST | `/api/ai/recommend` | Gợi ý xe thông minh kèm phân tích LLM | Public/User |
| POST | `/api/ai/chat` | Trò chuyện với trợ lý bán xe AI (hỗ trợ session) | Public/User |
| GET | `/api/ai/chat/sessions` | Lấy danh sách phiên chat đã lưu | Logged in |
| GET | `/api/ai/chat/sessions/:id`| Lấy lịch sử tin nhắn của một phiên chat | Logged in |
| DELETE| `/api/ai/chat/sessions/:id`| Xóa phiên trò chuyện | Logged in |
| POST | `/api/ai/search` | Tìm xe bằng văn bản tự nhiên | Public |
| POST | `/api/ai/price-estimate` | Thẩm định và định giá xe cũ qua AI | Public |
| GET | `/api/ai/insights` | Báo cáo xu hướng thị hiếu khách hàng | Admin/Sales |

### 🚗 Xe & Thư Viện Ảnh (`/api/cars`)
| Method | Endpoint | Mô tả | Quyền hạn |
|---|---|---|---|
| GET | `/api/cars` | Tìm kiếm & lọc danh sách xe có phân trang | Public |
| GET | `/api/cars/:id` | Chi tiết thông số xe, lượt xem và album ảnh | Public |
| POST | `/api/cars/compare` | So sánh 2-4 xe song song | Public |
| POST | `/api/cars` | Thêm xe mới vào kho | Admin/Sales |
| PUT | `/api/cars/:id` | Cập nhật thông tin xe | Admin/Sales |
| DELETE| `/api/cars/:id` | Ẩn xe (soft delete) | Admin |
| POST | `/api/cars/:id/images` | Upload nhiều ảnh xe (tự nén sang WebP) | Admin/Sales |
| GET | `/api/cars/:id/images` | Danh sách album ảnh xe | Public |
| DELETE| `/api/cars/:id/images/:imgId`| Xóa ảnh xe | Admin/Sales |
| PATCH | `/api/cars/:id/images/:imgId/primary`| Đặt làm ảnh đại diện chính | Admin/Sales |

### 🛒 Đơn Hàng & Thanh Toán (`/api/orders`)
| Method | Endpoint | Mô tả | Quyền hạn |
|---|---|---|---|
| POST | `/api/orders` | Khách tạo đơn đặt mua & giữ chỗ xe | Customer |
| GET | `/api/orders/mine` | Xem danh sách đơn hàng của tôi | Customer |
| GET | `/api/orders/:id` | Chi tiết đơn hàng và lịch sử thanh toán | Owner/Staff |
| GET | `/api/orders` | Quản lý tất cả đơn hàng | Admin/Sales |
| PATCH | `/api/orders/:id/status` | Cập nhật trạng thái (`processing`, `completed`...)| Admin/Sales |
| POST | `/api/orders/:id/payments` | Ghi nhận thanh toán đặt cọc / trả đủ | Admin/Sales |

### 💖 Yêu Thích & Đánh Giá (`/api/favorites` & `/api/reviews`)
| Method | Endpoint | Mô tả | Quyền hạn |
|---|---|---|---|
| GET | `/api/favorites` | Danh sách xe yêu thích | Customer |
| POST | `/api/favorites/:carId` | Thêm xe vào yêu thích | Customer |
| DELETE| `/api/favorites/:carId` | Bỏ xe khỏi yêu thích | Customer |
| GET | `/api/favorites/:carId/check`| Kiểm tra xe đã thích chưa | Customer |
| GET | `/api/reviews/car/:carId` | Xem các bài đánh giá của 1 xe | Public |
| POST | `/api/reviews/car/:carId` | Viết đánh giá & cho điểm sao | Customer |
| GET | `/api/reviews` | Quản lý các bài đánh giá | Admin/Sales |
| PATCH | `/api/reviews/:id/approve` | Duyệt bài đánh giá | Admin/Sales |
| DELETE| `/api/reviews/:id` | Xóa bài đánh giá | Owner/Admin |

### 📅 Lịch Hẹn Lái Thử (`/api/bookings`)
| Method | Endpoint | Mô tả | Quyền hạn |
|---|---|---|---|
| POST | `/api/bookings` | Đặt lịch hẹn lái thử (gửi email xác nhận) | Customer |
| GET | `/api/bookings/mine` | Xem lịch lái thử của mình | Customer |
| PATCH | `/api/bookings/:id/cancel` | Khách hủy lịch hẹn | Customer |
| GET | `/api/bookings` | Quản lý danh sách lịch hẹn | Admin/Sales |
| PATCH | `/api/bookings/:id` | Xác nhận / cập nhật trạng thái lịch hẹn | Admin/Sales |

### 🔔 Thông Báo (`/api/notifications`)
| Method | Endpoint | Mô tả | Quyền hạn |
|---|---|---|---|
| GET | `/api/notifications` | Danh sách thông báo | Logged in |
| GET | `/api/notifications/unread-count`| Số lượng thông báo chưa đọc | Logged in |
| PATCH | `/api/notifications/:id/read` | Đánh dấu 1 thông báo đã đọc | Logged in |
| PATCH | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc | Logged in |

### 👥 Quản Trị Hệ Thống (`/api/admin`)
| Method | Endpoint | Mô tả | Quyền hạn |
|---|---|---|---|
| GET | `/api/admin/users` | Danh sách tài khoản người dùng & lọc role | Admin |
| GET | `/api/admin/users/:id` | Chi tiết tài khoản | Admin |
| PATCH | `/api/admin/users/:id` | Thay đổi quyền hạn hoặc khóa tài khoản | Admin |
| GET | `/api/admin/logs` | Xem lịch sử vết kiểm toán (Audit Trail) | Admin |

### 📈 Báo Cáo Kinh Doanh (`/api/reports`)
| Method | Endpoint | Mô tả | Quyền hạn |
|---|---|---|---|
| GET | `/api/reports/dashboard` | Thống kê tổng hợp số liệu kinh doanh | Admin/Sales |
| GET | `/api/reports/revenue` | Báo cáo doanh thu theo tháng và hãng | Admin/Sales |
| GET | `/api/reports/inventory` | Phân tích cơ cấu và tuổi tồn kho xe | Admin/Sales |

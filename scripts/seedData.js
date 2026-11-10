import bcrypt from "bcryptjs";
import pool from "../src/config/db.js";

async function seed() {
  console.log("🌱 Starting seed data for CarShowroom...");

  // 1. Users
  console.log("Creating default users (Admin, Sales, Customer)...");
  const defaultPasswordHash = await bcrypt.hash("Showroom@123456", 12);

  const users = [
    {
      name: "Anh Duy",
      email: "admin@carshowroom.vn",
      phone: "0901234567",
      role: "admin",
      verified: true
    },
    {
      name: "Seller",
      email: "sales@carshowroom.vn",
      phone: "0912345678",
      role: "sales",
      verified: true
    },
    {
      name: "Lê Khách Hàng",
      email: "customer@gmail.com",
      phone: "0987654321",
      role: "customer",
      verified: true
    }
  ];

  const userIds = {};

  for (const u of users) {
    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [u.email]);
    if (existing.length) {
      userIds[u.role] = existing[0].id;
    } else {
      const [res] = await pool.execute(
        `INSERT INTO users (full_name, email, phone, password_hash, role, email_verified, is_active)
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [u.name, u.email, u.phone, defaultPasswordHash, u.role, u.verified]
      );
      userIds[u.role] = res.insertId;
      console.log(`+ Created user: ${u.email} (Role: ${u.role})`);
    }
  }

  // 2. Cars
  console.log("Seeding realistic vehicle catalog...");
  const sampleCars = [
    {
      name: "Toyota Camry 2.5Q",
      brand: "Toyota",
      model: "Camry",
      year: 2024,
      price: 1405000000,
      fuel_type: "gasoline",
      transmission: "automatic",
      body_type: "sedan",
      engine_capacity: "2.5L",
      horsepower: 207,
      torque: "250 Nm",
      drive_type: "fwd",
      seats: 5,
      mileage_km: 1500,
      color: "Đen",
      interior_color: "Beige",
      description: "Toyota Camry 2.5Q phiên bản cao cấp nhất, trang bị gói Toyota Safety Sense, rèm che nắng chỉnh điện, hàng ghế sau VIP ngả điện.",
      features: ["Cửa sổ trời", "Gói an toàn TSS", "Màn hình 9 inch", "Cảnh báo điểm mù", "Âm thanh JBL 9 loa"],
      image_url: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
      status: "available"
    },
    {
      name: "Ford Everest Titanium 4x4",
      brand: "Ford",
      model: "Everest",
      year: 2024,
      price: 1499000000,
      fuel_type: "diesel",
      transmission: "automatic",
      body_type: "suv",
      engine_capacity: "2.0L Bi-Turbo",
      horsepower: 210,
      torque: "500 Nm",
      drive_type: "4wd",
      seats: 7,
      mileage_km: 5000,
      color: "Trắng Tuyết",
      interior_color: "Đen",
      description: "SUV 7 chỗ gầm cao mạnh mẽ nhất phân khúc. Hộp số 10 cấp, 6 chế độ lái địa hình, hỗ trợ đỗ xe tự động và camera 360 độ.",
      features: ["Dẫn động 2 cầu 4WD", "Màn hình 12 inch", "Cửa sổ trời toàn cảnh Panorama", "SYNC 4", "Hỗ trợ phanh khẩn cấp"],
      image_url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      status: "available"
    },
    {
      name: "VinFast VF 8 Plus",
      brand: "VinFast",
      model: "VF8",
      year: 2024,
      price: 1309000000,
      fuel_type: "electric",
      transmission: "automatic",
      body_type: "suv",
      engine_capacity: "Dual Motor EV",
      horsepower: 402,
      torque: "620 Nm",
      drive_type: "awd",
      seats: 5,
      mileage_km: 200,
      color: "Xanh Deep Ocean",
      interior_color: "Nâu Saddle",
      description: "Xe điện thông minh D-SUV đẳng cấp toàn cầu. Tăng tốc 0-100km/h chỉ trong 5.5 giây, trang bị hệ thống lái tự động ADAS Level 2 và trợ lý ảo thông minh tiếng Việt.",
      features: ["Hệ thống ADAS thông minh", "Trợ lý ảo tiếng Việt", "Sạc nhanh 10-70% trong 24 phút", "Màn hình trung tâm 15.6 inch"],
      image_url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      status: "available"
    },
    {
      name: "Mazda CX-5 2.0L Premium Exclusive",
      brand: "Mazda",
      model: "CX-5",
      year: 2023,
      price: 869000000,
      fuel_type: "gasoline",
      transmission: "automatic",
      body_type: "suv",
      engine_capacity: "2.0L SkyActiv-G",
      horsepower: 154,
      torque: "200 Nm",
      drive_type: "fwd",
      seats: 5,
      mileage_km: 12000,
      color: "Đỏ Pha Lê Soul Red Crystal",
      interior_color: "Đen",
      description: "Mẫu C-SUV bán chạy số 1 thị trường. Ngôn ngữ thiết kế KODO tinh tế, công nghệ an toàn i-Activesense và hệ thống 10 loa Bose cao cấp.",
      features: ["Gói i-Activsense", "Loa Bose 10 loa", "HUD kính lái", "Camera 360", "Sấy sưởi ghế"],
      image_url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
      status: "available"
    },
    {
      name: "Hyundai Santa Fe 2.2D HTRAC Cao Cấp",
      brand: "Hyundai",
      model: "Santa Fe",
      year: 2023,
      price: 1269000000,
      fuel_type: "diesel",
      transmission: "automatic",
      body_type: "suv",
      engine_capacity: "2.2L SmartStream",
      horsepower: 202,
      torque: "440 Nm",
      drive_type: "awd",
      seats: 7,
      mileage_km: 18000,
      color: "Trắng",
      interior_color: "Nâu",
      description: "Mẫu SUV 7 chỗ gia đình tiện nghi hàng đầu. Động cơ dầu siêu tiết kiệm, hộp số ly hợp kép 8 cấp ướt và dẫn động 4 bánh HTRAC.",
      features: ["Dẫn động HTRAC", "Cần số nút bấm", "Gói Hyundai SmartSense", "Đèn pha thích ứng Adaptive"],
      image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      status: "available"
    },
    {
      name: "Honda CR-V e:HEV RS",
      brand: "Honda",
      model: "CR-V",
      year: 2024,
      price: 1259000000,
      fuel_type: "hybrid",
      transmission: "automatic",
      body_type: "suv",
      engine_capacity: "2.0L Hybrid e:HEV",
      horsepower: 204,
      torque: "335 Nm",
      drive_type: "fwd",
      seats: 5,
      mileage_km: 800,
      color: "Đỏ",
      interior_color: "Đen viền chỉ đỏ",
      description: "Phiên bản Hybrid đỉnh cao của Honda CR-V với công nghệ e:HEV tiết kiệm nhiên liệu chỉ 3.4L/100km đô thị, gói công nghệ an toàn Honda SENSING thế hệ mới.",
      features: ["Động cơ Hybrid siêu tiết kiệm", "Gói Honda SENSING", "Honda CONNECT", "Cốp điện rảnh tay"],
      image_url: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80",
      status: "available"
    },
    {
      name: "Mercedes-Benz C 300 AMG",
      brand: "Mercedes-Benz",
      model: "C-Class",
      year: 2023,
      price: 2099000000,
      fuel_type: "gasoline",
      transmission: "automatic",
      body_type: "sedan",
      engine_capacity: "2.0L EQ Boost",
      horsepower: 258,
      torque: "400 Nm",
      drive_type: "rwd",
      seats: 5,
      mileage_km: 8500,
      color: "Xanh Cavansite",
      interior_color: "Nâu Sienna",
      description: "Sedan hạng sang thể thao đậm chất quý tộc. Gói ngoại thất thể thao AMG, cụm đèn Digital Light tối tân nhất, màn hình cảm ứng 11.9 inch phong cách S-Class.",
      features: ["Đèn Digital Light", "Bodykit AMG", "Loa Burmester 3D", "Camera 360 giả lập gầm xe"],
      image_url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
      status: "available"
    },
    {
      name: "Kia Carnival 2.2D Signature",
      brand: "Kia",
      model: "Carnival",
      year: 2024,
      price: 1469000000,
      fuel_type: "diesel",
      transmission: "automatic",
      body_type: "mpv",
      engine_capacity: "2.2L Diesel",
      horsepower: 199,
      torque: "440 Nm",
      drive_type: "fwd",
      seats: 7,
      mileage_km: 3000,
      color: "Bạc",
      interior_color: "Nâu",
      description: "Mẫu xe MPV cỡ lớn gia đình và chuyên chở thương gia cao cấp nhất. Hàng ghế thương gia bọc da Nappa có đệm đỡ bắp chân, sưởi và làm mát.",
      features: ["Ghế thương gia VIP", "Cửa trượt điện thông minh", "Màn hình kép 12.3 inch", "Hệ thống loa Bose"],
      image_url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
      status: "available"
    }
  ];

  for (const car of sampleCars) {
    const [exists] = await pool.execute("SELECT id FROM cars WHERE name = ? LIMIT 1", [car.name]);
    if (!exists.length) {
      const [insertRes] = await pool.execute(
        `INSERT INTO cars
         (name, brand, model, year, price, fuel_type, transmission, body_type,
          engine_capacity, horsepower, torque, drive_type, seats, mileage_km,
          color, interior_color, description, features, image_url, status, view_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          car.name, car.brand, car.model, car.year, car.price,
          car.fuel_type, car.transmission, car.body_type, car.engine_capacity,
          car.horsepower, car.torque, car.drive_type, car.seats, car.mileage_km,
          car.color, car.interior_color, car.description, JSON.stringify(car.features),
          car.image_url, car.status, Math.floor(Math.random() * 200 + 20)
        ]
      );
      const carId = insertRes.insertId;

      // Add primary image to car_images
      await pool.execute(
        `INSERT INTO car_images (car_id, image_url, is_primary, sort_order)
         VALUES (?, ?, TRUE, 0)`,
        [carId, car.image_url]
      );

      console.log(`+ Seeded car: ${car.name}`);
    }
  }

  // 3. Sample Review
  console.log("Seeding sample reviews...");
  const [firstCar] = await pool.execute("SELECT id FROM cars LIMIT 1");
  if (firstCar.length && userIds.customer) {
    const [reviewExists] = await pool.execute(
      "SELECT id FROM reviews WHERE user_id = ? AND car_id = ? LIMIT 1",
      [userIds.customer, firstCar[0].id]
    );
    if (!reviewExists.length) {
      await pool.execute(
        `INSERT INTO reviews (user_id, car_id, rating, title, content, is_approved)
         VALUES (?, ?, 5, 'Trải nghiệm lái cực kỳ đầm chắc!', 'Tôi rất ấn tượng với khả năng cách âm và độ êm ái khi chạy cao tốc. Chuyên viên tư vấn nhiệt tình.', TRUE)`,
        [userIds.customer, firstCar[0].id]
      );
      console.log("+ Seeded sample review.");
    }
  }

  console.log("✅ Seed data completed successfully!");
  console.log("--------------------------------------------------");
  console.log("Demo Accounts:");
  console.log("- Admin:    admin@carshowroom.vn    / Showroom@123456");
  console.log("- Sales:    sales@carshowroom.vn    / Showroom@123456");
  console.log("- Customer: customer@gmail.com      / Showroom@123456");
  console.log("--------------------------------------------------");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    pool.end();
  });

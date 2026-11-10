CREATE DATABASE IF NOT EXISTS car_showroom
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE car_showroom;

-- ═══════════════════════════════════════════════
-- USERS & AUTH
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  role ENUM('customer', 'sales', 'admin') NOT NULL DEFAULT 'customer',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_tokens_hash (token_hash),
  INDEX idx_refresh_tokens_user (user_id),
  INDEX idx_refresh_tokens_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS email_verifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(100) NOT NULL,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_verifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email_verifications_code (code),
  INDEX idx_email_verifications_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_resets_token (token_hash),
  INDEX idx_password_resets_user (user_id)
) ENGINE=InnoDB;

-- ═══════════════════════════════════════════════
-- VEHICLES
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cars (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NULL,
  year SMALLINT UNSIGNED NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  fuel_type ENUM('gasoline','diesel','electric','hybrid','other') NOT NULL DEFAULT 'gasoline',
  transmission ENUM('automatic','manual','other') NOT NULL DEFAULT 'automatic',
  body_type ENUM('sedan','suv','hatchback','coupe','convertible','wagon','van','truck','pickup','mpv','other') NULL,
  engine_capacity VARCHAR(30) NULL,
  horsepower SMALLINT UNSIGNED NULL,
  torque VARCHAR(50) NULL,
  drive_type ENUM('fwd','rwd','awd','4wd') NULL,
  seats TINYINT UNSIGNED NULL,
  mileage_km INT UNSIGNED NULL,
  color VARCHAR(60) NULL,
  interior_color VARCHAR(60) NULL,
  description TEXT NULL,
  features JSON NULL,
  image_url VARCHAR(500) NULL,
  status ENUM('available','reserved','sold','hidden') NOT NULL DEFAULT 'available',
  view_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cars_brand (brand),
  INDEX idx_cars_price (price),
  INDEX idx_cars_year (year),
  INDEX idx_cars_status (status),
  INDEX idx_cars_body_type (body_type),
  FULLTEXT INDEX ft_cars_search (name, brand, model, description)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS car_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  car_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_car_images_car FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
  INDEX idx_car_images_car (car_id)
) ENGINE=InnoDB;

-- ═══════════════════════════════════════════════
-- BOOKINGS
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  car_id BIGINT UNSIGNED NOT NULL,
  scheduled_at DATETIME NOT NULL,
  contact_phone VARCHAR(30) NOT NULL,
  note VARCHAR(1000) NULL,
  status ENUM('pending','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
  handled_by BIGINT UNSIGNED NULL,
  staff_note VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_bookings_car FOREIGN KEY (car_id) REFERENCES cars(id),
  CONSTRAINT fk_bookings_handler FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_bookings_scheduled_at (scheduled_at),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_customer (customer_id)
) ENGINE=InnoDB;

-- ═══════════════════════════════════════════════
-- LEADS / CRM
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NULL,
  car_id BIGINT UNSIGNED NULL,
  customer_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(30) NOT NULL,
  budget_min DECIMAL(15,2) NULL,
  budget_max DECIMAL(15,2) NULL,
  purpose VARCHAR(255) NULL,
  source ENUM('website','ai_chat','phone','walk_in','other') NOT NULL DEFAULT 'website',
  status ENUM('new','contacted','qualified','negotiating','won','lost') NOT NULL DEFAULT 'new',
  assigned_to BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_leads_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_leads_car FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL,
  CONSTRAINT fk_leads_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_leads_status (status),
  INDEX idx_leads_assigned_to (assigned_to),
  INDEX idx_leads_created_at (created_at)
) ENGINE=InnoDB;

-- ═══════════════════════════════════════════════
-- AI
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_interactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  intent VARCHAR(80) NOT NULL,
  request_summary TEXT NULL,
  response_summary TEXT NULL,
  recommended_car_ids JSON NULL,
  provider VARCHAR(60) NOT NULL DEFAULT 'mock',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ai_created_at (created_at),
  INDEX idx_ai_intent (intent)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  session_token VARCHAR(100) NULL,
  title VARCHAR(200) NOT NULL DEFAULT 'Cuộc trò chuyện mới',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_chat_sessions_user (user_id),
  INDEX idx_chat_sessions_token (session_token)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT UNSIGNED NOT NULL,
  role ENUM('user','assistant','system') NOT NULL,
  content TEXT NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_messages_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
  INDEX idx_chat_messages_session (session_id)
) ENGINE=InnoDB;

-- ═══════════════════════════════════════════════
-- FAVORITES
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS favorites (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  car_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_car FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
  UNIQUE KEY uq_favorites_user_car (user_id, car_id),
  INDEX idx_favorites_user (user_id)
) ENGINE=InnoDB;

-- ═══════════════════════════════════════════════
-- REVIEWS
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  car_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  title VARCHAR(200) NULL,
  content TEXT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_car FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
  UNIQUE KEY uq_reviews_user_car (user_id, car_id),
  INDEX idx_reviews_car (car_id),
  INDEX idx_reviews_approved (is_approved),
  CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB;

-- ═══════════════════════════════════════════════
-- ORDERS & PAYMENTS
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(30) NOT NULL UNIQUE,
  customer_id BIGINT UNSIGNED NOT NULL,
  car_id BIGINT UNSIGNED NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  deposit_amount DECIMAL(15,2) NULL DEFAULT 0,
  status ENUM('pending','deposit_paid','processing','completed','cancelled') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) NULL,
  customer_note TEXT NULL,
  staff_note TEXT NULL,
  handled_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_orders_car FOREIGN KEY (car_id) REFERENCES cars(id),
  CONSTRAINT fk_orders_handler FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(200) NULL,
  status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  paid_at DATETIME NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_payments_order (order_id),
  INDEX idx_payments_status (status)
) ENGINE=InnoDB;

-- ═══════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(60) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSON NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_read (is_read),
  INDEX idx_notifications_created_at (created_at)
) ENGINE=InnoDB;

-- ═══════════════════════════════════════════════
-- ACTIVITY LOG / AUDIT
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_activity_logs_user (user_id),
  INDEX idx_activity_logs_entity (entity_type, entity_id),
  INDEX idx_activity_logs_created_at (created_at)
) ENGINE=InnoDB;

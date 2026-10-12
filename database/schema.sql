-- ==========================================
-- CƠ SỞ DỮ LIỆU HOÀN CHỈNH CHO NAM-LIBRARY
-- Chỉ cần Copy toàn bộ script này chạy 1 lần duy nhất trên Neon
-- ==========================================

-- Bỏ ghi chú các dòng DROP dưới đây nếu bạn muốn xóa sạch dữ liệu cũ và tạo lại từ đầu
-- DROP TABLE IF EXISTS penalty_records CASCADE;
-- DROP TABLE IF EXISTS borrow_records CASCADE;
-- DROP TABLE IF EXISTS books CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS readers CASCADE;
-- DROP TABLE IF EXISTS app_settings CASCADE;
-- DROP TABLE IF EXISTS admin_users CASCADE;

-- 1. Bảng Quản trị viên / Thủ thư (Dùng để đăng nhập thay vì mã PIN cứng)
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- Sẽ lưu mã PIN hoặc Hash Mật khẩu
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'librarian',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Cài đặt hệ thống (Lưu các cấu hình ở mục Settings)
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Bạn đọc (Readers)
CREATE TABLE IF NOT EXISTS readers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE, -- Khóa tài khoản nếu vi phạm nhiều
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Thể loại sách (Categories)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

-- 5. Bảng Sách (Books)
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(150),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  isbn VARCHAR(20) UNIQUE,
  publisher VARCHAR(150),
  publish_year INTEGER,
  location VARCHAR(50),                 -- Vị trí trên giá sách (VD: Kệ A-Tầng 2)
  total_quantity INTEGER DEFAULT 1,     -- Tổng số sách có trong kho
  available_quantity INTEGER DEFAULT 1, -- Số sách còn sẵn sàng để mượn
  cover_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Mượn/Trả sách (Borrow Records)
CREATE TABLE IF NOT EXISTS borrow_records (
  id SERIAL PRIMARY KEY,
  reader_id INTEGER NOT NULL REFERENCES readers(id) ON DELETE RESTRICT,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP NOT NULL,          -- Ngày hẹn trả
  return_date TIMESTAMP,                -- Ngày trả thực tế (NULL nếu chưa trả)
  status VARCHAR(20) DEFAULT 'borrowing', -- 'borrowing' (đang mượn), 'returned' (đã trả), 'overdue' (quá hạn)
  notes TEXT
);

-- 7. Bảng Phạt vi phạm (Penalty Records - Dùng nếu làm hỏng/mất/trễ hạn)
CREATE TABLE IF NOT EXISTS penalty_records (
  id SERIAL PRIMARY KEY,
  borrow_id INTEGER REFERENCES borrow_records(id) ON DELETE CASCADE,
  reader_id INTEGER NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
  penalty_reason VARCHAR(255) NOT NULL, -- Lý do phạt: Quá hạn, Rách sách, Mất sách
  penalty_amount DECIMAL(10, 2) DEFAULT 0, -- Số tiền phạt
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- DỮ LIỆU KHỞI TẠO MẶC ĐỊNH (INITIAL DATA)
-- ==========================================

-- Tạo mật khẩu PIN mặc định là '5416' cho quản trị viên
INSERT INTO admin_users (username, password_hash, full_name) 
VALUES ('admin', '5416', 'Quản trị viên')
ON CONFLICT (username) DO NOTHING;

-- Khởi tạo các cấu hình hệ thống mặc định
INSERT INTO app_settings (setting_key, setting_value, description) VALUES
('library_name', 'Nam Library', 'Tên hiển thị của thư viện'),
('max_borrow_days', '14', 'Số ngày mượn sách tối đa cho mỗi lần'),
('max_books_per_reader', '3', 'Số sách tối đa 1 người được mượn cùng lúc'),
('late_fee_per_day', '5000', 'Số tiền phạt mỗi ngày trả muộn (VNĐ)')
ON CONFLICT (setting_key) DO NOTHING;

-- Tạo vài thể loại sách cơ bản
INSERT INTO categories (name) VALUES 
('Văn học - Tiểu thuyết'),
('Sách Chuyên ngành - Giáo trình'),
('Khoa học - Kỹ thuật'),
('Phát triển bản thân')
ON CONFLICT (name) DO NOTHING;

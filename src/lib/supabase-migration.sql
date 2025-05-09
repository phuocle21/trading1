-- Tạo bảng users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL,
  last_login BIGINT NOT NULL
);

-- Chèn dữ liệu admin mặc định
INSERT INTO users (id, email, password, is_admin, is_approved, created_at, last_login)
VALUES (
  'admin-uid',
  'mrtinanpha@gmail.com',
  'Tin@123',
  TRUE,
  TRUE,
  1746715404097,
  1746770829831
);
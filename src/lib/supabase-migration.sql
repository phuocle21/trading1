-- Cập nhật bảng trades để phù hợp với cấu trúc dữ liệu trong code
ALTER TABLE trades
  -- Loại bỏ các cột cũ nếu tồn tại
  DROP COLUMN IF EXISTS entry,
  DROP COLUMN IF EXISTS exit,
  DROP COLUMN IF EXISTS size,
  DROP COLUMN IF EXISTS profit,
  DROP COLUMN IF EXISTS date,
  DROP COLUMN IF EXISTS screenshot;
  
-- Thêm các cột mới
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS entry_date TEXT,
  ADD COLUMN IF NOT EXISTS entry_time TEXT,
  ADD COLUMN IF NOT EXISTS entry_price NUMERIC,
  ADD COLUMN IF NOT EXISTS exit_date TEXT,
  ADD COLUMN IF NOT EXISTS exit_time TEXT,
  ADD COLUMN IF NOT EXISTS exit_price NUMERIC,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS stop_loss NUMERIC,
  ADD COLUMN IF NOT EXISTS take_profit NUMERIC,
  ADD COLUMN IF NOT EXISTS fees NUMERIC,
  ADD COLUMN IF NOT EXISTS playbook TEXT,
  ADD COLUMN IF NOT EXISTS risk TEXT,
  ADD COLUMN IF NOT EXISTS mood TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC,
  ADD COLUMN IF NOT EXISTS screenshots JSONB DEFAULT '[]'::jsonb;

-- Đảm bảo screenshots có giá trị mặc định là mảng rỗng nếu chưa được đặt
UPDATE trades
SET screenshots = '[]'::jsonb
WHERE screenshots IS NULL;
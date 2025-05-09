-- Tạo bảng journals
CREATE TABLE IF NOT EXISTS journals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  trades JSONB
);

-- Tạo bảng trades
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL REFERENCES journals(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  symbol TEXT NOT NULL,
  type TEXT NOT NULL,
  entry NUMERIC,
  exit NUMERIC,
  size NUMERIC,
  profit NUMERIC,
  date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  screenshot TEXT,
  tags JSONB
);

-- Tạo bảng user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  current_journal_id TEXT,
  preferences JSONB,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tạo bảng playbooks
CREATE TABLE IF NOT EXISTS playbooks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  content JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tạo indexes để tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_journal_id ON trades(journal_id);
CREATE INDEX IF NOT EXISTS idx_playbooks_user_id ON playbooks(user_id);
-- 會員專區 D1 schema
-- 時間一律 INTEGER epoch ms（前端 new Date(ms)）

CREATE TABLE IF NOT EXISTS members (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,          -- 小寫正規化後存
  password_hash TEXT NOT NULL,                 -- PBKDF2 衍生 bits，base64
  salt          TEXT NOT NULL,                 -- 16 bytes，base64
  pbkdf2_iter   INTEGER NOT NULL DEFAULT 100000,
  display_name  TEXT,
  status        TEXT NOT NULL DEFAULT 'active', -- active / disabled
  created_at    INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE TABLE IF NOT EXISTS login_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id  INTEGER,                          -- 失敗（查無 email）時可為 NULL
  email      TEXT,                             -- 記下嘗試的 email（連 member_id NULL 也能追）
  logged_at  INTEGER NOT NULL,
  ip         TEXT,                             -- CF-Connecting-IP
  user_agent TEXT,
  outcome    TEXT NOT NULL                     -- success / fail
);
CREATE INDEX IF NOT EXISTS idx_login_member ON login_logs (member_id, logged_at);

CREATE TABLE IF NOT EXISTS read_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id  INTEGER NOT NULL,
  slug       TEXT NOT NULL,
  title      TEXT,
  read_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_read_member ON read_logs (member_id, read_at);
CREATE INDEX IF NOT EXISTS idx_read_slug   ON read_logs (slug, read_at);

-- 作品文：excerpt 公開吃 SEO（也會 build 進靜態頁），content_md 鎖起來登入才拿
CREATE TABLE IF NOT EXISTS member_posts (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  excerpt    TEXT NOT NULL,
  content_md TEXT NOT NULL,
  tags       TEXT,                             -- 逗號分隔
  cover      TEXT,                             -- 封面圖路徑（可選）
  published  INTEGER NOT NULL DEFAULT 1,       -- 1 / 0
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

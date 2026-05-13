-- RSVP 留言/到场反馈表
CREATE TABLE IF NOT EXISTS rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  attending TEXT NOT NULL CHECK(attending IN ('yes','no','maybe')),
  headcount INTEGER,
  need_lodging TEXT CHECK(need_lodging IN ('yes','no','self')),
  arrival_date TEXT CHECK(arrival_date IN ('0612','0613')),
  dietary TEXT,
  message TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at DESC);

-- 后台简单 session
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions(expires_at);

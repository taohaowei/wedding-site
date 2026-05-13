import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { DB } from './connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 增量列迁移：对老 DB（rsvps 已存在但缺新列）做自动 ALTER TABLE
 * 每条 try 包住，列已存在时静默忽略
 */
function applyIncrementalMigrations(db: DB): void {
  // arrival_date：用户预计到达日期（0612 晚到参加接亲 / 0613 当天到）
  try {
    db.exec("ALTER TABLE rsvps ADD COLUMN arrival_date TEXT");
  } catch {
    /* 列已存在 */
  }
}

/**
 * 执行 schema.sql，初始化表结构
 * 幂等：所有 CREATE 都带 IF NOT EXISTS；老 DB 走 applyIncrementalMigrations 补列
 */
export function migrate(db: DB): void {
  const schemaPath = resolve(__dirname, 'schema.sql');
  const sql = readFileSync(schemaPath, 'utf-8');
  db.exec(sql);
  applyIncrementalMigrations(db);
}

/**
 * 内联 schema（兜底，避免某些打包/部署场景找不到 schema.sql 文件）
 * 与 schema.sql 内容必须保持一致
 */
export const INLINE_SCHEMA = `
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

CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions(expires_at);
`;

export function migrateInline(db: DB): void {
  db.exec(INLINE_SCHEMA);
  applyIncrementalMigrations(db);
}

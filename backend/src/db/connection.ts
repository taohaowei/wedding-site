import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export type DB = Database.Database;

let _db: DB | null = null;

/**
 * 初始化数据库连接（单例）
 * - 路径来自环境变量 DB_PATH，默认 ./data/wedding.db
 * - 测试时可以传 ':memory:' 创建独立 in-memory DB
 * - 启用 WAL 模式提升并发读写性能
 */
export function getDB(path?: string): DB {
  if (_db) return _db;

  const dbPath = path ?? process.env.DB_PATH ?? './data/wedding.db';

  // 确保目录存在（in-memory 跳过）
  if (dbPath !== ':memory:' && !existsSync(dirname(dbPath))) {
    mkdirSync(dirname(dbPath), { recursive: true });
  }

  _db = new Database(dbPath);

  // WAL 模式 + 推荐的 pragma
  // 注意：in-memory DB 不支持 WAL（会被 SQLite 静默忽略，无副作用）
  if (dbPath !== ':memory:') {
    _db.pragma('journal_mode = WAL');
  }
  _db.pragma('foreign_keys = ON');
  _db.pragma('synchronous = NORMAL');

  return _db;
}

/**
 * 重置单例（仅供测试使用）
 */
export function resetDB(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

/**
 * 关闭连接（进程退出时调用）
 */
export function closeDB(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import health from './routes/health.js';
import rsvp from './routes/rsvp.js';
import admin from './routes/admin.js';
import { createCors } from './middleware/cors.js';
import { getDB } from './db/connection.js';
import { migrateInline } from './db/migrate.js';

/**
 * 创建 Hono App（不监听端口，方便测试用 app.request 直接调用）
 */
export function createApp(): Hono {
  const app = new Hono();

  // 全局中间件
  if (process.env.NODE_ENV !== 'test') {
    app.use('*', logger());
  }
  app.use('*', createCors());

  // 业务路由
  app.route('/api/health', health);
  app.route('/api/rsvp', rsvp);
  app.route('/api/admin', admin);

  // 全局错误 handler
  app.onError((err, c) => {
    console.error('[server error]', err);
    return c.json({ ok: false, error: 'server_error' }, 500);
  });

  app.notFound((c) => {
    return c.json({ ok: false, error: 'not_found' }, 404);
  });

  return app;
}

/**
 * 直接执行此文件时，初始化 DB + 启动 HTTP 服务
 */
export async function main(): Promise<void> {
  const port = Number(process.env.PORT ?? 3001);
  const hostname = process.env.HOST ?? '127.0.0.1';

  const db = getDB();
  migrateInline(db);

  const app = createApp();

  serve({
    fetch: app.fetch,
    port,
    hostname,
  });

  console.log(`[wedding-backend] listening on http://${hostname}:${port}`);
  console.log(`[wedding-backend] db: ${process.env.DB_PATH ?? './data/wedding.db'}`);
  console.log(`[wedding-backend] env: ${process.env.NODE_ENV ?? 'development'}`);
}

// ESM 入口判断：被 tsx/node 直接执行时启动；被 import 时不启动
// 兼容 PM2 fork（argv[1] 是 PM2 的 ProcessContainerFork.js）、符号链接、
// 不同绝对路径写法等场景。
const isDirectRun = (() => {
  // 显式兜底
  if (process.env.WEDDING_FORCE_START === '1') return true;
  // 测试环境（vitest 会把 createApp 当模块导入）一律不启动
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) return false;
  // PM2 fork：argv[1] 不指向本文件，但 pm_id 一定存在，认为是被 PM2 直接拉起
  if (process.env.pm_id !== undefined || process.env.PM2_USAGE) return true;
  // 普通 node / tsx 直接执行
  try {
    const entry = process.argv[1];
    if (!entry) return false;
    const meFromUrl = new URL(import.meta.url).pathname;
    return (
      entry === meFromUrl ||
      entry.endsWith('/server.js') ||
      entry.endsWith('/server.ts') ||
      meFromUrl.endsWith(entry)
    );
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  main().catch((err) => {
    console.error('[wedding-backend] fatal:', err);
    process.exit(1);
  });
}

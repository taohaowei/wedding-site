import { Hono } from 'hono';
import { resetDB, getDB } from '../src/db/connection.js';
import { migrateInline } from '../src/db/migrate.js';
import { _resetRateLimitBuckets } from '../src/middleware/rateLimit.js';
import { createApp } from '../src/server.js';

/**
 * 测试用：创建一个全新的 in-memory DB + Hono app
 * 每个 describe.beforeEach 调用一次，保证测试隔离
 */
export function setupApp(): { app: Hono } {
  // 重置全局单例
  resetDB();
  _resetRateLimitBuckets();

  // 重新建立 in-memory DB 单例
  const db = getDB(':memory:');
  migrateInline(db);

  const app = createApp();
  return { app };
}

/**
 * 测试用：清理（每个 afterEach）
 */
export function teardownApp(): void {
  resetDB();
  _resetRateLimitBuckets();
}

/**
 * 简便方法：用 fetch 风格调 Hono app
 */
export async function jsonRequest(
  app: Hono,
  path: string,
  init: RequestInit & { ip?: string } = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (init.ip) {
    headers.set('X-Test-Ip', init.ip);
  }
  return app.request(path, { ...init, headers });
}

/**
 * 简单 Cookie 解析：Set-Cookie → 取出指定 cookie 的 value
 */
export function getSetCookie(res: Response, name: string): string | null {
  // Hono node-server 场景下 set-cookie 可能是单个 header；用 getSetCookie() 兼容
  const headers: string[] = [];
  if (typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function') {
    headers.push(...(res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie());
  } else {
    const single = res.headers.get('set-cookie');
    if (single) headers.push(single);
  }

  for (const h of headers) {
    const m = h.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    if (m) return m[1] ?? null;
  }
  return null;
}

/**
 * 把 cookie 名值对拼成 Cookie header
 */
export function cookieHeader(pairs: Record<string, string>): string {
  return Object.entries(pairs)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { getDB } from '../db/connection.js';

/**
 * 后台鉴权中间件
 * - 读 cookie admin_session
 * - 查 admin_sessions 表，校验 token 是否存在且未过期
 * - 校验失败返回 401
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, 'admin_session');
  if (!token) {
    return c.json({ ok: false, error: '未登录' }, 401);
  }

  const db = getDB();
  const row = db
    .prepare('SELECT token, expires_at FROM admin_sessions WHERE token = ?')
    .get(token) as { token: string; expires_at: number } | undefined;

  if (!row) {
    return c.json({ ok: false, error: '会话无效' }, 401);
  }

  if (row.expires_at <= Date.now()) {
    // 顺带清掉过期 session
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
    return c.json({ ok: false, error: '会话已过期' }, 401);
  }

  await next();
};

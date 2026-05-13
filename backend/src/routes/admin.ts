import { Hono } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { z } from 'zod';
import { getDB } from '../db/connection.js';
import { generateToken } from '../utils/token.js';
import { authMiddleware } from '../middleware/auth.js';
import { rsvpsToCSV, csvFilename } from '../utils/csv.js';
import type { RSVPRecord } from '../schemas/rsvp.js';

const admin = new Hono();

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

const loginSchema = z.object({
  password: z.string({ required_error: '请输入密码' }).min(1, '密码不能为空'),
});

/**
 * POST /api/admin/login
 * 校验密码，正确则签发 session token + cookie
 */
admin.post('/login', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: '请求体不是合法 JSON' }, 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: '密码不能为空' }, 400);
  }

  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
  if (parsed.data.password !== adminPassword) {
    return c.json({ ok: false, error: '密码错误' }, 401);
  }

  const token = generateToken();
  const expiresAt = Date.now() + SESSION_TTL_MS;

  const db = getDB();
  db.prepare('INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)').run(token, expiresAt);

  // Secure 标志只在真实 HTTPS 下启用，避免在 HTTP 后台下登录失败
  const xfProto = c.req.header('x-forwarded-proto');
  const isHttps = xfProto === 'https' || c.req.url.startsWith('https://');

  setCookie(c, 'admin_session', token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    secure: isHttps,
  });

  return c.json({ ok: true });
});

/**
 * POST /api/admin/logout
 * 删 session + 清 cookie
 */
admin.post('/logout', async (c) => {
  const token = getCookie(c, 'admin_session');
  if (token) {
    const db = getDB();
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
  }
  deleteCookie(c, 'admin_session', { path: '/' });
  return c.json({ ok: true });
});

/**
 * GET /api/admin/rsvps
 * 受保护：列出所有 RSVP（按 created_at DESC）
 */
admin.get('/rsvps', authMiddleware, (c) => {
  const db = getDB();
  const rows = db
    .prepare(
      `SELECT id, name, attending, headcount, need_lodging, arrival_date, dietary, message, ip, user_agent, created_at
       FROM rsvps ORDER BY created_at DESC`
    )
    .all() as RSVPRecord[];
  return c.json({ ok: true, data: rows });
});

/**
 * GET /api/admin/export.csv
 * 受保护：导出全部 RSVP 为 CSV（UTF-8 with BOM）
 */
admin.get('/export.csv', authMiddleware, (c) => {
  const db = getDB();
  const rows = db
    .prepare(
      `SELECT id, name, attending, headcount, need_lodging, arrival_date, dietary, message, ip, user_agent, created_at
       FROM rsvps ORDER BY created_at DESC`
    )
    .all() as RSVPRecord[];

  const csv = rsvpsToCSV(rows);
  const filename = csvFilename();

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="${filename}"`);
  return c.body(csv);
});

export default admin;

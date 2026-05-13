import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupApp, teardownApp, jsonRequest, getSetCookie, cookieHeader } from './helpers.js';
import { getDB } from '../src/db/connection.js';
import type { Hono } from 'hono';

describe('Admin endpoints', () => {
  let app: Hono;
  const PASSWORD = 'admin123'; // 与 .env.example 默认一致

  beforeEach(() => {
    process.env.ADMIN_PASSWORD = PASSWORD;
    ({ app } = setupApp());
  });

  afterEach(() => {
    teardownApp();
  });

  // 断言 7：无 cookie → GET /api/admin/rsvps → 401
  it('7. 无 cookie 访问 /api/admin/rsvps → 401', async () => {
    const res = await jsonRequest(app, '/api/admin/rsvps', { method: 'GET' });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(false);
  });

  // 断言 8：错误密码 → POST /api/admin/login → 401
  it('8. 错误密码登录 → 401', async () => {
    const res = await jsonRequest(app, '/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong-password' }),
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/密码/);
  });

  // 断言 9：正确密码 → POST /api/admin/login → 200 + Set-Cookie
  it('9. 正确密码登录 → 200 + Set-Cookie', async () => {
    const res = await jsonRequest(app, '/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: PASSWORD }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie!.toLowerCase()).toContain('admin_session=');
    expect(setCookie!.toLowerCase()).toContain('httponly');
    expect(setCookie!.toLowerCase()).toContain('samesite=lax');
    expect(setCookie!.toLowerCase()).toContain('path=/');

    const token = getSetCookie(res, 'admin_session');
    expect(token).toBeTruthy();
    // session 应该写入 DB
    const row = getDB()
      .prepare('SELECT token FROM admin_sessions WHERE token = ?')
      .get(token) as { token: string } | undefined;
    expect(row?.token).toBe(token);
  });

  // 断言 10：合法 cookie → GET /api/admin/rsvps → 200 + 列表
  it('10. 合法 cookie 访问 /api/admin/rsvps → 200 + 数据', async () => {
    // 先登录拿 cookie
    const login = await jsonRequest(app, '/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: PASSWORD }),
    });
    const token = getSetCookie(login, 'admin_session');
    expect(token).toBeTruthy();

    // 提交一条 RSVP（直接写 DB，避开限流和并发问题）
    getDB()
      .prepare(
        `INSERT INTO rsvps (name, attending, headcount, need_lodging, dietary, message, ip, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run('测试用户', 'yes', 2, 'yes', '', '祝福', '127.0.0.1', 'test-ua', Date.now());

    const res = await jsonRequest(app, '/api/admin/rsvps', {
      method: 'GET',
      headers: { Cookie: cookieHeader({ admin_session: token! }) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: Array<{ name: string; attending: string; headcount: number }>;
    };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.data[0]!.name).toBe('测试用户');
    expect(body.data[0]!.attending).toBe('yes');
    expect(body.data[0]!.headcount).toBe(2);
  });

  // 断言 11：合法 cookie → GET /api/admin/export.csv → 200 + 正确 CSV(检查 BOM 和列头)
  it('11. 合法 cookie 导出 CSV → 200 + BOM + 列头正确', async () => {
    const login = await jsonRequest(app, '/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: PASSWORD }),
    });
    const token = getSetCookie(login, 'admin_session');

    // 插一条记录
    getDB()
      .prepare(
        `INSERT INTO rsvps (name, attending, headcount, need_lodging, dietary, message, ip, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run('CSV测试', 'yes', 3, 'self', '海鲜过敏', '提前祝贺', '1.2.3.4', 'curl', Date.now());

    const res = await jsonRequest(app, '/api/admin/export.csv', {
      method: 'GET',
      headers: { Cookie: cookieHeader({ admin_session: token! }) },
    });
    expect(res.status).toBe(200);

    const ct = res.headers.get('content-type');
    expect(ct).toMatch(/text\/csv/);
    expect(ct).toMatch(/charset=utf-8/);

    const cd = res.headers.get('content-disposition');
    expect(cd).toMatch(/attachment/);
    expect(cd).toMatch(/wedding-rsvps-\d{8}\.csv/);

    const buf = new Uint8Array(await res.arrayBuffer());
    // BOM 检查：UTF-8 的 BOM 是 EF BB BF
    expect(buf[0]).toBe(0xef);
    expect(buf[1]).toBe(0xbb);
    expect(buf[2]).toBe(0xbf);

    const text = new TextDecoder('utf-8').decode(buf);
    // 列头
    expect(text).toContain('id');
    expect(text).toContain('姓名');
    expect(text).toContain('是否到场');
    expect(text).toContain('人数');
    expect(text).toContain('是否住宿');
    expect(text).toContain('预计到达');
    expect(text).toContain('忌口');
    expect(text).toContain('留言');
    expect(text).toContain('提交时间');
    expect(text).toContain('IP');
    // 数据行
    expect(text).toContain('CSV测试');
    expect(text).toContain('到场');
    expect(text).toContain('海鲜过敏');
  });

  // 断言 12：过期 cookie → GET /api/admin/rsvps → 401
  it('12. 过期 cookie 访问 → 401', async () => {
    // 直接在 DB 写一条已过期 session
    const expiredToken = 'expired-token-1234567890abcdef';
    getDB()
      .prepare('INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)')
      .run(expiredToken, Date.now() - 1000);

    const res = await jsonRequest(app, '/api/admin/rsvps', {
      method: 'GET',
      headers: { Cookie: cookieHeader({ admin_session: expiredToken }) },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/过期|失效|无效/);

    // 顺带验证：过期 session 应被自动清掉
    const row = getDB()
      .prepare('SELECT * FROM admin_sessions WHERE token = ?')
      .get(expiredToken);
    expect(row).toBeUndefined();
  });

  // 断言 13：HTTP 请求登录 → Set-Cookie 不带 Secure 标志
  it('13. HTTP 登录 → Set-Cookie 不带 Secure', async () => {
    const res = await app.request('http://example.com/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: PASSWORD }),
    });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    // 关键断言：HTTP 下不应该带 Secure
    expect(setCookie!.toLowerCase()).not.toContain('secure');
    // 其他属性仍要保留
    expect(setCookie!.toLowerCase()).toContain('httponly');
    expect(setCookie!.toLowerCase()).toContain('samesite=lax');
    expect(setCookie!.toLowerCase()).toContain('path=/');
  });

  // 断言 14：HTTPS 请求(x-forwarded-proto=https) 登录 → Set-Cookie 带 Secure 标志
  it('14. HTTPS 登录 → Set-Cookie 带 Secure', async () => {
    const res = await app.request('http://example.com/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-proto': 'https',
      },
      body: JSON.stringify({ password: PASSWORD }),
    });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie!.toLowerCase()).toContain('secure');
  });
});

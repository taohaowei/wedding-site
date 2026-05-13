import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupApp, teardownApp, jsonRequest } from './helpers.js';
import { getDB } from '../src/db/connection.js';
import type { Hono } from 'hono';

describe('POST /api/rsvp', () => {
  let app: Hono;

  beforeEach(() => {
    ({ app } = setupApp());
  });

  afterEach(() => {
    teardownApp();
  });

  // 断言 1：合法表单 → 200 + DB 有记录 + 返回 id
  it('1. 合法表单提交成功，入库并返回 id', async () => {
    const res = await jsonRequest(app, '/api/rsvp', {
      method: 'POST',
      body: JSON.stringify({
        name: '张三',
        attending: 'yes',
        headcount: 2,
        need_lodging: 'yes',
        dietary: '不吃辣',
        message: '祝你们幸福',
      }),
      ip: '10.0.0.1',
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; id: number };
    expect(body.ok).toBe(true);
    expect(typeof body.id).toBe('number');
    expect(body.id).toBeGreaterThan(0);

    const row = getDB().prepare('SELECT * FROM rsvps WHERE id = ?').get(body.id) as {
      name: string;
      attending: string;
      headcount: number;
    };
    expect(row.name).toBe('张三');
    expect(row.attending).toBe('yes');
    expect(row.headcount).toBe(2);
  });

  // 断言 2：name 为空 → 400
  it('2. name 为空 → 400，不入库', async () => {
    const res = await jsonRequest(app, '/api/rsvp', {
      method: 'POST',
      body: JSON.stringify({
        name: '',
        attending: 'yes',
        headcount: 1,
      }),
      ip: '10.0.0.2',
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBeTruthy();

    const count = getDB().prepare('SELECT COUNT(*) as c FROM rsvps').get() as { c: number };
    expect(count.c).toBe(0);
  });

  // 断言 3：attending=yes 但 headcount 缺失 → 400
  it('3. attending=yes 缺 headcount → 400', async () => {
    const res = await jsonRequest(app, '/api/rsvp', {
      method: 'POST',
      body: JSON.stringify({
        name: '李四',
        attending: 'yes',
      }),
      ip: '10.0.0.3',
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/人数/);
  });

  // 断言 4：attending=no → 200(headcount/lodging 可空)
  it('4. attending=no 时 headcount/lodging 可空 → 200', async () => {
    const res = await jsonRequest(app, '/api/rsvp', {
      method: 'POST',
      body: JSON.stringify({
        name: '王五',
        attending: 'no',
      }),
      ip: '10.0.0.4',
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; id: number };
    expect(body.ok).toBe(true);

    const row = getDB().prepare('SELECT * FROM rsvps WHERE id = ?').get(body.id) as {
      attending: string;
      headcount: number | null;
      need_lodging: string | null;
    };
    expect(row.attending).toBe('no');
    expect(row.headcount).toBeNull();
    expect(row.need_lodging).toBeNull();
  });

  // 断言 5：message 超 200 字符 → 400
  it('5. message 超 200 字符 → 400', async () => {
    const longMsg = 'a'.repeat(201);
    const res = await jsonRequest(app, '/api/rsvp', {
      method: 'POST',
      body: JSON.stringify({
        name: '赵六',
        attending: 'maybe',
        message: longMsg,
      }),
      ip: '10.0.0.5',
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/留言/);
  });

  // 断言 6：同一 IP 5 秒内 6 次 → 第 6 次 429
  it('6. 同一 IP 5 秒内 6 次 → 第 6 次 429', async () => {
    const ip = '10.0.0.6';
    const post = () =>
      jsonRequest(app, '/api/rsvp', {
        method: 'POST',
        body: JSON.stringify({ name: '频繁请求者', attending: 'no' }),
        ip,
      });

    // 前 5 次成功
    for (let i = 0; i < 5; i++) {
      const r = await post();
      expect(r.status).toBe(200);
    }

    // 第 6 次必须 429
    const r6 = await post();
    expect(r6.status).toBe(429);
    const body = (await r6.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/频繁/);
  });

  // 断言 7：attending=yes + arrival_date='0612' → 200 + 入库 + 列表能查到
  it("7. attending=yes + arrival_date='0612' → 入库成功 + 列表能查到", async () => {
    const res = await jsonRequest(app, '/api/rsvp', {
      method: 'POST',
      body: JSON.stringify({
        name: '到达日期测试',
        attending: 'yes',
        headcount: 2,
        need_lodging: 'no',
        arrival_date: '0612',
        message: '提前一天到',
      }),
      ip: '10.0.0.7',
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; id: number };
    expect(body.ok).toBe(true);
    expect(body.id).toBeGreaterThan(0);

    // DB 直接查
    const row = getDB()
      .prepare('SELECT * FROM rsvps WHERE id = ?')
      .get(body.id) as { name: string; arrival_date: string; attending: string };
    expect(row.name).toBe('到达日期测试');
    expect(row.arrival_date).toBe('0612');
    expect(row.attending).toBe('yes');

    // 列表查询能拿到
    const list = getDB()
      .prepare('SELECT id, name, arrival_date FROM rsvps ORDER BY created_at DESC')
      .all() as Array<{ id: number; name: string; arrival_date: string }>;
    const found = list.find((r) => r.id === body.id);
    expect(found).toBeTruthy();
    expect(found!.arrival_date).toBe('0612');
  });
});

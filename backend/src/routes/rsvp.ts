import { Hono } from 'hono';
import { getDB } from '../db/connection.js';
import { rsvpSchema, formatZodError } from '../schemas/rsvp.js';
import { createRateLimit, getClientIp } from '../middleware/rateLimit.js';

const rsvp = new Hono();

// 同一 IP 5 秒内最多 5 次
rsvp.use('/', createRateLimit({ windowMs: 5000, max: 5 }));

rsvp.post('/', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: '请求体不是合法 JSON' }, 400);
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: formatZodError(parsed.error) }, 400);
  }

  const data = parsed.data;
  const ip = getClientIp(c);
  const ua = c.req.header('user-agent') ?? null;

  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO rsvps (name, attending, headcount, need_lodging, arrival_date, dietary, message, ip, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.attending,
    data.headcount ?? null,
    data.need_lodging ?? null,
    data.arrival_date ?? null,
    data.dietary ?? null,
    data.message ?? null,
    ip,
    ua,
    Date.now()
  );

  return c.json({ ok: true, id: Number(result.lastInsertRowid) });
});

export default rsvp;

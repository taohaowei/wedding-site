import type { MiddlewareHandler } from 'hono';

/**
 * In-memory IP 限流（同一 IP 5 秒内最多 5 次）
 *
 * 设计说明：
 * - 简单粗暴，单进程内存即可。多实例部署时会失效，但本项目用 PM2 单实例 cluster 不开。
 * - 滑动窗口：保留窗口内的时间戳数组，超限就 429
 * - 自动清理：每次请求顺带删过期项
 */

interface RateLimitOptions {
  windowMs: number; // 窗口时长，毫秒
  max: number; // 窗口内最大次数
}

const buckets = new Map<string, number[]>();

export function createRateLimit(opts: RateLimitOptions): MiddlewareHandler {
  const { windowMs, max } = opts;

  return async (c, next) => {
    const ip = getClientIp(c);
    const now = Date.now();

    let timestamps = buckets.get(ip) ?? [];
    // 过滤掉窗口外的旧记录
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= max) {
      buckets.set(ip, timestamps);
      return c.json({ ok: false, error: '请求过于频繁，请稍后再试' }, 429);
    }

    timestamps.push(now);
    buckets.set(ip, timestamps);

    await next();
  };
}

/**
 * 提取真实 client IP
 * - X-Forwarded-For 第一段（Nginx 反代场景）
 * - X-Real-IP
 * - fallback 用 c.env 里的 remoteAddr / unknown
 */
export function getClientIp(c: import('hono').Context): string {
  const xff = c.req.header('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0]!.trim();
  }
  const xri = c.req.header('x-real-ip');
  if (xri) return xri.trim();

  // 测试用：vitest 注入的自定义 header
  const testIp = c.req.header('x-test-ip');
  if (testIp) return testIp.trim();

  // node-server 场景下，Hono 在 c.env 暴露 incoming socket
  // 尝试从 env.incoming.socket.remoteAddress 取
  try {
    const env = c.env as { incoming?: { socket?: { remoteAddress?: string } } } | undefined;
    const ra = env?.incoming?.socket?.remoteAddress;
    if (ra) return ra;
  } catch {
    // ignore
  }
  return 'unknown';
}

/**
 * 测试用：清空所有限流桶
 */
export function _resetRateLimitBuckets(): void {
  buckets.clear();
}

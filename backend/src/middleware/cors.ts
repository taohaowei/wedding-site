import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';

/**
 * CORS 中间件
 * - 开发环境：允许 *
 * - 生产环境：只允许你的域名（使用前请修改 allowed 数组）
 *
 * 注：因为前端会带 cookie 调用后台接口（/api/admin/*），
 *     当 origin 是具体域名时必须加 credentials: true，
 *     而 '*' + credentials 浏览器会拒。所以开发用 reflect 模式（自动回 origin）。
 */
export function createCors(): MiddlewareHandler {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    return cors({
      origin: (origin) => {
        if (!origin) return null;
        const allowed = ['https://example.com', 'https://www.example.com'];
        return allowed.includes(origin) ? origin : null;
      },
      credentials: true,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Cookie'],
    });
  }

  // 开发环境：reflect origin，支持 credentials
  return cors({
    origin: (origin) => origin ?? '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Cookie', 'X-Test-Ip'],
  });
}

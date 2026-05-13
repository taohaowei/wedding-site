import { randomBytes } from 'node:crypto';

/**
 * 生成 32 字符的随机 token（hex 编码，16 字节熵）
 * 用于 admin_session cookie
 */
export function generateToken(): string {
  return randomBytes(16).toString('hex');
}

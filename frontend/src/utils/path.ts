/**
 * 根据 Vite 的 base 配置为资源路径添加前缀
 * 解决 GitHub Pages 子路径部署时资源 404 的问题
 */
export function p(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  // 去掉尾部的 /，避免双斜杠
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
  return `${cleanBase}${path}`
}

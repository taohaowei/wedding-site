import axios, { AxiosError } from 'axios'

// API base 默认 /api,允许通过 VITE_API_BASE 覆盖(联调时切换)
const baseURL = import.meta.env.VITE_API_BASE ?? '/api'

export const http = axios.create({
  baseURL,
  timeout: 12000,
  withCredentials: true, // 带 cookie,后台 admin_session 必须
  headers: { 'Content-Type': 'application/json' }
})

// 检测是否处于"无后端 mock"模式 — 由 healthcheck 失败后置位
let mockMode = false
export const isMock = () => mockMode

http.interceptors.response.use(
  (resp) => resp,
  (err: AxiosError) => {
    // 网络错误 / 5xx,默默降级,UI 自决
    if (!err.response) {
      console.warn('[api] network error', err.message)
    }
    return Promise.reject(err)
  }
)

// 探活,失败则进入 mock 模式
export async function probeBackend(): Promise<boolean> {
  try {
    const r = await http.get('/health', { timeout: 2000 })
    mockMode = !(r.data && r.data.ok)
    return !mockMode
  } catch {
    mockMode = true
    return false
  }
}

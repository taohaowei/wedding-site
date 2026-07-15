import { http, isMock } from './client'
import type { ApiResp, RsvpRecord } from './types'

export async function adminLogin(password: string): Promise<ApiResp> {
  if (isMock()) {
    if (password === '123' || password === 'demo' || password === '123456') { mockLogged = true; return { ok: true } }
    return { ok: false, error: '密码错误(演示模式 - 可用 123)' }
  }
  try {
    const r = await http.post('/admin/login', { password })
    return r.data
  } catch (e: any) {
    const msg = e?.response?.data?.error || (e?.response?.status === 401 ? '密码错误' : '登录失败')
    return { ok: false, error: msg }
  }
}

export async function adminLogout(): Promise<ApiResp> {
  if (isMock()) { mockLogged = false; return { ok: true } }
  try {
    const r = await http.post('/admin/logout')
    return r.data
  } catch {
    return { ok: false, error: '退出失败' }
  }
}

const mockRecords: RsvpRecord[] = [
  {
    id: 1, name: '张大哥', attending: 'yes', headcount: 2, need_lodging: 'yes', arrival_date: '0612',
    dietary: '不吃辣', message: '祝你们新婚快乐~', created_at: '2026-05-12T08:01:23Z'
  },
  {
    id: 2, name: '王同学', attending: 'maybe', headcount: null, need_lodging: null, arrival_date: null,
    dietary: null, message: '如果可以一定到!', created_at: '2026-05-13T09:42:11Z'
  },
  {
    id: 3, name: '李姐', attending: 'no', headcount: null, need_lodging: null, arrival_date: null,
    dietary: null, message: '当天有事,改日补礼!', created_at: '2026-05-14T15:20:00Z'
  }
]

// mock 登录态(只在无后端时使用),刷新即清空 — 强制走一次登录
let mockLogged = false
export function _mockSetLogged(v: boolean) { mockLogged = v }

export async function getRsvps(): Promise<ApiResp<RsvpRecord[]>> {
  if (isMock()) {
    if (!mockLogged) return { ok: false, error: '未登录', code: 'UNAUTHORIZED' }
    return { ok: true, data: mockRecords }
  }
  try {
    const r = await http.get('/admin/rsvps')
    // 后端契约 {ok:true, data: RsvpRecord[]}
    return r.data
  } catch (e: any) {
    if (e?.response?.status === 401) return { ok: false, error: '未登录', code: 'UNAUTHORIZED' }
    return { ok: false, error: e?.message || '加载失败' }
  }
}

export function getExportUrl(): string {
  // 直接给浏览器下载 URL,带 cookie
  const base = (import.meta.env.VITE_API_BASE ?? '/api').replace(/\/$/, '')
  return `${base}/admin/export.csv`
}

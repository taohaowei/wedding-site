import { http, isMock } from './client'
import type { ApiResp, RsvpFormState, RsvpPayload } from './types'

// 把表单里的相机字段拼成后端契约 payload
export function toPayload(form: RsvpFormState): RsvpPayload {
  const p: RsvpPayload = {
    name: form.name.trim(),
    attending: (form.attending || 'maybe') as RsvpPayload['attending']
  }
  if (form.attending === 'yes') {
    if (form.headcount !== undefined) p.headcount = form.headcount
    if (form.needLodging) p.need_lodging = form.needLodging
    if (form.arrivalDate) p.arrival_date = form.arrivalDate
  }
  if (form.dietary?.trim()) p.dietary = form.dietary.trim()
  if (form.message?.trim()) p.message = form.message.trim()
  return p
}

export async function postRsvp(form: RsvpFormState): Promise<ApiResp<{ id: number }>> {
  const payload = toPayload(form)
  if (isMock()) {
    console.log('[mock postRsvp]', payload)
    await new Promise((r) => setTimeout(r, 600))
    return { ok: true, id: Math.floor(Math.random() * 9999) }
  }
  try {
    const r = await http.post('/rsvp', payload)
    return r.data
  } catch (e: any) {
    const status = e?.response?.status
    const msg = e?.response?.data?.error || e?.message || '提交失败'
    if (status === 429) return { ok: false, error: '提交太频繁,请稍后再试', code: 'RATE_LIMIT' }
    return { ok: false, error: msg }
  }
}

// 与后端共享的类型契约,严格遵循 docs/赴约-架构方案.md 第 5.1 节 + 任务拆解 2.1

export type Attending = 'yes' | 'no' | 'maybe'
export type LodgingChoice = 'yes' | 'no' | 'self'
export type ArrivalDate = '0612' | '0613'

export interface RsvpFormState {
  name: string
  attending: Attending | ''
  headcount?: number
  needLodging?: LodgingChoice
  arrivalDate?: ArrivalDate
  dietary?: string
  message?: string
}

export interface RsvpPayload {
  name: string
  attending: Attending
  headcount?: number
  need_lodging?: LodgingChoice
  arrival_date?: ArrivalDate
  dietary?: string
  message?: string
}

export interface RsvpRecord {
  id: number
  name: string
  attending: Attending
  headcount: number | null
  need_lodging: LodgingChoice | null
  arrival_date: ArrivalDate | null
  dietary: string | null
  message: string | null
  created_at: string
  ip?: string
  user_agent?: string
}

export interface ApiOk<T = unknown> {
  ok: true
  data?: T
  id?: number
}

export interface ApiErr {
  ok: false
  error: string
  code?: string
}

export type ApiResp<T = unknown> = ApiOk<T> | ApiErr

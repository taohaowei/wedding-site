import { z } from 'zod';

/**
 * RSVP 表单 zod schema
 *
 * 校验规则（与前端约定一致）：
 * - name: 1-32 字符，必填
 * - attending: 必填枚举 yes/no/maybe
 * - headcount: 1-20 整数；当 attending='yes' 时必填，其他情况可选
 * - need_lodging: yes/no/self，可选
 * - dietary / message: ≤ 200 字符，可选
 *
 * 错误信息全部用中文
 */
export const rsvpSchema = z
  .object({
    name: z
      .string({ required_error: '请填写姓名' })
      .trim()
      .min(1, '姓名不能为空')
      .max(32, '姓名不能超过 32 个字符'),
    attending: z.enum(['yes', 'no', 'maybe'], {
      required_error: '请选择是否到场',
      invalid_type_error: '是否到场只能是 yes/no/maybe',
    }),
    headcount: z
      .number({ invalid_type_error: '人数必须是数字' })
      .int('人数必须是整数')
      .min(1, '人数至少 1 人')
      .max(20, '人数最多 20 人')
      .optional(),
    need_lodging: z
      .enum(['yes', 'no', 'self'], {
        invalid_type_error: '住宿选项只能是 yes/no/self',
      })
      .optional(),
    arrival_date: z
      .enum(['0612', '0613'], {
        invalid_type_error: '到达日期只能是 0612 或 0613',
      })
      .optional(),
    dietary: z
      .string()
      .max(200, '忌口说明不能超过 200 字符')
      .optional(),
    message: z
      .string()
      .max(200, '留言不能超过 200 字符')
      .optional(),
  })
  .superRefine((val, ctx) => {
    // 业务规则：到场时必须填人数
    if (val.attending === 'yes' && (val.headcount === undefined || val.headcount === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['headcount'],
        message: '确认到场时请填写人数',
      });
    }
  });

export type RSVPInput = z.infer<typeof rsvpSchema>;

/**
 * 数据库行类型
 */
export interface RSVPRecord {
  id: number;
  name: string;
  attending: 'yes' | 'no' | 'maybe';
  headcount: number | null;
  need_lodging: 'yes' | 'no' | 'self' | null;
  arrival_date: '0612' | '0613' | null;
  dietary: string | null;
  message: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: number;
}

/**
 * 把 zod 校验错误转成单条中文消息
 */
export function formatZodError(err: z.ZodError): string {
  const first = err.errors[0];
  return first?.message ?? '参数错误';
}

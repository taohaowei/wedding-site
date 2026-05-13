import type { RSVPRecord } from '../schemas/rsvp.js';

/**
 * RSVP 数据导出为 CSV
 * - UTF-8 with BOM（让 Excel 正确识别中文）
 * - 列：id, 姓名, 是否到场, 人数, 是否住宿, 预计到达, 忌口, 留言, 提交时间, IP
 */
export function rsvpsToCSV(rows: RSVPRecord[]): string {
  const BOM = '﻿';
  const header = ['id', '姓名', '是否到场', '人数', '是否住宿', '预计到达', '忌口', '留言', '提交时间', 'IP'];

  const attendingMap: Record<string, string> = {
    yes: '到场',
    no: '不到场',
    maybe: '待定',
  };
  const lodgingMap: Record<string, string> = {
    yes: '需要',
    no: '不需要',
    self: '自理',
  };
  const arrivalMap: Record<string, string> = {
    '0612': '6.12 晚到',
    '0613': '6.13 当天到',
  };

  const lines: string[] = [header.map(csvEscape).join(',')];

  for (const r of rows) {
    const row = [
      String(r.id),
      r.name ?? '',
      attendingMap[r.attending] ?? r.attending,
      r.headcount != null ? String(r.headcount) : '',
      r.need_lodging ? lodgingMap[r.need_lodging] ?? r.need_lodging : '',
      r.arrival_date ? arrivalMap[r.arrival_date] ?? r.arrival_date : '',
      r.dietary ?? '',
      r.message ?? '',
      formatTimestamp(r.created_at),
      r.ip ?? '',
    ];
    lines.push(row.map(csvEscape).join(','));
  }

  return BOM + lines.join('\r\n');
}

/**
 * CSV 字段转义：包含逗号/引号/换行的字段，整体加引号 + 引号转义
 */
function csvEscape(value: string): string {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * 时间戳（ms）→ YYYY-MM-DD HH:mm:ss（北京时间）
 */
function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  // 简单输出 ISO 风格本地时间
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

/**
 * 生成下载文件名：wedding-rsvps-YYYYMMDD.csv
 */
export function csvFilename(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `wedding-rsvps-${y}${m}${d}.csv`;
}

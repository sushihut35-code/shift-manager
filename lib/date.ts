// 日付・週ユーティリティ（全て "YYYY-MM-DD" 文字列で扱う）

import {
  addDays,
  addWeeks,
  format,
  isValid,
  parseISO,
  startOfWeek,
} from "date-fns";

// 曜日ラベル（月曜始まり）
export const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// Date → "YYYY-MM-DD"（ローカルタイムゾーンで書式化）
export const toISO = (d: Date): string => format(d, "yyyy-MM-dd");

// "YYYY-MM-DD" → ローカル真夜中のDate（どのタイムゾーンでも往復安全）
export const fromISO = (s: string): Date => parseISO(`${s}T00:00:00`);

// "YYYY-MM-DD" 形式の検証
export const isISODate = (s: unknown): s is string =>
  typeof s === "string" && ISO_DATE_RE.test(s) && isValid(fromISO(s));

// "HH:mm" 形式の検証
export const isHHmm = (s: unknown): s is string =>
  typeof s === "string" && HHMM_RE.test(s);

// 任意の日付文字列からその週の月曜日の "YYYY-MM-DD" を得る（無効値は今週）
export const getWeekStart = (iso: string): string =>
  toISO(startOfWeek(isISODate(iso) ? fromISO(iso) : new Date(), {
    weekStartsOn: 1,
  }));

// 週頭から7日分の "YYYY-MM-DD" 配列
export const getWeekDays = (weekStartIso: string): string[] =>
  Array.from({ length: 7 }, (_, i) => toISO(addDays(fromISO(weekStartIso), i)));

// 週を n 週ずらす（負値で過去へ）
export const addWeeksISO = (iso: string, n: number): string =>
  toISO(addWeeks(fromISO(iso), n));

// 日を n 日ずらす（負値で過去へ）
export const addDaysISO = (iso: string, n: number): string =>
  toISO(addDays(fromISO(iso), n));

// 日付・週ユーティリティ（全て "YYYY-MM-DD" 文字列で扱う）

import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfYear,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
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

// "HH:mm" かつ30分単位（:00 か :30）の検証
export const isHHmmStep30 = (s: unknown): s is string =>
  isHHmm(s) && (s.endsWith(":00") || s.endsWith(":30"));

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

// 任意の日付文字列からその月の1日の "YYYY-MM-DD"（無効値は今月）
export const getMonthStart = (iso: string): string =>
  toISO(
    startOfMonth(isISODate(iso) ? fromISO(iso) : new Date())
  );

// 月の1日〜末日までの "YYYY-MM-DD" 配列
export const getMonthDays = (monthStartIso: string): string[] => {
  const end = toISO(endOfMonth(fromISO(monthStartIso)));
  const lastDay = Number(end.slice(8, 10));
  return Array.from({ length: lastDay }, (_, i) =>
    toISO(addDays(fromISO(monthStartIso), i))
  );
};

// 月を n つずらす（負値で過去へ）
export const addMonthsISO = (iso: string, n: number): string =>
  toISO(addMonths(fromISO(iso), n));

// 任意の日付文字列からその年の1月1日（無効値は今年）
export const getYearStart = (iso: string): string =>
  toISO(startOfYear(isISODate(iso) ? fromISO(iso) : new Date()));

// 年の1月1日〜12月31日までの配列（365/366日）
export const getYearDays = (yearStartIso: string): string[] => {
  const end = toISO(endOfYear(fromISO(yearStartIso)));
  const lastDay = Number(end.slice(8, 10));
  const total =
    Math.round(
      (fromISO(end).getTime() - fromISO(yearStartIso).getTime()) / 86400000
    ) + 1;
  void lastDay;
  return Array.from({ length: total }, (_, i) =>
    toISO(addDays(fromISO(yearStartIso), i))
  );
};

// 年を n つずらす（負値で過去へ）
export const addYearsISO = (iso: string, n: number): string =>
  toISO(addYears(fromISO(iso), n));

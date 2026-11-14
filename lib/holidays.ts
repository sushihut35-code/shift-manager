// 日本の国民の祝日（1980〜2099年の近似計算・振替休日つき）
// 用途は画面表示のため、主要祝日と基本の振替休日をカバーする

import { fromISO, addDaysISO } from "@/lib/date";

const pad = (n: number) => String(n).padStart(2, "0");

// y年 m月の第 n 月曜日の "YYYY-MM-DD"
const nthMonday = (y: number, m: number, n: number): string => {
  const first = new Date(y, m - 1, 1);
  const offset = (8 - first.getDay()) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return `${y}-${pad(m)}-${pad(day)}`;
};

// 春分日・秋分日（1980〜2099年で有効な近似式）
const shunbunDay = (y: number) =>
  Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
const shubunDay = (y: number) =>
  Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));

// 指定年の祝日表（日付 → 祝日名）
const holidaysOfYear = (y: number): Record<string, string> => ({
  [`${y}-01-01`]: "元日",
  [nthMonday(y, 1, 2)]: "成人の日",
  [`${y}-02-11`]: "建国記念の日",
  [`${y}-02-23`]: "天皇誕生日",
  [`${y}-03-${pad(shunbunDay(y))}`]: "春分の日",
  [`${y}-04-29`]: "昭和の日",
  [`${y}-05-03`]: "憲法記念日",
  [`${y}-05-04`]: "みどりの日",
  [`${y}-05-05`]: "こどもの日",
  [nthMonday(y, 7, 3)]: "海の日",
  [`${y}-08-11`]: "山の日",
  [nthMonday(y, 9, 3)]: "敬老の日",
  [`${y}-09-${pad(shubunDay(y))}`]: "秋分の日",
  [nthMonday(y, 10, 2)]: "スポーツの日",
  [`${y}-11-03`]: "文化の日",
  [`${y}-11-23`]: "勤労感謝の日",
});

// 祝日名を返す（祝日でなければ null）
export const getHolidayName = (iso: string): string | null => {
  const y = Number(iso.slice(0, 4));
  if (y < 1980 || y > 2099) return null;

  const table = holidaysOfYear(y);
  if (table[iso]) return table[iso];

  // 振替休日: 前日が祝日で日曜なら当日は振替休日
  const prev = addDaysISO(iso, -1);
  if (fromISO(prev).getDay() === 0 && table[prev]) {
    // ただし前日が前年・翌年の表に属する場合はそちらで判定
    const prevY = Number(prev.slice(0, 4));
    const prevTable = prevY === y ? table : holidaysOfYear(prevY);
    if (prevTable[prev]) return "振替休日";
  }

  // 年跨ぎ（1/1が月曜で12/31が日曜祝日等）の前年判定も同様に
  if (iso.endsWith("-01-01")) {
    const prevYearTable = holidaysOfYear(y - 1);
    const prev = addDaysISO(iso, -1);
    if (fromISO(prev).getDay() === 0 && prevYearTable[prev]) {
      return "振替休日";
    }
  }

  return null;
};

// 祝日かどうか
export const isHoliday = (iso: string): boolean =>
  getHolidayName(iso) !== null;

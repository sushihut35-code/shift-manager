// 端末内データ庫（localStorageに全データを保存・kakaku方式）
// 初回は lib/initial-data.json（Supabaseから引き抜いた移行データ）を種として読み込む
// 件数が個人文書規模なので全件読み書きで十分軽い

import initialData from "@/lib/initial-data.json";
import type { StaffDTO, ShiftDTO } from "@/types";

const KEY = "shift-manager-data-v1";

interface DBData {
  staff: StaffDTO[];
  shifts: ShiftDTO[];
}

const nowISO = () => new Date().toISOString();

// 全データ読み込み（localStorage が空なら初期データから複製）
const read = (): DBData => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DBData;
      if (Array.isArray(parsed.staff) && Array.isArray(parsed.shifts)) {
        return parsed;
      }
    }
  } catch {
    // 壊れていたら初期データにフォールバック
  }
  return {
    staff: (initialData.staff as StaffDTO[]).map((s) => ({ ...s })),
    shifts: (initialData.shifts as ShiftDTO[]).map((v) => ({ ...v })),
  };
};

const write = (d: DBData) => {
  localStorage.setItem(KEY, JSON.stringify(d));
};

// ---------- スタッフ ----------
export const getStaff = (): StaffDTO[] => read().staff;

export const saveStaff = (s: StaffDTO): StaffDTO => {
  const d = read();
  const row: StaffDTO = {
    ...s,
    createdAt: s.createdAt ?? nowISO(),
    updatedAt: nowISO(),
  };
  const i = d.staff.findIndex((x) => x.id === row.id);
  if (i >= 0) {
    d.staff[i] = row;
  } else {
    d.staff.push(row);
  }
  write(d);
  return row;
};

export const createStaff = (data: {
  name: string;
  displayColor: string;
  sortOrder: number;
  memo?: string;
}): StaffDTO =>
  saveStaff({
    id: crypto.randomUUID(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    isActive: true,
    ...data,
  });

export const deleteStaff = (id: string) => {
  const d = read();
  d.staff = d.staff.filter((s) => s.id !== id);
  d.shifts = d.shifts.filter((v) => v.staffId !== id);
  write(d);
};

// ---------- シフト ----------
export const getShifts = (startISO?: string, endISO?: string): ShiftDTO[] => {
  const all = read().shifts;
  if (!startISO || !endISO) return all;
  return all.filter((v) => v.date >= startISO && v.date <= endISO);
};

// その日その人のシフトを全置き換え（rows が空なら削除）
// 作成日時・更新日時はこの庫が付与する
export const replaceShifts = (
  staffId: string,
  date: string,
  rows: Array<Partial<Omit<ShiftDTO, "id">> & { id?: string }>
): ShiftDTO[] => {
  const d = read();
  d.shifts = d.shifts.filter((v) => !(v.staffId === staffId && v.date === date));
  const created = rows.map((r) => ({
    ...r,
    id: r.id ?? crypto.randomUUID(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  })) as ShiftDTO[];
  d.shifts.push(...created);
  write(d);
  return created;
};

// ---------- バックアップ ----------
export const exportAll = (): string => JSON.stringify(read());

export const importAll = (text: string) => {
  const d = JSON.parse(text) as DBData;
  if (!Array.isArray(d.staff) || !Array.isArray(d.shifts)) {
    throw new Error("データ形式が違います");
  }
  write(d);
};

// 端末のデータを消して初期データに戻す
export const resetAll = () => {
  localStorage.removeItem(KEY);
};

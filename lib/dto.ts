// APIレスポンス用のDTO変換（Prisma行 → DTO。日時はISO文字列化）

import type { Staff, Shift } from "@/lib/generated/prisma/client";
import type { StaffDTO, ShiftDTO } from "@/types";

// Staff行 → StaffDTO
export const toStaffDto = (s: Staff): StaffDTO => ({
  id: s.id,
  name: s.name,
  displayColor: s.displayColor,
  sortOrder: s.sortOrder,
  isActive: s.isActive,
  memo: s.memo ?? undefined,
  createdAt: s.createdAt.toISOString(),
  updatedAt: s.updatedAt.toISOString(),
});

// Shift行 → ShiftDTO
export const toShiftDto = (v: Shift): ShiftDTO => ({
  id: v.id,
  staffId: v.staffId,
  date: v.date,
  startTime: v.startTime ?? undefined,
  endTime: v.endTime ?? undefined,
  isDayOff: v.isDayOff,
  memo: v.memo ?? undefined,
  createdAt: v.createdAt.toISOString(),
  updatedAt: v.updatedAt.toISOString(),
});

// 月表示シフト一覧（日付を行として縦に並べ、各日に全スタッフのシフトを表示）

"use client";

import { useEffect, useMemo, useState } from "react";
import { MonthNavigator } from "@/components/shifts/month-navigator";
import { ShiftDialog } from "@/components/shifts/shift-dialog";
import { getMonthDays, toISO, fromISO } from "@/lib/date";
import { getHolidayName } from "@/lib/holidays";
import { format } from "date-fns";
import type { StaffDTO, ShiftDTO } from "@/types";

interface MonthlyShiftListProps {
  staff: StaffDTO[];
  shifts: ShiftDTO[];
  monthStart: string; // その月の1日
}

// 曜日ラベル（日曜始まりの配列）
const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// その日のシフトを行表示用テキストに（例: "10:00〜19:00" / "10:00〜 / 17:30〜21:00"）
const shiftText = (list: ShiftDTO[]): string | null => {
  const slots = list
    .filter((s) => !s.isDayOff && s.startTime)
    .sort((a, b) => (a.startTime! < b.startTime! ? -1 : 1));
  if (slots.length > 0) {
    return slots
      .map((s) => `${s.startTime}〜${s.endTime ?? ""}`)
      .join(" / ");
  }
  if (list.some((s) => s.isDayOff)) return "休み";
  return null;
};

export function MonthlyShiftList({
  staff,
  shifts,
  monthStart,
}: MonthlyShiftListProps) {
  const [currentShifts, setCurrentShifts] = useState<ShiftDTO[]>(shifts);
  const [editing, setEditing] = useState<{
    staffId: string;
    date: string;
  } | null>(null);

  const days = useMemo(() => getMonthDays(monthStart), [monthStart]);

  // 「今日」はhydration後にクライアント側で確定させる
  // （SSR時点のサーバー日付とブラウザ日付が食い違うとhydrationエラーで
  // 　全イベントが死ぬため、初回描画では強調しない）
  const [todayISO, setTodayISO] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSRとブラウザの日付不一致によるhydration崩壊を防ぐ、クライアント側でのみ確定すべき値のため
    setTodayISO(toISO(new Date()));
  }, []);

  // date → シフト行の配列
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Map<string, ShiftDTO[]>>();
    for (const s of currentShifts) {
      let byStaff = map.get(s.date);
      if (!byStaff) {
        byStaff = new Map();
        map.set(s.date, byStaff);
      }
      const list = byStaff.get(s.staffId);
      if (list) {
        list.push(s);
      } else {
        byStaff.set(s.staffId, [s]);
      }
    }
    return map;
  }, [currentShifts]);

  // 保存後に月のシフトを再取得
  const refreshShifts = async () => {
    const monthEnd = days[days.length - 1];
    const res = await fetch(
      `/api/shifts?start=${monthStart}&end=${monthEnd}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      setCurrentShifts(data.items);
    }
  };

  const editingStaff = editing
    ? staff.find((s) => s.id === editing.staffId) ?? null
    : null;
  const editingShifts = editing
    ? shiftsByDate.get(editing.date)?.get(editing.staffId) ?? null
    : null;

  return (
    <div className="space-y-3">
      <MonthNavigator monthStart={monthStart} />

      {/* 日付の縦並びリスト */}
      <div className="space-y-2">
        {days.map((d) => {
          const dayNum = fromISO(d).getDay();
          const holiday = getHolidayName(d);
          const isToday = d === todayISO;
          // 日曜・祝日は赤、土曜は青
          const dateColor =
            dayNum === 0 || holiday
              ? "text-red-600"
              : dayNum === 6
                ? "text-blue-600"
                : "text-gray-700";
          const byStaff = shiftsByDate.get(d);

          return (
            <div
              key={d}
              className={`bg-white rounded-xl border overflow-hidden ${
                isToday ? "border-blue-400" : "border-gray-200"
              }`}
            >
              {/* 日付ヘッダー */}
              <div
                className={`flex items-baseline gap-2 px-3 py-1.5 border-b border-gray-100 ${
                  isToday ? "bg-blue-50" : "bg-gray-50/60"
                }`}
              >
                <span className={`text-sm font-bold ${dateColor}`}>
                  {format(fromISO(d), "d日")}
                </span>
                <span className={`text-xs font-medium ${dateColor}`}>
                  ({DAY_LABELS[dayNum]})
                </span>
                {holiday && (
                  <span className="text-[11px] text-red-500">{holiday}</span>
                )}
                {isToday && (
                  <span className="ml-auto text-[10px] font-bold text-blue-600">
                    今日
                  </span>
                )}
              </div>

              {/* その日のスタッフ別シフト */}
              <ul>
                {staff.map((s) => {
                  const list = byStaff?.get(s.id);
                  const text = list ? shiftText(list) : null;
                  const isDayOff = list?.some((x) => x.isDayOff);
                  const hasMemo = list?.some((x) => x.memo);
                  return (
                    <li key={s.id} className="border-b border-gray-50 last:border-b-0">
                      <button
                        onClick={() => setEditing({ staffId: s.id, date: d })}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50/40 transition-colors"
                        aria-label={`${format(fromISO(d), "M月d日")} ${s.name}のシフト編集`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: s.displayColor }}
                        />
                        <span className="text-xs font-medium text-gray-700 w-16 shrink-0 truncate">
                          {s.name}
                        </span>
                        {isDayOff ? (
                          <span className="text-xs text-gray-400">休み</span>
                        ) : text ? (
                          <span className="text-xs font-medium text-gray-800">
                            {text}
                            {hasMemo && (
                              <span className="text-gray-400 ml-1">…</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400 text-center pb-1">
        名前の行をタップしてシフトを編集できます
      </p>

      {/* 編集ダイアログ（週表示と共用） */}
      <ShiftDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        staff={editingStaff}
        date={editing?.date ?? null}
        shifts={editingShifts}
        onSaved={refreshShifts}
      />
    </div>
  );
}

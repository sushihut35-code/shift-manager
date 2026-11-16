// 月表示シフトボード（スタッフ×日付のマス目を、その月ぶん横に並べて横スクロールで見る）

"use client";

import { useEffect, useMemo, useState } from "react";
import { MonthNavigator } from "@/components/shifts/month-navigator";
import { ShiftCell } from "@/components/shifts/shift-cell";
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

  // staffId:date → シフト行の配列
  const shiftMap = useMemo(() => {
    const map = new Map<string, ShiftDTO[]>();
    for (const s of currentShifts) {
      const key = `${s.staffId}:${s.date}`;
      const list = map.get(key);
      if (list) {
        list.push(s);
      } else {
        map.set(key, [s]);
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
    ? shiftMap.get(`${editing.staffId}:${editing.date}`) ?? null
    : null;

  // グリッド全体の最小幅（スタッフ列76px＋1日あたり76px）
  const minWidth = 76 * (days.length + 1);
  const gridTemplate = `76px repeat(${days.length}, 1fr)`;

  return (
    <div className="space-y-3">
      <MonthNavigator monthStart={monthStart} />

      {/* 横スクロール領域（画面端まで出血） */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div style={{ minWidth }}>
          {/* 日付ヘッダー行 */}
          <div
            className="grid gap-1 mb-1"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="sticky left-0 z-20 bg-gray-50" />
            {days.map((d) => {
              const isToday = d === todayISO;
              const dayNum = fromISO(d).getDay();
              const holiday = getHolidayName(d);
              const colorClass =
                dayNum === 0 || holiday
                  ? "text-red-600"
                  : dayNum === 6
                    ? "text-blue-600"
                    : "text-gray-600";
              return (
                <div
                  key={d}
                  className={`text-center text-xs pt-1 pb-1 rounded-t-lg ${
                    isToday ? "bg-blue-50 font-bold" : ""
                  }`}
                  title={holiday ?? undefined}
                >
                  <p className={colorClass}>{DAY_LABELS[dayNum]}</p>
                  <p
                    className={`${
                      isToday ? "text-blue-700" : "text-gray-500"
                    } mt-0.5`}
                  >
                    {format(fromISO(d), "d")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* スタッフ行 */}
          <div className="space-y-1">
            {staff.map((s) => (
              <div
                key={s.id}
                className="grid gap-1"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {/* スタッフ名（左固定） */}
                <div className="sticky left-0 z-10 bg-gray-50 w-[76px] pr-2 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.displayColor }}
                  />
                  <span className="text-xs font-medium truncate">{s.name}</span>
                </div>

                {/* その月ぶんのセル */}
                {days.map((d) => (
                  <ShiftCell
                    key={d}
                    shifts={shiftMap.get(`${s.id}:${d}`)}
                    staffColor={s.displayColor}
                    onClick={() => setEditing({ staffId: s.id, date: d })}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center pb-1">
        セルをタップしてシフトを編集できます（左右にスクロールで月末まで続きます）
      </p>

      {/* 編集ダイアログ */}
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

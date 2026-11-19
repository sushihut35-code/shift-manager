// 週次シフトボード（横スクロール＋スタッフ列固定・セル編集）

"use client";

import { useEffect, useMemo, useState } from "react";
import { WeekNavigator } from "@/components/shifts/week-navigator";
import { ShiftCell } from "@/components/shifts/shift-cell";
import { ShiftDialog } from "@/components/shifts/shift-dialog";
import { getWeekDays, toISO, fromISO } from "@/lib/date";
import { format } from "date-fns";
import type { StaffDTO, ShiftDTO } from "@/types";

interface WeeklyShiftBoardProps {
  staff: StaffDTO[];
  shifts: ShiftDTO[];
  weekStart: string;
  onRefresh?: () => void; // 保存後に親へ再読み込みを促す
}

export function WeeklyShiftBoard({
  staff,
  shifts,
  weekStart,
  onRefresh,
}: WeeklyShiftBoardProps) {
  const [currentShifts, setCurrentShifts] = useState<ShiftDTO[]>(shifts);
  const [editing, setEditing] = useState<{
    staffId: string;
    date: string;
  } | null>(null);

  // 親から渡されるシフトの更新に追随
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 親で再読み込みされたデータへの同期
    setCurrentShifts(shifts);
  }, [shifts]);

  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // 「今日」はhydration後にクライアント側で確定させる
  // （SSR時点のサーバー日付とブラウザ日付が食い違うとhydrationエラーで
  // 　全イベントが死ぬため、初回描画では強調しない）
  const [todayISO, setTodayISO] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSRとブラウザの日付不一致によるhydration崩壊を防ぐ、クライアント側でのみ確定すべき値のため
    setTodayISO(toISO(new Date()));
  }, []);

  // staffId:date → その日のシフト行の配列
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

  // 保存後に親へ再読み込みを促す
  const refreshShifts = () => {
    onRefresh?.();
  };

  const editingStaff = editing
    ? staff.find((s) => s.id === editing.staffId) ?? null
    : null;
  const editingShifts = editing
    ? shiftMap.get(`${editing.staffId}:${editing.date}`) ?? null
    : null;

  return (
    <div className="space-y-3">
      <WeekNavigator weekStart={weekStart} />

      {/* 横スクロール領域（画面端まで出血） */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[608px]">
          {/* 曜日ヘッダー行 */}
          <div className="grid grid-cols-[76px_repeat(7,1fr)] gap-1 mb-1">
            <div className="sticky left-0 z-20 bg-gray-50" />
            {days.map((d) => {
              const isToday = d === todayISO;
              const dayNum = fromISO(d).getDay();
              const colorClass =
                dayNum === 6
                  ? "text-blue-600"
                  : dayNum === 0
                    ? "text-red-600"
                    : "text-gray-600";
              return (
                <div
                  key={d}
                  className={`text-center text-xs pt-1 pb-1 rounded-t-lg ${
                    isToday ? "bg-blue-50 font-bold" : ""
                  }`}
                >
                  <p className={colorClass}>{["日","月","火","水","木","金","土"][dayNum]}</p>
                  <p
                    className={`${isToday ? "text-blue-700" : "text-gray-500"} mt-0.5`}
                  >
                    {format(fromISO(d), "M/d")}
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
                className="grid grid-cols-[76px_repeat(7,1fr)] gap-1"
              >
                {/* スタッフ名（左固定） */}
                <div className="sticky left-0 z-10 bg-gray-50 w-[76px] pr-2 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.displayColor }}
                  />
                  <span className="text-xs font-medium truncate">{s.name}</span>
                </div>

                {/* 7日分のセル */}
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

      <p className="text-[11px] text-gray-400 text-center">
        セルをタップしてシフトを編集できます
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

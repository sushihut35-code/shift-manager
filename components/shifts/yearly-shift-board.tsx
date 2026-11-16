// 年間シフトボード（1年365日のマス目を横スクロールで繋げて見る・月/週/今日へジャンプ可能）

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { YearNavigator } from "@/components/shifts/year-navigator";
import { ShiftCell } from "@/components/shifts/shift-cell";
import { ShiftDialog } from "@/components/shifts/shift-dialog";
import {
  getYearDays,
  toISO,
  fromISO,
  addDaysISO,
  addMonthsISO,
  getMonthStart,
} from "@/lib/date";
import { getHolidayName } from "@/lib/holidays";
import { format } from "date-fns";
import type { StaffDTO, ShiftDTO } from "@/types";

interface YearlyShiftBoardProps {
  staff: StaffDTO[];
  shifts: ShiftDTO[];
  yearStart: string; // その年の1月1日
}

// 1列の幅（px）— スクロール位置計算の基準
const COL_W = 76;
// スタッフ名列の幅（px）
const NAME_W = 76;

// 曜日ラベル（日曜始まりの配列）
const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function YearlyShiftBoard({
  staff,
  shifts,
  yearStart,
}: YearlyShiftBoardProps) {
  const [currentShifts, setCurrentShifts] = useState<ShiftDTO[]>(shifts);
  const [editing, setEditing] = useState<{
    staffId: string;
    date: string;
  } | null>(null);

  const days = useMemo(() => getYearDays(yearStart), [yearStart]);

  // 「今日」はhydration後にクライアント側で確定させる
  // （SSR時点のサーバー日付とブラウザ日付が食い違うとhydrationエラーで
  // 　全イベントが死ぬため、初回描画では強調しない）
  const [todayISO, setTodayISO] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSRとブラウザの日付不一致によるhydration崩壊を防ぐ、クライアント側でのみ確定すべき値のため
    setTodayISO(toISO(new Date()));
  }, []);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [centerDate, setCenterDate] = useState(days[0]);

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

  // 指定日付の列へスムーズスクロール（画面中央に来るように）
  const scrollToDate = (iso: string, smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = days.indexOf(iso);
    if (idx < 0) return;
    const target =
      NAME_W + idx * COL_W + COL_W / 2 - el.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: smooth ? "smooth" : "auto" });
  };

  // マウント時（hydration後）に今日の位置へ一瞬で移動
  useEffect(() => {
    if (todayISO && days.includes(todayISO)) {
      scrollToDate(todayISO, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回のみで良い
  }, [todayISO]);

  // スクロール位置から「見ている日付」を算出してラベル更新
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const centerIdx = Math.round(
          (el.scrollLeft + el.clientWidth / 2 - NAME_W) / COL_W
        );
        const clamped = Math.min(Math.max(centerIdx, 0), days.length - 1);
        setCenterDate(days[clamped]);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [days]);

  // 保存後に年のシフトを再取得
  const refreshShifts = async () => {
    const yearEnd = days[days.length - 1];
    const res = await fetch(
      `/api/shifts?start=${yearStart}&end=${yearEnd}`,
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

  const minWidth = NAME_W + days.length * COL_W;
  const gridTemplate = `${NAME_W}px repeat(${days.length}, ${COL_W}px)`;

  return (
    <div className="space-y-3">
      <YearNavigator
        centerDate={centerDate}
        onScrollByDays={(n) => scrollToDate(addDaysISO(centerDate, n))}
        onScrollMonth={(n) =>
          scrollToDate(getMonthStart(addMonthsISO(centerDate, n)))
        }
        onScrollToday={() => todayISO && scrollToDate(todayISO)}
      />

      {/* 横スクロール領域（画面端まで出血） */}
      <div
        ref={scrollRef}
        className="overflow-x-auto -mx-4 px-4"
      >
        <div style={{ minWidth }}>
          {/* 日付ヘッダー行 */}
          <div
            className="grid gap-px mb-1"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="sticky left-0 z-20 bg-gray-50" />
            {days.map((d) => {
              const isToday = d === todayISO;
              const dayNum = fromISO(d).getDay();
              const holiday = getHolidayName(d);
              const isMonthFirst = d.endsWith("-01");
              const colorClass =
                dayNum === 0 || holiday
                  ? "text-red-600"
                  : dayNum === 6
                    ? "text-blue-600"
                    : "text-gray-600";
              return (
                <div
                  key={d}
                  className={`text-center text-[10px] pt-1 pb-1 leading-tight ${
                    isToday ? "bg-blue-50 font-bold rounded-t-lg" : ""
                  } ${isMonthFirst ? "border-l-2 border-gray-300" : ""}`}
                  title={`${format(fromISO(d), "M月d日")}${holiday ? ` ${holiday}` : ""}`}
                >
                  <p className={colorClass}>{DAY_LABELS[dayNum]}</p>
                  <p
                    className={`${
                      isToday ? "text-blue-700" : "text-gray-500"
                    } mt-0.5`}
                  >
                    {isMonthFirst ? format(fromISO(d), "M/1") : format(fromISO(d), "d")}
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
                className="grid gap-px"
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

                {/* 1年ぶんのセル */}
                {days.map((d) => (
                  <div
                    key={d}
                    className={d.endsWith("-01") ? "border-l-2 border-gray-200" : ""}
                  >
                    <ShiftCell
                      shifts={shiftMap.get(`${s.id}:${d}`)}
                      staffColor={s.displayColor}
                      onClick={() => setEditing({ staffId: s.id, date: d })}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center pb-1">
        セルをタップして編集・左右スクロールで一年を見渡せます
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

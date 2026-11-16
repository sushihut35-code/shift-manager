// シフトセル（空・休み・時間帯シフト1〜2件の状態を表示）

import type { ShiftDTO } from "@/types";

interface ShiftCellProps {
  shifts?: ShiftDTO[];
  staffColor: string;
  onClick: () => void;
}

// 1つの時間帯の表示（endTime が無ければ「10:00〜」のように終了未定で出す）
function SlotLabel({ startTime, endTime }: { startTime: string; endTime?: string | null }) {
  return (
    <>
      <span className="text-[11px] font-medium leading-tight">
        {startTime}
      </span>
      <span className="text-[11px] text-gray-500 leading-tight">〜</span>
      <span className="text-[11px] font-medium leading-tight">
        {endTime ?? ""}
      </span>
    </>
  );
}

export function ShiftCell({ shifts, staffColor, onClick }: ShiftCellProps) {
  const list = shifts ?? [];

  // 休み
  if (list.some((s) => s.isDayOff)) {
    return (
      <button
        onClick={onClick}
        className="w-full min-h-[64px] rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center"
        aria-label="休み"
      >
        <span className="text-xs text-gray-400 font-medium">休み</span>
      </button>
    );
  }

  // 時間帯シフト（1〜2件・終了未定を含む）
  const timeSlots = list.filter(
    (s) => !s.isDayOff && s.startTime
  );

  if (timeSlots.length > 0) {
    const hasMemo = list.some((s) => s.memo);
    return (
      <button
        onClick={onClick}
        className={`w-full rounded-lg bg-white border border-gray-200 px-1 flex flex-col items-center justify-center relative overflow-hidden ${
          timeSlots.length === 2 ? "min-h-[88px] gap-0.5 py-1" : "min-h-[64px] gap-0.5"
        }`}
        aria-label={timeSlots
          .map((s) => `${s.startTime}〜${s.endTime ?? ""}`)
          .join("と")}
      >
        <span
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ backgroundColor: staffColor }}
        />
        {timeSlots.map((s, i) => (
          <span key={s.id} className="flex flex-col items-center">
            {i > 0 && (
              <span className="text-[9px] text-gray-300 leading-none my-0.5">
                ─
              </span>
            )}
            <SlotLabel startTime={s.startTime!} endTime={s.endTime} />
          </span>
        ))}
        {hasMemo && (
          <span className="absolute bottom-0.5 right-1 text-[10px] text-gray-400">
            …
          </span>
        )}
      </button>
    );
  }

  // 空
  return (
    <button
      onClick={onClick}
      className="w-full min-h-[64px] rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-blue-400 hover:text-blue-400 transition-colors"
      aria-label="シフト未設定"
    >
      <span className="text-xs">—</span>
    </button>
  );
}

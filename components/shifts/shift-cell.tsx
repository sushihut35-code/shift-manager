// シフトセル（空・休み・時刻シフトの3状態を表示）

import type { ShiftDTO } from "@/types";

interface ShiftCellProps {
  shift?: ShiftDTO;
  staffColor: string;
  onClick: () => void;
}

export function ShiftCell({ shift, staffColor, onClick }: ShiftCellProps) {
  // 休み
  if (shift?.isDayOff) {
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

  // 時刻シフト
  if (shift?.startTime && shift?.endTime) {
    return (
      <button
        onClick={onClick}
        className="w-full min-h-[64px] rounded-lg bg-white border border-gray-200 px-1 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden"
        aria-label={`${shift.startTime}〜${shift.endTime}`}
      >
        <span
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ backgroundColor: staffColor }}
        />
        <span className="text-[11px] font-medium leading-tight">
          {shift.startTime}
        </span>
        <span className="text-[11px] text-gray-500 leading-tight">〜</span>
        <span className="text-[11px] font-medium leading-tight">
          {shift.endTime}
        </span>
        {shift.memo && (
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

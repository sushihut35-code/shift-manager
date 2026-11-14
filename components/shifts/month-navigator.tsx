// 月移動ナビゲーター（URL駆動・サーバーで動作・月/週の表示切替つき）

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonthsISO, addWeeksISO, fromISO, getWeekStart } from "@/lib/date";
import { format } from "date-fns";

interface MonthNavigatorProps {
  monthStart: string; // その月の1日
}

export function MonthNavigator({ monthStart }: MonthNavigatorProps) {
  const label = `${format(fromISO(monthStart), "yyyy年M月")}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Link
          href={`/?month=${addMonthsISO(monthStart, -1)}`}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-2"
          aria-label="前の月へ"
        >
          <ChevronLeft className="w-4 h-4" />
          前月
        </Link>

        <div className="text-center">
          <p className="font-semibold">{label}</p>
          <Link href="/" className="text-xs text-blue-600 hover:underline">
            今日
          </Link>
        </div>

        <Link
          href={`/?month=${addMonthsISO(monthStart, 1)}`}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-2"
          aria-label="次の月へ"
        >
          次月
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 月/週の表示切替 */}
      <div className="flex gap-2" role="group" aria-label="表示切替">
        <span className="flex-1 text-center text-xs font-medium rounded-lg bg-blue-600 text-white py-1.5">
          月表示
        </span>
        <Link
          href={`/?view=week&week=${getWeekStart(addWeeksISO(monthStart, 0))}`}
          className="flex-1 text-center text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-600 py-1.5 hover:bg-gray-50"
        >
          週表示
        </Link>
      </div>
    </div>
  );
}

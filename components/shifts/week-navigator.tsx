// 週移動ナビゲーター（URL駆動・サーバーで動作・月/週の表示切替つき）

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addWeeksISO, fromISO, getMonthStart } from "@/lib/date";
import { format } from "date-fns";

interface WeekNavigatorProps {
  weekStart: string;
}

export function WeekNavigator({ weekStart }: WeekNavigatorProps) {
  const label = `${format(fromISO(weekStart), "M月d日")}〜${format(
    fromISO(addWeeksISO(weekStart, 1)),
    "M月d日"
  )}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Link
          href={`/?view=week&week=${addWeeksISO(weekStart, -1)}`}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-2"
          aria-label="前週へ"
        >
          <ChevronLeft className="w-4 h-4" />
          前週
        </Link>

        <div className="text-center">
          <p className="font-semibold">{label}</p>
          <Link href="/" className="text-xs text-blue-600 hover:underline">
            今日
          </Link>
        </div>

        <Link
          href={`/?view=week&week=${addWeeksISO(weekStart, 1)}`}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-2"
          aria-label="翌週へ"
        >
          翌週
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 月/週の表示切替 */}
      <div className="flex gap-2" role="group" aria-label="表示切替">
        <Link
          href={`/?month=${getMonthStart(weekStart)}`}
          className="flex-1 text-center text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-600 py-1.5 hover:bg-gray-50"
        >
          月表示
        </Link>
        <span className="flex-1 text-center text-xs font-medium rounded-lg bg-blue-600 text-white py-1.5">
          週表示
        </span>
      </div>
    </div>
  );
}

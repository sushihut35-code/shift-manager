// 週移動ナビゲーター（URL駆動・サーバーで動作）

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addWeeksISO, fromISO } from "@/lib/date";
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
    <div className="flex items-center justify-between">
      <Link
        href={`/?week=${addWeeksISO(weekStart, -1)}`}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-2"
        aria-label="前週へ"
      >
        <ChevronLeft className="w-4 h-4" />
        前週
      </Link>

      <div className="text-center">
        <p className="font-semibold">{label}</p>
        <Link
          href="/"
          className="text-xs text-blue-600 hover:underline"
        >
          今日
        </Link>
      </div>

      <Link
        href={`/?week=${addWeeksISO(weekStart, 1)}`}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-2"
        aria-label="翌週へ"
      >
        翌週
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

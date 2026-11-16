// 年グリッド用ナビゲーター（前月/前週/次週/次月/今日でグリッドをスクロールさせる）

"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fromISO } from "@/lib/date";

interface YearNavigatorProps {
  centerDate: string; // 現在見ている位置の日付
  onScrollByDays: (days: number) => void;
  onScrollMonth: (n: number) => void;
  onScrollToday: () => void;
}

export function YearNavigator({
  centerDate,
  onScrollByDays,
  onScrollMonth,
  onScrollToday,
}: YearNavigatorProps) {
  const label = format(fromISO(centerDate), "yyyy年M月");

  return (
    <div className="space-y-2">
      {/* 移動ボタンと現在位置 */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onScrollMonth(-1)}
          aria-label="前月へ"
          className="px-2"
        >
          <ChevronLeft className="w-4 h-4" />
          月
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onScrollByDays(-7)}
          aria-label="前週（7日）へ"
          className="px-2"
        >
          週
        </Button>

        <p className="flex-1 text-center font-semibold text-sm">{label}</p>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onScrollByDays(7)}
          aria-label="次週（7日）へ"
          className="px-2"
        >
          週
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onScrollMonth(1)}
          aria-label="次月へ"
          className="px-2"
        >
          月
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* 今日＋表示切替 */}
      <div className="flex gap-2 items-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={onScrollToday}
          className="px-3"
        >
          今日
        </Button>
        <div className="flex gap-2 flex-1" role="group" aria-label="表示切替">
          <span className="flex-1 text-center text-xs font-medium rounded-lg bg-blue-600 text-white py-1.5">
            年表示
          </span>
          <Link
            href="/?view=week"
            className="flex-1 text-center text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-600 py-1.5 hover:bg-gray-50"
          >
            週表示
          </Link>
        </div>
      </div>
    </div>
  );
}

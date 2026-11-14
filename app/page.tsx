// シフトページ（既定は月表示 / ?view=week&week=YYYY-MM-DD で週表示）

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toStaffDto, toShiftDto } from "@/lib/dto";
import {
  getWeekStart,
  getMonthStart,
  addDaysISO,
  getMonthDays,
} from "@/lib/date";
import { WeeklyShiftBoard } from "@/components/shifts/weekly-shift-board";
import { MonthlyShiftList } from "@/components/shifts/monthly-shift-list";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    month?: string;
    week?: string;
  }>;
}) {
  const { view = "month", month, week } = await searchParams; // Next.js 16: Promise を await

  const staff = await prisma.staff.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  // スタッフ未登録なら案内
  if (staff.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-gray-500">まずはスタッフを登録してください</p>
        <Link
          href="/staff"
          className="inline-flex items-center gap-2 bg-blue-500 text-white rounded-full px-6 py-3 font-medium"
        >
          <UserPlus className="w-5 h-5" />
          スタッフ登録へ
        </Link>
      </div>
    );
  }

  // 週表示（?view=week）
  if (view === "week") {
    const weekStart = getWeekStart(week ?? ""); // 無効・未指定は今週の月曜
    const weekEnd = addDaysISO(weekStart, 6);
    const shifts = await prisma.shift.findMany({
      where: { date: { gte: weekStart, lte: weekEnd } },
      orderBy: { date: "asc" },
    });

    return (
      <WeeklyShiftBoard
        staff={staff.map(toStaffDto)}
        shifts={shifts.map(toShiftDto)}
        weekStart={weekStart}
      />
    );
  }

  // 月表示（既定）
  const monthStart = getMonthStart(month ?? week ?? ""); // 無効・未指定は今月
  const monthEnd = getMonthDays(monthStart).at(-1)!;
  const shifts = await prisma.shift.findMany({
    where: { date: { gte: monthStart, lte: monthEnd } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return (
    <MonthlyShiftList
      staff={staff.map(toStaffDto)}
      shifts={shifts.map(toShiftDto)}
      monthStart={monthStart}
    />
  );
}

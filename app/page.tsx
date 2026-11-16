// シフトページ（既定は年表示 / ?view=week&week=YYYY-MM-DD で週表示）

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toStaffDto, toShiftDto } from "@/lib/dto";
import {
  getWeekStart,
  getYearStart,
  addDaysISO,
  getYearDays,
} from "@/lib/date";
import { WeeklyShiftBoard } from "@/components/shifts/weekly-shift-board";
import { YearlyShiftBoard } from "@/components/shifts/yearly-shift-board";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    year?: string;
    month?: string;
    week?: string;
  }>;
}) {
  const { view = "year", year, month, week } = await searchParams; // Next.js 16: Promise を await

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

  // 年表示（既定）: ?year=YYYY（month/week指定は年へ読み替え）
  const yearStart = getYearStart(year ?? month ?? week ?? "");
  const yearEnd = getYearDays(yearStart).at(-1)!;
  const shifts = await prisma.shift.findMany({
    where: { date: { gte: yearStart, lte: yearEnd } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return (
    <YearlyShiftBoard
      staff={staff.map(toStaffDto)}
      shifts={shifts.map(toShiftDto)}
      yearStart={yearStart}
    />
  );
}

// 週次シフトボードページ（?week=YYYY-MM-DD で週を指定）

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toStaffDto, toShiftDto } from "@/lib/dto";
import { getWeekStart, addDaysISO } from "@/lib/date";
import { WeeklyShiftBoard } from "@/components/shifts/weekly-shift-board";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams; // Next.js 16: Promise を await
  const weekStart = getWeekStart(week ?? ""); // 無効・未指定は今週の月曜
  const weekEnd = addDaysISO(weekStart, 6);

  const [staff, shifts] = await Promise.all([
    prisma.staff.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.shift.findMany({
      where: { date: { gte: weekStart, lte: weekEnd } },
      orderBy: { date: "asc" },
    }),
  ]);

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

  return (
    <WeeklyShiftBoard
      staff={staff.map(toStaffDto)}
      shifts={shifts.map(toShiftDto)}
      weekStart={weekStart}
    />
  );
}

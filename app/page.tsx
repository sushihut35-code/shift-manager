// シフトページ（既定は年表示 / ?view=week&week=YYYY-MM-DD で週表示）
// 端末内データ庫（localStorage）から読み込む

"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getStaff, getShifts } from "@/lib/local-db";
import { getWeekStart, getYearStart, addDaysISO, getYearDays } from "@/lib/date";
import { WeeklyShiftBoard } from "@/components/shifts/weekly-shift-board";
import { YearlyShiftBoard } from "@/components/shifts/yearly-shift-board";
import type { StaffDTO, ShiftDTO } from "@/types";

function HomePageInner() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "year";

  // データはhydration後に端末内から読み込む（SSR時は空）
  const [staff, setStaff] = useState<StaffDTO[]>([]);
  const [shifts, setShifts] = useState<ShiftDTO[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorageは端末内のみに存在するため、hydration後にクライアント側で読み込むのが安全
    setStaff(getStaff());
    setShifts(getShifts());
    setLoaded(true);
  }, []);

  const refresh = () => {
    setStaff(getStaff());
    setShifts(getShifts());
  };

  // 読み込み完了まで何も描かない（ちらつき防止）
  if (!loaded) return null;

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
    const weekStart = getWeekStart(searchParams.get("week") ?? "");
    const weekEnd = addDaysISO(weekStart, 6);
    const weekShifts = shifts.filter(
      (v) => v.date >= weekStart && v.date <= weekEnd
    );

    return (
      <WeeklyShiftBoard
        staff={staff}
        shifts={weekShifts}
        weekStart={weekStart}
        onRefresh={refresh}
      />
    );
  }

  // 年表示（既定）
  const yearStart = getYearStart(
    searchParams.get("year") ??
      searchParams.get("month") ??
      searchParams.get("week") ??
      ""
  );
  const yearEnd = getYearDays(yearStart).at(-1)!;
  const yearShifts = shifts.filter(
    (v) => v.date >= yearStart && v.date <= yearEnd
  );

  return (
    <YearlyShiftBoard
      staff={staff}
      shifts={yearShifts}
      yearStart={yearStart}
      onRefresh={refresh}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomePageInner />
    </Suspense>
  );
}

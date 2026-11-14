// シフトAPI - GET（期間取得）/ PUT（スタッフ×日の upsert）

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toShiftDto } from "@/lib/dto";
import { isISODate, isHHmm } from "@/lib/date";

// GET /api/shifts?start=YYYY-MM-DD&end=YYYY-MM-DD - 期間内のシフト取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get("start") || "";
    const end = searchParams.get("end") || "";

    // バリデーション
    if (!isISODate(start) || !isISODate(end)) {
      return NextResponse.json(
        { error: "開始日・終了日はYYYY-MM-DD形式で指定してください" },
        { status: 400 }
      );
    }
    if (start > end) {
      return NextResponse.json(
        { error: "開始日は終了日以前で指定してください" },
        { status: 400 }
      );
    }
    if ((new Date(end).getTime() - new Date(start).getTime()) / 86400000 > 62) {
      return NextResponse.json(
        { error: "期間は62日以内で指定してください" },
        { status: 400 }
      );
    }

    const shifts = await prisma.shift.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      items: shifts.map(toShiftDto),
      total: shifts.length,
    });
  } catch (error) {
    console.error("シフト一覧取得エラー:", error);
    return NextResponse.json(
      { error: "シフト一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT /api/shifts - シフト upsert（スタッフ×日で1行。時刻シフト or 休み）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const staffId = typeof body.staffId === "string" ? body.staffId : "";
    const date = typeof body.date === "string" ? body.date : "";
    const isDayOff = body.isDayOff === true;
    const startTime =
      typeof body.startTime === "string" && body.startTime !== ""
        ? body.startTime
        : null;
    const endTime =
      typeof body.endTime === "string" && body.endTime !== ""
        ? body.endTime
        : null;
    const memo =
      typeof body.memo === "string" && body.memo.trim() !== ""
        ? body.memo.trim()
        : null;

    // バリデーション
    if (!isISODate(date)) {
      return NextResponse.json(
        { error: "日付はYYYY-MM-DD形式で指定してください" },
        { status: 400 }
      );
    }
    if (memo && memo.length > 200) {
      return NextResponse.json(
        { error: "メモは200文字以内で入力してください" },
        { status: 400 }
      );
    }

    // スタッフ存在チェック
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return NextResponse.json(
        { error: "スタッフが見つかりません" },
        { status: 404 }
      );
    }

    // 休みでない場合は時刻が必須
    if (!isDayOff) {
      if (!isHHmm(startTime) || !isHHmm(endTime)) {
        return NextResponse.json(
          { error: "時刻はHH:mm形式で指定してください" },
          { status: 400 }
        );
      }
      if (startTime! >= endTime!) {
        return NextResponse.json(
          { error: "終了時刻は開始時刻より後になるように指定してください" },
          { status: 400 }
        );
      }
    }

    const shift = await prisma.shift.upsert({
      where: { staffId_date: { staffId, date } },
      update: {
        startTime: isDayOff ? null : startTime,
        endTime: isDayOff ? null : endTime,
        isDayOff,
        memo,
      },
      create: {
        staffId,
        date,
        startTime: isDayOff ? null : startTime,
        endTime: isDayOff ? null : endTime,
        isDayOff,
        memo,
      },
    });

    return NextResponse.json(toShiftDto(shift));
  } catch (error) {
    console.error("シフト登録エラー:", error);
    return NextResponse.json(
      { error: "シフトの登録に失敗しました" },
      { status: 500 }
    );
  }
}

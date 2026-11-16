// シフトAPI - GET（期間取得）/ PUT（スタッフ×日の全シフト置き換え）

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toShiftDto } from "@/lib/dto";
import { isISODate, isHHmmStep30 } from "@/lib/date";
import type { ShiftSlot } from "@/types";

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
    if ((new Date(end).getTime() - new Date(start).getTime()) / 86400000 > 366) {
      return NextResponse.json(
        { error: "期間は366日以内で指定してください" },
        { status: 400 }
      );
    }

    const shifts = await prisma.shift.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
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

// スロット配列の検証と時刻順ソート（不正なら日本語エラー文を返す）
// endTime は空欄可（終了未定のシフト）
const validateSlots = (raw: unknown): { slots?: ShiftSlot[]; error?: string } => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: "時間帯を1つ以上指定してください" };
  }
  if (raw.length > 2) {
    return { error: "時間帯は2つまで指定してください" };
  }
  const slots: ShiftSlot[] = [];
  for (const s of raw) {
    const startTime =
      typeof s?.startTime === "string" ? s.startTime : "";
    const endTime =
      typeof s?.endTime === "string" && s.endTime !== ""
        ? s.endTime
        : null;
    if (!isHHmmStep30(startTime)) {
      return { error: "開始時刻は30分単位（:00か:30）で指定してください" };
    }
    if (endTime !== null) {
      if (!isHHmmStep30(endTime)) {
        return { error: "終了時刻は30分単位（:00か:30）で指定してください" };
      }
      if (startTime >= endTime) {
        return {
          error: "終了時刻は開始時刻より後になるように指定してください",
        };
      }
    }
    slots.push({ startTime, endTime });
  }
  // 時刻順に並べ替え
  slots.sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
  // 時間帯の重複チェック（両方の終了時刻が分かっている場合のみ）
  if (
    slots.length === 2 &&
    slots[0].endTime !== null &&
    slots[1].endTime !== null &&
    slots[0].endTime! > slots[1].startTime
  ) {
    return { error: "2つの時間帯が重ならないように指定してください" };
  }
  return { slots };
};

// PUT /api/shifts - その日その人のシフトを全置き換え
// （時間帯シフト1〜2行、または休み1行）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const staffId = typeof body.staffId === "string" ? body.staffId : "";
    const date = typeof body.date === "string" ? body.date : "";
    const isDayOff = body.isDayOff === true;
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

    // 休みでない場合はスロット検証
    let slots: ShiftSlot[] | undefined;
    if (!isDayOff) {
      const v = validateSlots(body.slots);
      if (v.error) {
        return NextResponse.json({ error: v.error }, { status: 400 });
      }
      slots = v.slots;
    }

    // その日その人の行を全部置き換え（トランザクションで）
    const created = await prisma.$transaction(async (tx) => {
      await tx.shift.deleteMany({ where: { staffId, date } });
      if (isDayOff) {
        const row = await tx.shift.create({
          data: { staffId, date, isDayOff: true, memo },
        });
        return [row];
      }
      return Promise.all(
        slots!.map((slot) =>
          tx.shift.create({
            data: {
              staffId,
              date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isDayOff: false,
              memo,
            },
          })
        )
      );
    });

    return NextResponse.json({ items: created.map(toShiftDto) });
  } catch (error) {
    console.error("シフト登録エラー:", error);
    return NextResponse.json(
      { error: "シフトの登録に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/shifts?staffId=...&date=... - その日その人のシフトを全削除
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const staffId = searchParams.get("staffId") || "";
    const date = searchParams.get("date") || "";

    // バリデーション
    if (!staffId) {
      return NextResponse.json(
        { error: "staffIdは必須です" },
        { status: 400 }
      );
    }
    if (!isISODate(date)) {
      return NextResponse.json(
        { error: "日付はYYYY-MM-DD形式で指定してください" },
        { status: 400 }
      );
    }

    const result = await prisma.shift.deleteMany({
      where: { staffId, date },
    });

    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error("シフト削除エラー:", error);
    return NextResponse.json(
      { error: "シフトの削除に失敗しました" },
      { status: 500 }
    );
  }
}

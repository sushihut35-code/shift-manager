// スタッフAPI - GET（一覧取得）/ POST（新規登録）

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toStaffDto } from "@/lib/dto";

// GET /api/staff - スタッフ一覧取得
export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      items: staff.map(toStaffDto),
      total: staff.length,
    });
  } catch (error) {
    console.error("スタッフ一覧取得エラー:", error);
    return NextResponse.json(
      { error: "スタッフ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/staff - スタッフ新規登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const displayColor =
      typeof body.displayColor === "string" && body.displayColor !== ""
        ? body.displayColor
        : "#6B7280";
    const sortOrder =
      typeof body.sortOrder === "number" && Number.isInteger(body.sortOrder)
        ? body.sortOrder
        : 0;
    const memo =
      typeof body.memo === "string" && body.memo.trim() !== ""
        ? body.memo.trim()
        : null;

    // バリデーション
    if (!name) {
      return NextResponse.json(
        { error: "名前は必須です" },
        { status: 400 }
      );
    }
    if (name.length > 50) {
      return NextResponse.json(
        { error: "名前は50文字以内で入力してください" },
        { status: 400 }
      );
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(displayColor)) {
      return NextResponse.json(
        { error: "色は#RRGGBB形式で指定してください" },
        { status: 400 }
      );
    }
    if (sortOrder < 0 || sortOrder > 999) {
      return NextResponse.json(
        { error: "表示順は0〜999の整数で指定してください" },
        { status: 400 }
      );
    }
    if (memo && memo.length > 200) {
      return NextResponse.json(
        { error: "メモは200文字以内で入力してください" },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.create({
      data: { name, displayColor, sortOrder, memo },
    });

    return NextResponse.json(toStaffDto(staff));
  } catch (error) {
    console.error("スタッフ登録エラー:", error);
    return NextResponse.json(
      { error: "スタッフの登録に失敗しました" },
      { status: 500 }
    );
  }
}

// スタッフAPI - PUT（更新）/ DELETE（削除）

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toStaffDto } from "@/lib/dto";

// PUT /api/staff/[id] - スタッフ更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const isActive =
      typeof body.isActive === "boolean" ? body.isActive : undefined;

    // バリデーション
    if (!name) {
      return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
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

    // 存在チェック
    const existing = await prisma.staff.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "スタッフが見つかりません" },
        { status: 404 }
      );
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        name,
        displayColor,
        sortOrder,
        memo,
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json(toStaffDto(staff));
  } catch (error) {
    console.error("スタッフ更新エラー:", error);
    return NextResponse.json(
      { error: "スタッフの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id] - スタッフ削除（シフトも cascade 削除）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 存在チェック
    const existing = await prisma.staff.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "スタッフが見つかりません" },
        { status: 404 }
      );
    }

    await prisma.staff.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("スタッフ削除エラー:", error);
    return NextResponse.json(
      { error: "スタッフの削除に失敗しました" },
      { status: 500 }
    );
  }
}

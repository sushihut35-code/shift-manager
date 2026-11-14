// シフトAPI - DELETE（削除）

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/shifts/[id] - シフト削除
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 存在チェック
    const existing = await prisma.shift.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "シフトが見つかりません" },
        { status: 404 }
      );
    }

    await prisma.shift.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("シフト削除エラー:", error);
    return NextResponse.json(
      { error: "シフトの削除に失敗しました" },
      { status: 500 }
    );
  }
}

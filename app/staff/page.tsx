// スタッフ管理ページ

import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { toStaffDto } from "@/lib/dto";
import { StaffManager } from "@/components/staff/staff-manager";

export default async function StaffPage() {
  await connection(); // リクエストごとに最新のスタッフ一覧を取得

  const staff = await prisma.staff.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return <StaffManager initialStaff={staff.map(toStaffDto)} />;
}

// シードデータ作成スクリプト（スタッフ4名＋今週の見本シフト）

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";
import { getWeekStart, getWeekDays } from "../lib/date";

// .env を読み込む（Node 21+ の標準機能）
try {
  process.loadEnvFile();
} catch {
  // .env が無い場合は環境変数のみで動作
}

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("シードデータ作成開始...");

  // 冪等性：既にデータがあれば何もしない
  if ((await prisma.staff.count()) > 0) {
    console.log("既存データがあるため、シードをスキップしました");
    return;
  }

  // スタッフを作成
  const staffList = await Promise.all([
    prisma.staff.create({
      data: { name: "田中太郎", displayColor: "#60A5FA", sortOrder: 1 },
    }),
    prisma.staff.create({
      data: { name: "鈴木花子", displayColor: "#F472B6", sortOrder: 2 },
    }),
    prisma.staff.create({
      data: { name: "佐藤健", displayColor: "#34D399", sortOrder: 3 },
    }),
    prisma.staff.create({
      data: { name: "山田美月", displayColor: "#FBBF24", sortOrder: 4 },
    }),
  ]);
  console.log(`${staffList.length}名のスタッフを作成しました`);
  const [taro, hanako, ken, mitsuki] = staffList;

  // 今週（月曜始まり）の日付
  const days = getWeekDays(getWeekStart(new Date().toISOString().slice(0, 10)));

  // 見本シフトを作成（時刻シフト・休み・メモ付きを混ぜて全セル状態を確認できるように）
  await prisma.shift.createMany({
    data: [
      // 田中太郎: 月〜金 10:00-19:00
      ...[0, 1, 2, 3, 4].map((i) => ({
        staffId: taro.id,
        date: days[i],
        startTime: "10:00",
        endTime: "19:00",
      })),
      // 鈴木花子: 火〜土 11:00-20:00（水は休み）
      ...[1, 3, 4, 5].map((i) => ({
        staffId: hanako.id,
        date: days[i],
        startTime: "11:00",
        endTime: "20:00",
      })),
      { staffId: hanako.id, date: days[2], isDayOff: true },
      // 佐藤健: 月水金 09:00-14:00（月はメモ付き）
      { staffId: ken.id, date: days[0], startTime: "09:00", endTime: "14:00", memo: "午前のみ" },
      { staffId: ken.id, date: days[2], startTime: "09:00", endTime: "14:00" },
      { staffId: ken.id, date: days[4], startTime: "09:00", endTime: "14:00" },
      // 山田美月: 土日 12:00-18:00
      { staffId: mitsuki.id, date: days[5], startTime: "12:00", endTime: "18:00" },
      { staffId: mitsuki.id, date: days[6], startTime: "12:00", endTime: "18:00" },
    ],
  });
  console.log("今週の見本シフトを作成しました");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

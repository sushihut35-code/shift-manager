// Prismaクライアントのシングルトンインスタンス（Prisma 7 driver adapter 方式・SQLite）

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/lib/generated/prisma/client";

// グローバルスコープにPrismaインスタンスをキャッシュ
// （開発時のホットリロードで複数接続が発生するのを防ぐため）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    }),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

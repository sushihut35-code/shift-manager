// Prisma CLI 設定（Prisma 7 方式：接続URLはここで指定）

import { defineConfig } from "prisma/config";

// .env を読み込む（Node 21+ の標準機能。ファイルが無い環境では無視）
try {
  process.loadEnvFile();
} catch {
  // .env が存在しない場合は環境変数のみで動作
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});

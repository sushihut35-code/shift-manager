# シフト管理

週次シフトを管理するスタンドアロンアプリ。SQLite ファイルDBひとつで動き、外部データベースサーバーを必要としない。

## 機能

- **週次シフトボード**（`/`）: スマホファーストの横スクロールグリッド。スタッフ（行）× 7日（列）、月曜始まり。セルをタップして「なし / 休み / シフト（開始・終了時刻・メモ）」を編集。前週・翌週・今日で週を移動（URL `?week=YYYY-MM-DD` 駆動）。
- **スタッフ管理**（`/staff`）: 追加・編集（名前・表示色・表示順・メモ）、非アクティブ切替、削除（シフトも cascade）。

## 技術スタック

- Next.js 16（App Router / Turbopack）+ React 19 + TypeScript
- Prisma 7（driver adapter 方式: `@prisma/adapter-better-sqlite3`）+ **SQLite**（`prisma/dev.db`）
- Tailwind CSS v4 + shadcn (base-nova / Base UI)
- date-fns（日付は `"YYYY-MM-DD"`・時刻は `"HH:mm"` の**文字列**で統一管理し、タイムゾーン起因の日付ずれを構造的に回避）

## セットアップ

```bash
pnpm install
pnpm prisma db push    # prisma/dev.db にテーブル作成
pnpm seed              # スタッフ4名＋今週の見本シフト
pnpm dev               # http://localhost:3000
```

データベースはファイル（`prisma/dev.db`）のみ。バックアップはファイルをコピーするだけ。初回 `pnpm dev` 時に `next-env.d.ts` と `.next/` が自動生成される。

## 運用メモ

- Prisma 7 では schema に接続URLを書かない。CLI は `prisma.config.ts`、ランタイムは `lib/prisma.ts` の driver adapter が `DATABASE_URL` を参照
- 生成クライアントは `lib/generated/prisma`（gitignore 済み）。`pnpm prisma generate` で再生成
- `prisma/dev.db` は gitignore 済み（データはリポジトリに入らない）

// PWA マニフェスト（ホーム画面追加時にアプリ名・アイコン・全画面起動を定義する）
// 完全静的化に伴い鍵は不要（データは各端末の中にしか無いため）

import type { MetadataRoute } from "next";

// 静的書き出し（output: export）では静的宣言が必要
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "シフト管理",
    short_name: "シフト",
    description: "週次シフトを管理するアプリ",
    start_url: "/shift-manager/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/shift-manager/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

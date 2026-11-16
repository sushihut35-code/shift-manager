// PWA マニフェスト（ホーム画面追加時にアプリ名・アイコン・全画面起動を定義する）
// iOSのホーム追加アプリはSafariとクッキーが別棚になるため、
// start_url に ?key= を埋めて開いた瞬間に自動ログインさせる

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const password = process.env.BASIC_AUTH_PASSWORD;
  return {
    name: "シフト管理",
    short_name: "シフト",
    description: "週次シフトを管理するアプリ",
    start_url: password ? `/?key=${encodeURIComponent(password)}` : "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

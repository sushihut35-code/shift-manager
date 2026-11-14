import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Turbopack がワークスペースの根っこを誤推論するのを防ぐ
  // （ホームディレクトリの古い package-lock.json を検出して
  // 　クライアントJSの配信が壊れる事故があったため明示する）
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;

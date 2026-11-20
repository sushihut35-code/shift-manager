import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // 完全静的書き出し（サーバー不要・スリープしない置き場に置ける）
  output: "export",
  // GitHub Pages は リポジトリ名/ のパスで公開されるため接頭辞を合わせる
  basePath: "/shift-manager",
  trailingSlash: true,
  // Turbopack がワークスペースの根っこを誤推論するのを防ぐ
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;

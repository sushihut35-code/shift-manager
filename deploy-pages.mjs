// GitHub Pages へのデプロイスクリプト（out/ を gh-pages ブランチにpush）
// 使い方: node deploy-pages.mjs

import { execSync } from "node:child_process";
import { rmSync, cpSync, mkdirSync, writeFileSync } from "node:fs";

const REPO_URL = "https://github.com/sushihut35-code/shift-manager.git";
const WORK = ".gh-pages-work";

console.log("out/ を gh-pages ブランチへ配置します...");

// 作業用ディレクトリ掃除→作成
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

// out/ の中身を作業ディレクトリへ複製
cpSync("out", WORK, { recursive: true });

// Jekyll 無効化のおまじない（_next 等のアンダースコア始まりディレクトリが
// GitHub Pages で無視されて 404 になるのを防ぐ）
writeFileSync(`${WORK}/.nojekyll`, "");

// 作業ディレクトリで git 初期化＆orphanコミット＆force push
const git = (cmd) => execSync(`git ${cmd}`, { cwd: WORK, stdio: "pipe" });
git("init -b gh-pages");
git('config user.name "yuta"');
git('config user.email "yuta@users.noreply.github.com"');
git("add -A");
git('commit -m "静的ビルドをGitHub Pagesへデプロイ"');
execSync(`git remote add origin ${REPO_URL}`, { cwd: WORK, stdio: "pipe" });
execSync("git push -f origin gh-pages", { cwd: WORK, stdio: "inherit" });

rmSync(WORK, { recursive: true, force: true });
console.log("gh-pages へ push 完了");

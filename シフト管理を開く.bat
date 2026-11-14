@echo off
rem シフト管理アプリの起動スクリプト（ダブルクリックで実行）
cd /d "%~dp0"
echo シフト管理アプリを起動中です... まもなくブラウザが開きます
rem 5秒待ってからブラウザで開く（サーバー起動を待つ時間）
start "" cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:3000"
call pnpm dev

@echo off
rem シフト管理アプリの起動スクリプト（ダブルクリックで実行）
rem -H 0.0.0.0: 同じWi-Fiのスマホからもアクセス可能にする
rem -p 3100: POSのAPI(3000)と衝突しないポート
cd /d "%~dp0"
echo シフト管理アプリを起動中です... まもなくブラウザが開きます
echo （スマホからは http://192.168.68.56:3100 を開いてください）
rem 5秒待ってからブラウザで開く（サーバー起動を待つ時間）
start "" cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:3100"
call pnpm dev -H 0.0.0.0 -p 3100

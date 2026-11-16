// クッキーログイン認証（Basic認証の代わり。一度のログインで1年記憶）
// BASIC_AUTH_PASSWORD が設定されている場合のみ有効。未設定（ローカル開発等）では素通し。

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isAuthEnabled, isValidToken } from "@/lib/auth";

export function proxy(request: NextRequest) {
  // 未設定（ローカル開発等）では素通し
  if (!isAuthEnabled()) {
    return NextResponse.next();
  }

  // 正しいクッキーを持っていれば通す
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (isValidToken(token)) {
    return NextResponse.next();
  }

  // API には JSON で 401、ページはログインへ誘導
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

// ログイン画面・ログインAPI・静的アセットは鍵の外に出す
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|icon-512.png|manifest.webmanifest|login|api/login).*)",
  ],
};

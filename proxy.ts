// クッキーログイン認証＋URLキー自動解錠
// （ホーム追加アプリはSafariとクッキー棚が別になるiOS仕様のため、
// 　URLに ?key= を含めることで開いた瞬間に自動ログインさせる）
// BASIC_AUTH_PASSWORD が設定されている場合のみ有効。未設定では素通し。

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isAuthEnabled, isValidToken, makeToken } from "@/lib/auth";

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

  // URLキー（?key=）が正しければ、クッキーを発行して通す
  const key = request.nextUrl.searchParams.get("key") ?? "";
  if (key && key === process.env.BASIC_AUTH_PASSWORD) {
    const res = NextResponse.next();
    res.cookies.set(AUTH_COOKIE_NAME, makeToken(key), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1年
      path: "/",
      secure: true,
    });
    return res;
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

// Basic認証（クラウド公開用の鍵。BASIC_AUTH_USER/PASSWORD 両方が設定されている場合のみ有効）

import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;

  // 未設定（ローカル開発等）では素通し
  if (!user || !password) {
    return NextResponse.next();
  }

  const auth = request.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme?.toLowerCase() === "basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf8");
      const idx = decoded.indexOf(":");
      const u = decoded.slice(0, idx);
      const p = decoded.slice(idx + 1);
      if (u === user && p === password) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("認証が必要です", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Shift Manager"' },
  });
}

// 静的アセット（アイコン・マニフェストなど）は鍵の外に出す
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|icon-512.png|manifest.webmanifest).*)",
  ],
};

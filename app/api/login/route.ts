// ログインAPI - POST（パスワード一致でクッキーを1年発行する）

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isAuthEnabled, makeToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";

    if (!isAuthEnabled()) {
      // 未設定なら常に通す（ローカル開発等）
      return NextResponse.json({ success: true });
    }
    if (password !== process.env.BASIC_AUTH_PASSWORD) {
      return NextResponse.json(
        { error: "パスワードが違います" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set(AUTH_COOKIE_NAME, makeToken(password), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1年
      path: "/",
      secure: true,
    });
    return res;
  } catch (error) {
    console.error("ログインエラー:", error);
    return NextResponse.json(
      { error: "ログイン処理に失敗しました" },
      { status: 500 }
    );
  }
}

// クッキーログイン用のトークン計算・検証（Basic認証の代わり）

import { createHash, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "shift_auth";

// パスワードからトークンを錬成（ソルト付きSHA-256）
export const makeToken = (password: string): string =>
  createHash("sha256").update(`shift-manager::${password}`).digest("hex");

// 環境変数のパスワードが未設定かどうか（未設定なら認証なし運用）
export const isAuthEnabled = (): boolean =>
  Boolean(process.env.BASIC_AUTH_PASSWORD);

// リクエストのトークンが正しいか
export const isValidToken = (token: string | undefined): boolean => {
  if (!token || !isAuthEnabled()) return false;
  const expected = makeToken(process.env.BASIC_AUTH_PASSWORD!);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

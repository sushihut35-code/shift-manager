// ログインフォーム（パスワード入力→クッキー発行）

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("パスワードを入力してください");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "ログインに失敗しました");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("ログインに失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 max-w-sm mx-auto"
    >
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50">
          <Lock className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-lg font-bold">シフト管理</h1>
        <p className="text-xs text-gray-500">
          パスワードを入力してください（入力は1年間記憶されます）
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">パスワード</Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "確認中..." : "ログイン"}
      </Button>
    </form>
  );
}

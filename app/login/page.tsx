// ログインページ（パスワード1つ。通れば1年覚える）

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="py-16">
      <LoginForm />
    </div>
  );
}

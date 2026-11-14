// ボトムナビゲーションコンポーネント（シフト表・スタッフの2項目）

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users } from "lucide-react";

const navItems = [
  { href: "/", label: "シフト表", icon: CalendarDays, active: (p: string) => p === "/" },
  { href: "/staff", label: "スタッフ", icon: Users, active: (p: string) => p.startsWith("/staff") },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

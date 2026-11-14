// スタッフ管理コンポーネント（一覧・追加・編集・非アクティブ切替・削除）

"use client";

import { useCallback, useState } from "react";
import { Plus, Pencil, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StaffFormDialog } from "@/components/staff/staff-form-dialog";
import type { StaffDTO } from "@/types";

interface StaffManagerProps {
  initialStaff: StaffDTO[];
}

export function StaffManager({ initialStaff }: StaffManagerProps) {
  const [staff, setStaff] = useState<StaffDTO[]>(initialStaff);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffDTO | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // 一覧を再取得
  const refresh = useCallback(async () => {
    const res = await fetch("/api/staff", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setStaff(data.items);
    }
  }, []);

  // 追加ボタン
  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  // 編集ボタン
  const handleEdit = (s: StaffDTO) => {
    setEditing(s);
    setFormOpen(true);
  };

  // 非アクティブ切替
  const handleToggleActive = async (s: StaffDTO) => {
    setBusyId(s.id);
    try {
      await fetch(`/api/staff/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: s.name,
          displayColor: s.displayColor,
          sortOrder: s.sortOrder,
          memo: s.memo,
          isActive: !s.isActive,
        }),
      });
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  // 削除
  const handleDelete = async (s: StaffDTO) => {
    setBusyId(s.id);
    try {
      await fetch(`/api/staff/${s.id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">スタッフ</h1>
        <Button size="icon" onClick={handleAdd} aria-label="スタッフ追加">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* 一覧 */}
      {staff.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>スタッフが登録されていません</p>
          <p className="text-sm mt-1">右上の＋から追加してください</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {staff.map((s) => (
            <li
              key={s.id}
              className={`bg-white rounded-xl border p-4 space-y-3 ${
                s.isActive ? "border-gray-200" : "border-gray-200 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: s.displayColor }}
                  aria-label={`表示色 ${s.displayColor}`}
                />
                <span className="font-semibold flex-1 truncate">{s.name}</span>
                <Badge variant={s.isActive ? "default" : "secondary"}>
                  {s.isActive ? "在籍" : "非アクティブ"}
                </Badge>
              </div>

              <div className="text-xs text-gray-500">
                表示順: {s.sortOrder}
                {s.memo && <span className="ml-3">メモ: {s.memo}</span>}
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(s)}
                  disabled={busyId === s.id}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  編集
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleToggleActive(s)}
                  disabled={busyId === s.id}
                >
                  <Power className="w-3.5 h-3.5" />
                  {s.isActive ? "非アクティブに" : "在籍に戻す"}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="destructive" size="sm" />
                    }
                    disabled={busyId === s.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    削除
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogMedia>
                        <Trash2 className="text-destructive" />
                      </AlertDialogMedia>
                      <AlertDialogTitle>
                        スタッフを削除しますか？
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        「{s.name}
                        」を削除すると、登録済みのシフトもすべて削除されます。この操作は取り消せません。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleDelete(s)}
                      >
                        削除する
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 追加・編集ダイアログ */}
      <StaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        staff={editing}
        onSaved={refresh}
      />
    </div>
  );
}

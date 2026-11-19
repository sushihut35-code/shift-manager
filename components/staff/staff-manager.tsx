// スタッフ管理コンポーネント（一覧・追加・編集・非アクティブ切替・削除・バックアップ）

"use client";

import { useEffect, useState } from "react";
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
import {
  getStaff,
  saveStaff,
  deleteStaff as dbDeleteStaff,
  exportAll,
  importAll,
  resetAll,
} from "@/lib/local-db";
import type { StaffDTO } from "@/types";

export function StaffManager() {
  const [staff, setStaff] = useState<StaffDTO[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffDTO | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // 端末内データを読み込む（hydration後）
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorageは端末内のみに存在するため、hydration後にクライアント側で読み込むのが安全
    setStaff(getStaff());
  }, []);

  // 一覧を再読み込み
  const refresh = () => {
    setStaff(getStaff());
  };

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
  const handleToggleActive = (s: StaffDTO) => {
    setBusyId(s.id);
    try {
      saveStaff({ ...s, isActive: !s.isActive });
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  // 削除
  const handleDelete = (s: StaffDTO) => {
    setBusyId(s.id);
    try {
      dbDeleteStaff(s.id);
      refresh();
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

      {/* バックアップ（端末内保存の生命線） */}
      <BackupSection onRestored={refresh} />
    </div>
  );
}

// バックアップ（書き出し/読み込み/初期化）
function BackupSection({ onRestored }: { onRestored: () => void }) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  const handleExport = async () => {
    const data = exportAll();
    setText(data);
    try {
      await navigator.clipboard.writeText(data);
      setMsg("書き出しました（コピーも済ませてあります）");
    } catch {
      setMsg("書き出しました。下の枠の全文をコピーして保存してください");
    }
  };

  const handleImport = () => {
    try {
      importAll(text);
      onRestored();
      setMsg("読み込みました");
    } catch {
      setMsg("読み込みに失敗しました（データ形式が違います）");
    }
  };

  const handleReset = () => {
    if (window.confirm("端末のデータを消して、最初のデータに戻します。よろしいですか？")) {
      resetAll();
      onRestored();
      setMsg("初期データに戻しました");
    }
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div>
        <h2 className="font-semibold text-sm">データのバックアップ</h2>
        <p className="text-[11px] text-gray-500 mt-0.5">
          この端末の中だけに保存されています。機種変更の前などに「書き出し」で全文をメモなどに保存してください
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          書き出し
        </Button>
        <Button variant="outline" size="sm" onClick={handleImport} disabled={!text.trim()}>
          読み込み
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          最初のデータに戻す
        </Button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="「書き出し」でここにデータが出ます。復元するときは保存しておいた全文をここに貼り付けて「読み込み」"
        className="w-full text-[10px] font-mono rounded-lg border border-gray-200 p-2 bg-gray-50"
      />
      {msg && <p className="text-xs text-gray-600">{msg}</p>}
    </section>
  );
}

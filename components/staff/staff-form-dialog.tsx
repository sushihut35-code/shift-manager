// スタッフ登録・編集ダイアログ

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createStaff, saveStaff } from "@/lib/local-db";
import type { StaffDTO } from "@/types";

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: StaffDTO | null; // undefined/null なら新規登録
  onSaved: () => void;
}

export function StaffFormDialog({
  open,
  onOpenChange,
  staff,
  onSaved,
}: StaffFormDialogProps) {
  const isEdit = Boolean(staff);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* open ごとに再マウントさせてフォームを初期化 */}
      {open && (
        <StaffFormBody
          key={staff?.id ?? "new"}
          isEdit={isEdit}
          staff={staff ?? null}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      )}
    </Dialog>
  );
}

interface StaffFormBodyProps {
  isEdit: boolean;
  staff: StaffDTO | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// フォーム本体（マウント時に props から初期化）
function StaffFormBody({
  isEdit,
  staff,
  onOpenChange,
  onSaved,
}: StaffFormBodyProps) {
  const [name, setName] = useState(staff?.name ?? "");
  const [displayColor, setDisplayColor] = useState(
    staff?.displayColor ?? "#6B7280"
  );
  const [sortOrder, setSortOrder] = useState(staff?.sortOrder ?? 0);
  const [memo, setMemo] = useState(staff?.memo ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // 保存（新規登録 or 更新）
  const handleSave = async () => {
    setError("");

    // クライアント側バリデーション（サーバーと同じ規則）
    if (!name.trim()) {
      setError("名前は必須です");
      return;
    }
    if (name.trim().length > 50) {
      setError("名前は50文字以内で入力してください");
      return;
    }
    if (memo.trim().length > 200) {
      setError("メモは200文字以内で入力してください");
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        displayColor,
        sortOrder,
        memo: memo.trim() || undefined,
      };
      if (isEdit && staff) {
        saveStaff({ ...staff, ...data });
      } else {
        createStaff(data);
      }
      onSaved();
      onOpenChange(false);
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? "スタッフ編集" : "スタッフ追加"}</DialogTitle>
        <DialogDescription>
          シフト表に表示するスタッフの情報を入力してください
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="staff-name">名前</Label>
          <Input
            id="staff-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="田中太郎"
            maxLength={50}
          />
        </div>

        <div className="flex gap-4">
          <div className="space-y-2 flex-1">
            <Label htmlFor="staff-color">表示色</Label>
            <input
              id="staff-color"
              type="color"
              value={displayColor}
              onChange={(e) => setDisplayColor(e.target.value)}
              className="h-8 w-16 cursor-pointer rounded border border-gray-200 bg-white p-1"
            />
          </div>
          <div className="space-y-2 w-28">
            <Label htmlFor="staff-sort">表示順</Label>
            <Input
              id="staff-sort"
              type="number"
              min={0}
              max={999}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="staff-memo">メモ</Label>
          <Textarea
            id="staff-memo"
            rows={2}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="役職・備考など（任意）"
            maxLength={200}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={saving}
        >
          キャンセル
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

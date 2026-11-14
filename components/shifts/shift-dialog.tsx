// シフト編集ダイアログ（なし/休み/シフトの3状態エディタ）

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
import { WEEKDAY_LABELS, fromISO } from "@/lib/date";
import { format } from "date-fns";
import type { ShiftDTO, StaffDTO } from "@/types";

// セルの編集状態
type ShiftKind = "none" | "dayOff" | "shift";

interface ShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffDTO | null;
  date: string | null;
  shift?: ShiftDTO | null; // 既存シフト（無ければ null）
  onSaved: () => void;
}

// 既存シフトから初期状態を得る
const initialKind = (shift?: ShiftDTO | null): ShiftKind => {
  if (!shift) return "none";
  if (shift.isDayOff) return "dayOff";
  return "shift";
};

export function ShiftDialog({
  open,
  onOpenChange,
  staff,
  date,
  shift,
  onSaved,
}: ShiftDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* open ごとに再マウントさせてフォームを初期化 */}
      {open && staff && date && (
        <ShiftFormBody
          key={`${staff.id}:${date}`}
          staff={staff}
          date={date}
          shift={shift ?? null}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      )}
    </Dialog>
  );
}

interface ShiftFormBodyProps {
  staff: StaffDTO;
  date: string;
  shift: ShiftDTO | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// フォーム本体（マウント時に props から初期化）
function ShiftFormBody({
  staff,
  date,
  shift,
  onOpenChange,
  onSaved,
}: ShiftFormBodyProps) {
  const [kind, setKind] = useState<ShiftKind>(initialKind(shift));
  const [startTime, setStartTime] = useState(shift?.startTime ?? "");
  const [endTime, setEndTime] = useState(shift?.endTime ?? "");
  const [memo, setMemo] = useState(shift?.memo ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const dayNum = fromISO(date).getDay();
  const weekdayLabel = WEEKDAY_LABELS[dayNum === 0 ? 6 : dayNum - 1];

  // 保存
  const handleSave = async () => {
    setError("");

    // クライアント側バリデーション（サーバーと同じ規則）
    if (kind === "shift") {
      if (!startTime || !endTime) {
        setError("開始・終了時刻を入力してください");
        return;
      }
      if (startTime >= endTime) {
        setError("終了時刻は開始時刻より後になるように指定してください");
        return;
      }
    }
    if (memo.trim().length > 200) {
      setError("メモは200文字以内で入力してください");
      return;
    }

    setSaving(true);
    try {
      // なし＋既存行 → 削除
      if (kind === "none") {
        if (shift) {
          const res = await fetch(`/api/shifts/${shift.id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            setError(data?.error ?? "削除に失敗しました");
            return;
          }
        }
        onSaved();
        onOpenChange(false);
        return;
      }

      // 休み / シフト → upsert
      const res = await fetch("/api/shifts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: staff.id,
          date,
          isDayOff: kind === "dayOff",
          startTime: kind === "shift" ? startTime : undefined,
          endTime: kind === "shift" ? endTime : undefined,
          memo: memo.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "保存に失敗しました");
        return;
      }
      onSaved();
      onOpenChange(false);
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const kindButtons: { value: ShiftKind; label: string }[] = [
    { value: "none", label: "なし" },
    { value: "dayOff", label: "休み" },
    { value: "shift", label: "シフト" },
  ];

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {staff.name} ・ {format(fromISO(date), "M月d日")}（{weekdayLabel}）
        </DialogTitle>
        <DialogDescription>シフトの状態を選択してください</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* 3状態セレクタ */}
        <div
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label="シフト状態"
        >
          {kindButtons.map((b) => (
            <Button
              key={b.value}
              variant={kind === b.value ? "default" : "outline"}
              onClick={() => setKind(b.value)}
              aria-pressed={kind === b.value}
            >
              {b.label}
            </Button>
          ))}
        </div>

        {/* シフト時のみ時刻入力 */}
        {kind === "shift" && (
          <div className="flex items-end gap-2">
            <div className="space-y-2 flex-1">
              <Label htmlFor="shift-start">開始</Label>
              <Input
                id="shift-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <span className="pb-2 text-gray-400">〜</span>
            <div className="space-y-2 flex-1">
              <Label htmlFor="shift-end">終了</Label>
              <Input
                id="shift-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="shift-memo">メモ</Label>
          <Textarea
            id="shift-memo"
            rows={2}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="午前のみ・代打など（任意）"
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

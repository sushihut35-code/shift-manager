// シフト編集ダイアログ（なし/休み/シフトの3状態。シフトは最大2時間帯）

"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WEEKDAY_LABELS, fromISO, isHHmmStep30 } from "@/lib/date";
import { replaceShifts } from "@/lib/local-db";
import { format } from "date-fns";
import type { ShiftDTO, StaffDTO, ShiftSlot } from "@/types";

// セルの編集状態
type ShiftKind = "none" | "dayOff" | "shift";

interface ShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffDTO | null;
  date: string | null;
  shifts?: ShiftDTO[] | null; // その日の既存シフト行（無ければ null）
  onSaved: () => void;
}

// 既存シフト行から初期状態を得る
const initialKind = (shifts?: ShiftDTO[] | null): ShiftKind => {
  if (!shifts || shifts.length === 0) return "none";
  if (shifts.some((s) => s.isDayOff)) return "dayOff";
  return "shift";
};

// 1時間帯の開始・終了入力
function SlotInputs({
  label,
  idPrefix,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: {
  label: string;
  idPrefix: string;
  startTime: string;
  endTime: string;
  onStartTimeChange: (v: string) => void;
  onEndTimeChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-end gap-2">
        <div className="space-y-1 flex-1">
          <Label htmlFor={`${idPrefix}-start`} className="text-xs text-gray-500">
            開始
          </Label>
          <TimeSelect
            id={`${idPrefix}-start`}
            value={startTime}
            onChange={onStartTimeChange}
          />
        </div>
        <span className="pb-2 text-gray-400">〜</span>
        <div className="space-y-1 flex-1">
          <Label htmlFor={`${idPrefix}-end`} className="text-xs text-gray-500">
            終了（未定可）
          </Label>
          <div className="flex gap-1">
            <div className="flex-1">
              <TimeSelect
                id={`${idPrefix}-end`}
                value={endTime}
                onChange={onEndTimeChange}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEndTimeChange("")}
              title="終了を未定に戻す"
            >
              未定
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 30分単位の時刻選択器（時0〜23＋分00/30の二段プルダウン）
// ※ iOS Safari は time入力の step 指定を無視するため、独自に選択肢を絞る
// 「時」を選んだ時点で分は00として確定し、分を後から変えられる
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "30"];

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function TimeSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string; // "" or "HH:mm"
  onChange: (v: string) => void;
}) {
  // ローカルに時・分を保持し、両方揃った時だけ親へ確定値を渡す
  const [hour, setHour] = useState(value ? value.slice(0, 2) : "");
  const [minute, setMinute] = useState(
    value ? value.slice(3, 5) : "00"
  );

  // 外部から値が変わったら（未定ボタン等）ローカルも同期
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 親の値変更（未定ボタン等）に追従するための正当な同期処理
    setHour(value ? value.slice(0, 2) : "");
    setMinute(value ? value.slice(3, 5) : "00");
  }, [value]);

  const handleHour = (h: string) => {
    if (!h) {
      // 「時」を未選択に戻したら値を空にする
      setHour("");
      onChange("");
      return;
    }
    setHour(h);
    onChange(`${h}:${minute}`);
  };

  const handleMinute = (m: string) => {
    setMinute(m);
    if (hour) {
      onChange(`${hour}:${m}`);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <select
        id={id}
        className={selectClass}
        value={hour}
        onChange={(e) => handleHour(e.target.value)}
        aria-label="時"
      >
        <option value="">時</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-gray-400">:</span>
      <select
        className={selectClass}
        value={minute}
        onChange={(e) => handleMinute(e.target.value)}
        aria-label="分"
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ShiftDialog({
  open,
  onOpenChange,
  staff,
  date,
  shifts,
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
          shifts={shifts ?? null}
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
  shifts: ShiftDTO[] | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// フォーム本体（マウント時に props から初期化）
function ShiftFormBody({
  staff,
  date,
  shifts,
  onOpenChange,
  onSaved,
}: ShiftFormBodyProps) {
  // 既存の時間帯シフト（時刻順に並べ、1つ目/2つ目へ初期値として使う）
  const existingSlots = (shifts ?? [])
    .filter((s) => !s.isDayOff && s.startTime && s.endTime)
    .sort((a, b) => (a.startTime! < b.startTime! ? -1 : 1));

  const [kind, setKind] = useState<ShiftKind>(initialKind(shifts));
  const [slot1Start, setSlot1Start] = useState(existingSlots[0]?.startTime ?? "");
  const [slot1End, setSlot1End] = useState(existingSlots[0]?.endTime ?? "");
  const [slot2Start, setSlot2Start] = useState(existingSlots[1]?.startTime ?? "");
  const [slot2End, setSlot2End] = useState(existingSlots[1]?.endTime ?? "");
  const [memo, setMemo] = useState(shifts?.[0]?.memo ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const dayNum = fromISO(date).getDay();
  const weekdayLabel = WEEKDAY_LABELS[dayNum === 0 ? 6 : dayNum - 1];

  // 入力からスロット配列を組み立て（クライアント側検証つき）
  // 終了時刻は空欄可（終了未定のシフト）。時刻は30分単位のみ
  const buildSlots = (): { slots?: ShiftSlot[]; error?: string } => {
    if (!slot1Start) {
      return { error: "1つ目の開始時刻を入力してください" };
    }
    if (!isHHmmStep30(slot1Start)) {
      return { error: "開始時刻は30分単位（:00か:30）で指定してください" };
    }
    if (slot1End) {
      if (!isHHmmStep30(slot1End)) {
        return { error: "終了時刻は30分単位（:00か:30）で指定してください" };
      }
      if (slot1Start >= slot1End) {
        return {
          error: "終了時刻は開始時刻より後になるように指定してください",
        };
      }
    }
    const slots: ShiftSlot[] = [
      { startTime: slot1Start, endTime: slot1End || null },
    ];
    const slot2Filled = slot2Start !== "" || slot2End !== "";
    if (slot2Filled) {
      if (!slot2Start) {
        return { error: "2つ目は開始時刻を入力してください" };
      }
      if (!isHHmmStep30(slot2Start)) {
        return { error: "2つ目の開始時刻は30分単位で指定してください" };
      }
      if (slot2End) {
        if (!isHHmmStep30(slot2End)) {
          return { error: "2つ目の終了時刻は30分単位で指定してください" };
        }
        if (slot2Start >= slot2End) {
          return {
            error: "2つ目も終了時刻は開始時刻より後にしてください",
          };
        }
      }
      // 時刻順に並べて重複チェック（両方の終了が分かっている場合のみ）
      const sorted: ShiftSlot[] = [
        { startTime: slot1Start, endTime: slot1End || null },
        { startTime: slot2Start, endTime: slot2End || null },
      ].sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
      if (
        sorted[0].endTime !== null &&
        sorted[1].endTime !== null &&
        sorted[0].endTime! > sorted[1].startTime
      ) {
        return { error: "2つの時間帯が重ならないようにしてください" };
      }
      slots.length = 0;
      slots.push(...sorted);
    }
    return { slots };
  };

  // 保存
  const handleSave = async () => {
    setError("");

    // クライアント側バリデーション（サーバーと同じ規則）
    let slots: ShiftSlot[] | undefined;
    if (kind === "shift") {
      const b = buildSlots();
      if (b.error) {
        setError(b.error);
        return;
      }
      slots = b.slots;
    }
    if (memo.trim().length > 200) {
      setError("メモは200文字以内で入力してください");
      return;
    }

    setSaving(true);
    try {
      const memoValue = memo.trim() || undefined;

      // なし → 全削除
      if (kind === "none") {
        if (shifts && shifts.length > 0) {
          replaceShifts(staff.id, date, []);
        }
        onSaved();
        onOpenChange(false);
        return;
      }

      // 休み → 休み行1件 / シフト → 時間帯の行
      const rows =
        kind === "dayOff"
          ? [
              {
                staffId: staff.id,
                date,
                isDayOff: true,
                memo: memoValue,
              },
            ]
          : slots!.map((slot) => ({
              staffId: staff.id,
              date,
              startTime: slot.startTime,
              endTime: slot.endTime ?? undefined,
              isDayOff: false,
              memo: memoValue,
            }));
      replaceShifts(staff.id, date, rows);
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

        {/* シフト時のみ時刻入力（最大2時間帯） */}
        {kind === "shift" && (
          <div className="space-y-3">
            <SlotInputs
              label="1つ目の時間帯"
              idPrefix="slot1"
              startTime={slot1Start}
              endTime={slot1End}
              onStartTimeChange={setSlot1Start}
              onEndTimeChange={setSlot1End}
            />
            <SlotInputs
              label="2つ目の時間帯（休憩を挟むなど・空欄で未使用）"
              idPrefix="slot2"
              startTime={slot2Start}
              endTime={slot2End}
              onStartTimeChange={setSlot2Start}
              onEndTimeChange={setSlot2End}
            />
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

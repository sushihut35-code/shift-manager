// シフト管理アプリ 型定義

// スタッフDTO（APIレスポンス・画面表示用）
export interface StaffDTO {
  id: string;
  name: string;
  displayColor: string;
  sortOrder: number;
  isActive: boolean;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

// スタッフ登録・編集フォームの値
export interface StaffFormData {
  name: string;
  displayColor: string;
  sortOrder: number;
  memo?: string;
}

// シフトDTO（date は "YYYY-MM-DD"、時刻は "HH:mm"）
export interface ShiftDTO {
  id: string;
  staffId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isDayOff: boolean;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

// シフト upsert リクエストの値
export interface ShiftUpsertData {
  staffId: string;
  date: string;
  isDayOff?: boolean;
  startTime?: string;
  endTime?: string;
  memo?: string;
}

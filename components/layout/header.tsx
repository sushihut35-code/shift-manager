// ヘッダーコンポーネント（タイトルのみのシンプルな固定ヘッダー）

interface HeaderProps {
  title?: string;
}

export function Header({ title = "シフト管理" }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-center h-14 px-4 max-w-md mx-auto">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </header>
  );
}

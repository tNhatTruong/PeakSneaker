import { ChevronDown, SlidersHorizontal } from 'lucide-react';

interface AdminFilterHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
  activeCount?: number;
  onReset?: () => void;
  title?: string;
}

export default function AdminFilterHeader({
  isOpen,
  onToggle,
  activeCount = 0,
  onReset,
  title = 'Bộ lọc & Tìm kiếm',
}: AdminFilterHeaderProps) {
  return (
    <header className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-100 px-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex min-w-0 flex-1 items-center gap-2 py-3 text-left"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-blue-600" />
        <span className="truncate text-sm font-bold text-slate-800">{title}</span>
        {activeCount > 0 && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[11px] font-black leading-4 text-blue-700">
            {activeCount}
          </span>
        )}
      </button>

      <div className="flex shrink-0 items-center gap-2">
        {activeCount > 0 && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-md px-2 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            Đặt lại
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Thu gọn bộ lọc' : 'Mở bộ lọc'}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </header>
  );
}

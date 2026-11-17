import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  visibleCount: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

export default function AdminPagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  visibleCount,
  itemLabel,
  onPageChange,
  disabled = false,
  className = "",
}: AdminPaginationProps) {
  const hasItems = totalElements > 0 && visibleCount > 0;
  const firstItem = hasItems ? page * pageSize + 1 : 0;
  const lastItem = hasItems ? Math.min(page * pageSize + visibleCount, totalElements) : 0;

  return (
    <footer
      className={`flex min-h-16 flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p>
        Hiển thị <strong className="font-semibold text-slate-700">{firstItem}-{lastItem}</strong> trong{" "}
        <strong className="font-semibold text-slate-700">{totalElements}</strong> {itemLabel}
      </p>

      <nav className="flex items-center gap-2" aria-label={`Phân trang ${itemLabel}`}>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 0}
          className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Trước</span>
        </button>

        <span className="min-w-16 text-center font-bold text-slate-900">
          {totalPages > 0 ? page + 1 : 0} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || totalPages === 0 || page >= totalPages - 1}
          className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
          aria-label="Trang sau"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight size={16} />
        </button>
      </nav>
    </footer>
  );
}

import type { ReactNode } from "react";

interface AdminDetailPanelProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function AdminDetailPanel({ children, className = "", ariaLabel }: AdminDetailPanelProps) {
  return (
    <aside
      aria-label={ariaLabel}
      className={`min-h-[420px] min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm 2xl:sticky 2xl:-top-5 2xl:max-h-[calc(100dvh-5rem)] 2xl:overflow-y-auto ${className}`}
    >
      {children}
    </aside>
  );
}

interface AdminDetailEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  items?: string[];
}

export function AdminDetailEmptyState({ icon, title, description, items = [] }: AdminDetailEmptyStateProps) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
        {icon}
      </div>
      <h2 className="mt-7 text-base font-black text-slate-950">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">{description}</p>
      {items.length > 0 && (
        <ul className="mt-6 w-full max-w-xs space-y-3 border-t border-slate-100 pt-5 text-left">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-xs font-semibold leading-5 text-slate-500">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

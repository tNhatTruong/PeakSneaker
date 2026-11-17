import type { ReactNode } from "react";

interface AdminPanelProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}

export default function AdminPanel({
  title,
  description,
  action,
  children,
  className = "",
  contentClassName = "p-4",
  headerClassName = "",
}: AdminPanelProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {hasHeader && (
        <header
          className={`flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${headerClassName}`}
        >
          <div className="min-w-0">
            {title && <h2 className="text-sm font-extrabold tracking-tight text-slate-950">{title}</h2>}
            {description && <div className="mt-0.5 text-xs leading-5 text-slate-500">{description}</div>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

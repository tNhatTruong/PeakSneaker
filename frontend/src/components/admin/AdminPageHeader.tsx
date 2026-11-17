import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export default function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-black tracking-[-0.035em] text-slate-950 sm:text-2xl">{title}</h1>
        {description && <div className="mt-0.5 max-w-3xl text-xs leading-5 text-slate-500 sm:text-sm">{description}</div>}
      </div>
      {actions && <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div>}
    </header>
  );
}

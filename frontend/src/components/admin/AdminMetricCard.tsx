import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type AdminMetricTone = "emerald" | "blue" | "violet" | "orange" | "red" | "slate";

interface AdminMetricCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: AdminMetricTone;
  change?: number;
  helper?: ReactNode;
  className?: string;
  positiveIsGood?: boolean;
}

const TONE_CLASSES: Record<AdminMetricTone, string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  orange: "bg-orange-50 text-orange-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-700",
};

export default function AdminMetricCard({
  label,
  value,
  icon: Icon,
  tone = "slate",
  change,
  helper,
  className = "",
  positiveIsGood = true,
}: AdminMetricCardProps) {
  const isPositive = (change ?? 0) >= 0;
  const isFavorable = positiveIsGood ? isPositive : !isPositive;

  return (
    <article className={`flex min-w-0 flex-col bg-white px-3.5 py-3 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[10px] font-bold uppercase leading-4 tracking-[0.06em] text-slate-500">
          {label}
        </p>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${TONE_CLASSES[tone]}`}>
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </span>
      </div>
      <p className="mt-2 truncate text-xl font-black tracking-[-0.04em] text-slate-950" title={typeof value === "string" ? value : undefined}>
        {value}
      </p>
      {(change !== undefined || helper) && (
        <div className="mt-auto flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-[10px]">
          {change !== undefined && (
            <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-extrabold ${
              isFavorable ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? "+" : ""}{change}%
            </span>
          )}
          {helper && <span className="leading-4 text-slate-400">{helper}</span>}
        </div>
      )}
    </article>
  );
}

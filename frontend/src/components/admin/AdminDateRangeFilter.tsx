import { CalendarDays } from "lucide-react";
import {
  createAdminDateRange,
  formatAdminDateInput,
  getAdminDateRangeError,
  type AdminDatePreset,
  type AdminDateRangeValue,
} from "../../utils/adminDateRange";

interface AdminDateRangeFilterProps {
  value: AdminDateRangeValue;
  onChange: (value: AdminDateRangeValue) => void;
  title?: string;
  description?: string;
  allowAll?: boolean;
  maxRangeDays?: number;
  className?: string;
  compact?: boolean;
  variant?: "standard" | "toolbar";
  showPresets?: boolean;
}

const DATE_PRESETS: Array<{ key: AdminDatePreset; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "today", label: "Hôm nay" },
  { key: "sevenDays", label: "7 ngày" },
  { key: "thirtyDays", label: "30 ngày" },
  { key: "year", label: "Năm nay" },
  { key: "custom", label: "Tùy chọn" },
];

export default function AdminDateRangeFilter({
  value,
  onChange,
  title = "Thời gian",
  description = "Mặc định hiển thị toàn bộ dữ liệu.",
  allowAll = true,
  maxRangeDays,
  className = "",
  compact = false,
  variant = "standard",
  showPresets = true,
}: AdminDateRangeFilterProps) {
  const error = getAdminDateRangeError(value, maxRangeDays);
  const maxDate = formatAdminDateInput(new Date());
  const presets = allowAll ? DATE_PRESETS : DATE_PRESETS.filter((preset) => preset.key !== "all");

  const handlePresetChange = (preset: AdminDatePreset) => {
    if (preset === "custom") {
      onChange({ ...value, preset });
      return;
    }
    onChange(createAdminDateRange(preset));
  };

  if (variant === "toolbar") {
    return (
      <section className={className} aria-label={title}>
        <div className={`grid min-w-0 items-end gap-2 ${showPresets ? "lg:grid-cols-[minmax(280px,1.3fr)_minmax(145px,0.65fr)_minmax(145px,0.65fr)]" : "sm:grid-cols-2"}`}>
          {showPresets && <div className="min-w-0">
            <span className="sr-only">Chọn nhanh {title.toLowerCase()}</span>
            <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5" role="group" aria-label={`Chọn nhanh ${title.toLowerCase()}`}>
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handlePresetChange(preset.key)}
                  aria-pressed={value.preset === preset.key}
                  className={`h-11 shrink-0 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                    value.preset === preset.key
                      ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>}

          <label>
            <span className="sr-only">Từ ngày</span>
            <input
              type="date"
              value={value.from}
              max={value.to || maxDate}
              onChange={(event) => onChange({ ...value, preset: "custom", from: event.target.value })}
              aria-label={`${title}: từ ngày`}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label>
            <span className="sr-only">Đến ngày</span>
            <input
              type="date"
              value={value.to}
              min={value.from || undefined}
              max={maxDate}
              onChange={(event) => onChange({ ...value, preset: "custom", to: event.target.value })}
              aria-label={`${title}: đến ngày`}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-red-600" role="alert">{error}</p>}
      </section>
    );
  }

  return (
    <section className={`${compact ? "space-y-3" : "space-y-4"} ${className}`} aria-label={title}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            <CalendarDays className="h-3.5 w-3.5" /> {title}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label={`Chọn nhanh ${title.toLowerCase()}`}>
          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePresetChange(preset.key)}
              aria-pressed={value.preset === preset.key}
              className={`rounded-lg border text-xs font-semibold transition-colors ${compact ? "px-3 py-1.5" : "px-3.5 py-2"} ${
                value.preset === preset.key
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Từ ngày</span>
          <input
            type="date"
            value={value.from}
            max={value.to || maxDate}
            onChange={(event) => onChange({ ...value, preset: "custom", from: event.target.value })}
            className={`${compact ? "h-10" : "h-12"} w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100`}
          />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Đến ngày</span>
          <input
            type="date"
            value={value.to}
            min={value.from || undefined}
            max={maxDate}
            onChange={(event) => onChange({ ...value, preset: "custom", to: event.target.value })}
            className={`${compact ? "h-10" : "h-12"} w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100`}
          />
        </label>
      </div>

      {error && <p className="text-xs font-semibold text-red-600" role="alert">{error}</p>}
    </section>
  );
}

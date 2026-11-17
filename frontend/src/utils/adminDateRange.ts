export type AdminDatePreset = "all" | "today" | "sevenDays" | "thirtyDays" | "year" | "custom";

export interface AdminDateRangeValue {
  preset: AdminDatePreset;
  from: string;
  to: string;
}

export const formatAdminDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const createAdminDateRange = (preset: AdminDatePreset): AdminDateRangeValue => {
  if (preset === "all" || preset === "custom") {
    return { preset, from: "", to: "" };
  }

  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (preset === "sevenDays") {
    from.setDate(from.getDate() - 6);
  } else if (preset === "thirtyDays") {
    from.setDate(from.getDate() - 29);
  } else if (preset === "year") {
    from.setMonth(0, 1);
  }

  return {
    preset,
    from: formatAdminDateInput(from),
    to: formatAdminDateInput(today),
  };
};

export const getAdminDateRangeError = (
  value: AdminDateRangeValue,
  maxRangeDays?: number,
): string | null => {
  if (value.from && value.to && value.from > value.to) {
    return "Ngày bắt đầu không được sau ngày kết thúc.";
  }

  if (maxRangeDays && value.from && value.to) {
    const duration = new Date(`${value.to}T00:00:00`).getTime()
      - new Date(`${value.from}T00:00:00`).getTime();
    const dayCount = Math.floor(duration / 86_400_000) + 1;
    if (dayCount > maxRangeDays) {
      return `Khoảng thời gian tối đa là ${maxRangeDays} ngày.`;
    }
  }

  return null;
};

export const getAdminDateRangeLabel = (value: AdminDateRangeValue): string => {
  if (value.preset === "all") return "Toàn bộ thời gian";
  if (value.preset === "today") return "Hôm nay";
  if (value.preset === "sevenDays") return "7 ngày gần nhất";
  if (value.preset === "thirtyDays") return "30 ngày gần nhất";
  if (value.preset === "year") return `Năm ${new Date().getFullYear()}`;
  if (!value.from && !value.to) return "Khoảng tùy chọn";
  return `${value.from || "Bắt đầu"} – ${value.to || "Hiện tại"}`;
};

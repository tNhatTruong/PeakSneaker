import {
  Ticket,
  Copy,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Calendar,
  Percent,
  Truck,
  LayoutGrid,
  ShoppingBag,
  Tag,
  ShieldCheck,
  X,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { VoucherService, type VoucherResponse } from "../../services/voucherService";

type FilterType = "all" | "PERCENTAGE" | "FIXED_AMOUNT" | "FREESHIP";
type SortOption = "best" | "highest_discount" | "expiring_soon" | "newest";

const FILTER_TABS: { id: FilterType; label: string; icon: typeof LayoutGrid }[] = [
  { id: "all", label: "Tất cả", icon: LayoutGrid },
  { id: "PERCENTAGE", label: "Giảm theo %", icon: Percent },
  { id: "FIXED_AMOUNT", label: "Giảm tiền mặt", icon: Ticket },
  { id: "FREESHIP", label: "Miễn phí vận chuyển", icon: Truck },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Không giới hạn";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const isFreeshipVoucher = (v: VoucherResponse) => {
  const codeUpper = v.code.toUpperCase();
  const nameLower = (v.name || "").toLowerCase();
  const descLower = (v.description || "").toLowerCase();
  return (
    codeUpper.includes("SHIP") ||
    nameLower.includes("vận chuyển") ||
    nameLower.includes("freeship") ||
    descLower.includes("vận chuyển") ||
    descLower.includes("freeship") ||
    (v.discountType === "FIXED_AMOUNT" && v.discountValue <= 50000 && v.minOrderAmount === 0)
  );
};

const getVoucherStyle = (v: VoucherResponse) => {
  if (isFreeshipVoucher(v)) {
    return {
      type: "FREESHIP" as const,
      badgeText: "FREESHIP",
      badgeSub: "MIỄN PHÍ VẬN CHUYỂN",
      bgClass: "bg-amber-500 text-white",
      icon: Truck,
      displayTitle: "FREESHIP TOÀN QUỐC",
    };
  }

  if (v.discountType === "PERCENTAGE") {
    return {
      type: "PERCENTAGE" as const,
      badgeText: `${Math.round(v.discountValue)}%`,
      badgeSub: "GIẢM THEO %",
      bgClass: "bg-red-600 text-white",
      icon: Ticket,
      displayTitle: `GIẢM ${Math.round(v.discountValue)}%`,
    };
  }

  const kValue =
    v.discountValue >= 1000000
      ? `${(v.discountValue / 1000000).toFixed(1).replace(".0", "")}M`
      : `${Math.round(v.discountValue / 1000)}K`;

  return {
    type: "FIXED_AMOUNT" as const,
    badgeText: kValue,
    badgeSub: "GIẢM TIỀN MẶT",
    bgClass: "bg-zinc-950 text-white",
    icon: Ticket,
    displayTitle: `GIẢM ${formatCurrency(v.discountValue)}`,
  };
};

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("best");
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        const response = await VoucherService.getVouchers(0, 100);
        const now = Date.now();
        const validVouchers = (response.items || []).filter((voucher) => {
          const started = !voucher.startAt || new Date(voucher.startAt).getTime() <= now;
          const unexpired = !voucher.expireAt || new Date(voucher.expireAt).getTime() >= now;
          const available = !voucher.usageLimit || voucher.usedCount < voucher.usageLimit;
          return voucher.isActive && started && unexpired && available;
        });
        setVouchers(validVouchers);
      } catch (error) {
        console.error("Lỗi khi tải voucher:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success(`Đã sao chép mã ${code}! Nhập mã tại trang Thanh toán để nhận ưu đãi.`);
    setTimeout(() => setCopied(null), 2500);
  };

  const handleClaimCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      toast.error("Vui lòng nhập mã khuyến mãi");
      return;
    }

    const matched = vouchers.find((v) => v.code.toUpperCase() === code);
    if (matched) {
      navigator.clipboard.writeText(matched.code);
      setCopied(matched.code);
      toast.success(`Đã sao chép mã ${matched.code}! Nhập mã này tại trang Thanh toán.`);
      setPromoInput("");
      setTimeout(() => setCopied(null), 2500);
      return;
    }

    try {
      const checkRes = await VoucherService.checkVoucher({ code, subtotal: 1000000 });
      if (checkRes.isValid) {
        navigator.clipboard.writeText(code);
        setCopied(code);
        toast.success(`Mã ${code} hợp lệ và đã được sao chép vào bộ nhớ tạm!`);
        setPromoInput("");
        setTimeout(() => setCopied(null), 2500);
      } else {
        toast.error(checkRes.message || "Mã khuyến mãi không hợp lệ hoặc đã hết hạn.");
      }
    } catch {
      toast.error("Mã khuyến mãi không tồn tại hoặc đã hết hạn.");
    }
  };

  const displayedVouchers = useMemo(() => {
    let list = vouchers.filter((v) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "FREESHIP") return isFreeshipVoucher(v);
      if (activeFilter === "PERCENTAGE") return v.discountType === "PERCENTAGE" && !isFreeshipVoucher(v);
      if (activeFilter === "FIXED_AMOUNT") return v.discountType === "FIXED_AMOUNT" && !isFreeshipVoucher(v);
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "highest_discount") {
        return (b.discountValue || 0) - (a.discountValue || 0);
      }
      if (sortBy === "expiring_soon") {
        const timeA = a.expireAt ? new Date(a.expireAt).getTime() : Infinity;
        const timeB = b.expireAt ? new Date(b.expireAt).getTime() : Infinity;
        return timeA - timeB;
      }
      if (sortBy === "newest") {
        const timeA = a.startAt ? new Date(a.startAt).getTime() : 0;
        const timeB = b.startAt ? new Date(b.startAt).getTime() : 0;
        return timeB - timeA;
      }
      // 'best' - prioritize mockup items then highest value
      return (b.discountValue || 0) - (a.discountValue || 0);
    });

    return list;
  }, [vouchers, activeFilter, sortBy]);

  const scrollToVouchers = () => {
    document.getElementById("vouchers-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 font-sans text-zinc-900">
      {/* 1. HERO BANNER (matching mockup dark theme + floating sneaker) */}
      <section className="relative overflow-hidden bg-zinc-950 pt-10 pb-20 sm:pt-14 sm:pb-24 text-white">
        {/* Ambient atmospheric glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-red-600/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/4 h-[450px] w-[450px] rounded-full bg-red-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Left Content */}
            <div className="space-y-5 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="tracking-wide">ƯU ĐÃI ĐẶC BIỆT DÀNH CHO BẠN</span>
              </div>

              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                ƯU ĐÃI ĐANG CHỜ BẠN
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Chọn ưu đãi phù hợp và tiết kiệm hơn cho lần mua sneaker tiếp theo của bạn.
              </p>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
                <button
                  type="button"
                  onClick={scrollToVouchers}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-950 shadow-xl transition hover:bg-zinc-100 hover:shadow-2xl"
                >
                  <span>Khám phá ưu đãi</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                      Nhiều voucher hấp dẫn
                    </div>
                    <div className="text-[11px] sm:text-xs text-zinc-400">
                      Cập nhật mỗi tuần
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sneaker Artwork (Air Jordan 1s on dark pedestal matching mockup) */}
            <div className="relative flex justify-center lg:col-span-5 lg:justify-end">
              <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-none overflow-hidden rounded-2xl">
                <img
                  src="/voucher-pedestal-hq.jpg"
                  alt="Air Jordan 1 Promotion - PeakSneaker"
                  className="w-full h-auto object-cover object-center filter drop-shadow-2xl transition-transform duration-700 hover:scale-105"
                />
                {/* Subtle soft gradient blend on the left edge */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-zinc-950 to-transparent hidden lg:block" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-950 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FLOATING VOUCHER CLAIM CARD & VALUE PROPOSITIONS */}
      <section className="relative z-20 mx-auto -mt-10 max-w-7xl px-4 sm:-mt-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xl shadow-zinc-900/5">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            {/* Title column */}
            <div className="lg:col-span-4">
              <h2 className="text-base sm:text-lg font-black uppercase text-zinc-950 tracking-tight">
                VOUCHER DÀNH CHO BẠN
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Nhập mã voucher bạn có để lưu và sử dụng cho đơn hàng.
              </p>
            </div>

            {/* Form column */}
            <div className="lg:col-span-4">
              <form onSubmit={handleClaimCode} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Nhập mã khuyến mãi"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-2.5 pr-10 text-xs sm:text-sm font-bold uppercase font-mono text-zinc-900 placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none transition"
                  />
                  <Ticket className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-950 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-zinc-800 whitespace-nowrap shadow-sm"
                >
                  Lưu mã
                </button>
              </form>
            </div>

            {/* Value Props column */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-4 sm:justify-end lg:col-span-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-800">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">Tiết kiệm hơn</div>
                  <div className="text-[11px] text-zinc-500">Với nhiều ưu đãi hấp dẫn</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-800">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">An tâm mua sắm</div>
                  <div className="text-[11px] text-zinc-500">Ưu đãi chính hãng từ PeakSneaker</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FILTER & SORT BAR */}
      <section id="vouchers-section" className="mx-auto mt-8 max-w-7xl px-4 sm:mt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="relative self-end sm:self-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none rounded-xl border border-zinc-200 bg-white py-2 pl-4 pr-10 text-xs font-bold text-zinc-800 shadow-sm transition hover:border-zinc-300 focus:border-zinc-900 focus:outline-none cursor-pointer"
            >
              <option value="best">Ưu đãi tốt nhất</option>
              <option value="highest_discount">Giá trị giảm: Cao đến Thấp</option>
              <option value="expiring_soon">Sắp hết hạn trước</option>
              <option value="newest">Mới nhất</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          </div>
        </div>
      </section>

      {/* 4. VOUCHER CARDS GRID (3-Column Layout matching mockup) */}
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Đang tải danh sách ưu đãi...
            </p>
          </div>
        ) : displayedVouchers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white py-16 text-center">
            <Ticket className="mx-auto mb-3 h-12 w-12 text-zinc-300" />
            <p className="text-sm font-bold text-zinc-900">Không tìm thấy voucher phù hợp</p>
            <p className="mt-1 text-xs text-zinc-500">
              Hãy thử chọn danh mục khác hoặc quay lại sau để cập nhật ưu đãi mới.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {displayedVouchers.map((v) => {
              const style = getVoucherStyle(v);
              const Icon = style.icon;
              const remainingCount = v.usageLimit ? Math.max(0, v.usageLimit - v.usedCount) : 999;

              return (
                <div
                  key={v.id}
                  className="group relative flex overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Left Ticket Stub */}
                  <div
                    className={`relative flex w-[32%] shrink-0 flex-col items-center justify-center p-3 text-center sm:w-[30%] ${style.bgClass} border-r-2 border-dashed border-zinc-200/50`}
                  >
                    <Icon className="mb-1 h-6 w-6 text-white drop-shadow-sm" />
                    <span className="text-xl sm:text-2xl font-black leading-none tracking-tight">
                      {style.badgeText}
                    </span>
                    <span className="mt-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider leading-tight opacity-90">
                      {style.badgeSub}
                    </span>

                    {/* Semicircle Cutouts */}
                    <div className="pointer-events-none absolute -top-3.5 right-0 h-6 w-6 translate-x-1/2 rounded-full border-b border-zinc-200/80 bg-zinc-50" />
                    <div className="pointer-events-none absolute -bottom-3.5 right-0 h-6 w-6 translate-x-1/2 rounded-full border-t border-zinc-200/80 bg-zinc-50" />
                  </div>

                  {/* Right Voucher Details */}
                  <div className="flex w-[68%] sm:w-[70%] flex-col justify-between p-4 sm:p-5">
                    <div>
                      <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-zinc-950 line-clamp-1">
                        {style.displayTitle}
                      </h3>

                      <div className="mt-1 space-y-0.5 text-xs text-zinc-600">
                        <p className="line-clamp-1">
                          {v.minOrderAmount > 0
                            ? `Đơn tối thiểu ${formatCurrency(v.minOrderAmount)}`
                            : "Áp dụng cho mọi đơn hàng"}
                        </p>
                        {v.maxDiscountAmount && v.maxDiscountAmount > 0 ? (
                          <p className="text-[11px] text-zinc-500 line-clamp-1">
                            Giảm tối đa {formatCurrency(v.maxDiscountAmount)}
                          </p>
                        ) : style.type === "FREESHIP" ? (
                          <p className="text-[11px] text-zinc-500 line-clamp-1">
                            Áp dụng cho mọi đơn hàng
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100 space-y-3">
                      {/* Meta info: HSD & Còn lại */}
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="h-3 w-3 text-zinc-400" />
                          HSD: {formatDate(v.expireAt)}
                        </span>
                        <span className="text-zinc-300">|</span>
                        <span className="font-medium">
                          Còn lại: {remainingCount}
                        </span>
                      </div>

                      {/* Code Badge + Copy Button */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-center font-mono text-xs font-black uppercase tracking-wider text-zinc-900 truncate">
                          {v.code}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(v.code)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shadow-sm ${
                            copied === v.code
                              ? "bg-emerald-600 text-white"
                              : "bg-zinc-950 text-white hover:bg-zinc-800"
                          }`}
                        >
                          {copied === v.code ? "Đã chép" : "Sao chép mã"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. HOW TO USE VOUCHER (Bottom Guide Card matching mockup) */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Title (lg:col-span-2) */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950 leading-snug">
                CÁCH SỬ DỤNG
                <br />
                VOUCHER
              </h3>
            </div>

            {/* 3 Steps Stepper (lg:col-span-7) */}
            <div className="lg:col-span-7">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-black text-zinc-700">
                    1
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-800">
                    <Ticket className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">Chọn voucher</div>
                    <div className="text-[11px] text-zinc-500">
                      Chọn voucher phù hợp với đơn hàng
                    </div>
                  </div>
                </div>

                <ChevronRight className="hidden sm:block h-4 w-4 text-zinc-300 shrink-0" />

                {/* Step 2 */}
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-black text-zinc-700">
                    2
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-800">
                    <Copy className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">Sao chép mã</div>
                    <div className="text-[11px] text-zinc-500">
                      Nhấn &quot;Sao chép mã&quot; hoặc &quot;Lưu mã&quot;
                    </div>
                  </div>
                </div>

                <ChevronRight className="hidden sm:block h-4 w-4 text-zinc-300 shrink-0" />

                {/* Step 3 */}
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-black text-zinc-700">
                    3
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-800">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">Áp dụng thanh toán</div>
                    <div className="text-[11px] text-zinc-500">
                      Dán mã vào ô khuyến mãi khi checkout
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms Link / Action (lg:col-span-3) */}
            <div className="border-t border-zinc-100 pt-4 sm:pt-0 sm:border-t-0 lg:border-l lg:pl-6 lg:col-span-3">
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="group flex w-full items-center justify-between text-left hover:opacity-80 transition"
              >
                <div>
                  <div className="text-xs font-bold text-zinc-900">Điều kiện áp dụng</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Xem chi tiết điều kiện sử dụng voucher và các câu hỏi thường gặp
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MODAL: ĐIỀU KIỆN ÁP DỤNG VOUCHER */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-black uppercase text-zinc-950">
                  Điều Kiện Áp Dụng Voucher
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-zinc-600 leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
              <div className="rounded-xl bg-zinc-50 p-3.5 border border-zinc-100">
                <p className="font-bold text-zinc-900 mb-1">• Giá trị đơn hàng tối thiểu:</p>
                <p>Mỗi mã voucher chỉ có hiệu lực khi tổng giá trị sản phẩm trong giỏ hàng đạt mức tối thiểu quy định.</p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3.5 border border-zinc-100">
                <p className="font-bold text-zinc-900 mb-1">• Số lần sử dụng:</p>
                <p>Mỗi tài khoản thành viên chỉ được áp dụng 1 voucher cho mỗi đơn hàng. Voucher không có giá trị quy đổi thành tiền mặt.</p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3.5 border border-zinc-100">
                <p className="font-bold text-zinc-900 mb-1">• Thời hạn và số lượng:</p>
                <p>Chương trình có thể kết thúc sớm nếu mã khuyến mãi đạt giới hạn lượt sử dụng trước ngày hết hạn công bố.</p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3.5 border border-zinc-100">
                <p className="font-bold text-zinc-900 mb-1">• Đổi trả & Hủy đơn:</p>
                <p>Trường hợp đơn hàng bị hủy do lỗi kỹ thuật hoặc đổi size, mã voucher sẽ được hoàn lại vào ví tài khoản của quý khách theo quy định của PeakSneaker.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTermsOpen(false)}
              className="mt-6 w-full rounded-xl bg-zinc-950 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

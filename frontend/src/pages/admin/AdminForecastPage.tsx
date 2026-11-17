import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  Clock,
  Flame,
  ImageIcon,
  Layers,
  Loader2,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  Tag,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminFilterHeader from '../../components/admin/AdminFilterHeader';
import AdminPagination from '../../components/admin/AdminPagination';
import { AdminDetailEmptyState, AdminDetailPanel } from '../../components/admin/AdminDetailPanel';
import { AdminBrandService, type BrandResponse as AdminBrandResponse } from '../../services/admin/adminBrandService';
import { AdminCategoryService } from '../../services/admin/adminCategoryService';
import type { CategoryResponse } from '../../services/categoryService';
import { AdminProductService } from '../../services/admin/adminProductService';
import {
  AdminBatchesService,
  type ForecastRiskStatus,
  type InventoryForecastItem,
  type InventoryForecastSummary,
} from '../../services/admin/adminBatchesService';

type PeriodPreset = '7' | '30' | '90' | 'custom';

interface ForecastFilters {
  brandId: string;
  categoryId: string;
  forecastStatus: '' | ForecastRiskStatus;
  periodPreset: PeriodPreset;
  days: number;
  startDate: string;
  endDate: string;
  sortBy: string;
}

const formatDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildPresetDateRange = (days: number): { startDate: string; endDate: string } => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - Math.max(days - 1, 0));
  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(today),
  };
};

const computeDaysBetween = (startDate: string, endDate: string, fallbackDays: number): number => {
  if (!startDate && !endDate) return fallbackDays;
  const resolvedEnd = endDate ? new Date(`${endDate}T00:00:00`) : new Date();
  const resolvedStart = startDate
    ? new Date(`${startDate}T00:00:00`)
    : new Date(resolvedEnd.getTime() - (Math.max(fallbackDays, 1) - 1) * 86_400_000);
  if (Number.isNaN(resolvedStart.getTime()) || Number.isNaN(resolvedEnd.getTime())) {
    return fallbackDays;
  }
  const diffDays = Math.floor((resolvedEnd.getTime() - resolvedStart.getTime()) / 86_400_000) + 1;
  return Math.min(366, Math.max(1, diffDays));
};

const formatShortDateVi = (isoDate: string): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const isValidForecastRiskStatus = (status: string): status is ForecastRiskStatus => {
  return ['CRITICAL', 'WARNING', 'FAST_MOVING', 'SLOW_MOVING', 'HEALTHY'].includes(status);
};

const createDefaultFilters = (initialStatus = ''): ForecastFilters => {
  const range = buildPresetDateRange(30);
  const validatedStatus: '' | ForecastRiskStatus = isValidForecastRiskStatus(initialStatus) ? initialStatus : '';
  return {
    brandId: '',
    categoryId: '',
    forecastStatus: validatedStatus,
    periodPreset: '30',
    days: 30,
    startDate: range.startDate,
    endDate: range.endDate,
    sortBy: 'urgency',
  };
};

const EMPTY_SUMMARY: InventoryForecastSummary = {
  totalVariants: 0,
  criticalCount: 0,
  warningCount: 0,
  fastMovingCount: 0,
  slowMovingCount: 0,
  healthyCount: 0,
  totalSuggestedUnits: 0,
  totalEstimatedRestockCost: 0,
};

const formatCurrency = (amount?: number | null) =>
  amount != null ? amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '—';

const getForecastBadge = (status: ForecastRiskStatus, stock?: number) => {
  switch (status) {
    case 'CRITICAL':
      return {
        label: stock === 0 ? 'Cần nhập gấp' : 'Nguy cơ hết sớm',
        className: 'border-red-200 bg-red-50 text-red-700',
        dotClass: 'bg-red-500',
      };
    case 'WARNING':
      return {
        label: 'Sắp hết hàng',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
        dotClass: 'bg-amber-500',
      };
    case 'FAST_MOVING':
      return {
        label: 'Đang bán chạy',
        className: 'border-blue-200 bg-blue-50 text-blue-700',
        dotClass: 'bg-blue-500',
      };
    case 'SLOW_MOVING':
      return {
        label: 'Tồn nhiều, bán chậm',
        className: 'border-violet-200 bg-violet-50 text-violet-700',
        dotClass: 'bg-violet-500',
      };
    default:
      return {
        label: 'Tồn kho ổn định',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        dotClass: 'bg-emerald-500',
      };
  }
};

const getStockoutForecastDisplay = (item: InventoryForecastItem) => {
  if (item.stock === 0) {
    return {
      title: 'Đã hết hàng',
      subtitle: 'Kho đang trống (0 SP)',
      titleClass: 'text-red-600',
      showAlertIcon: true,
    };
  }
  if (item.daysUntilStockout != null) {
    if (item.daysUntilStockout <= 7) {
      return {
        title: `Hết sau ~${item.daysUntilStockout} ngày`,
        subtitle: 'Nguy cơ thiếu hàng cao',
        titleClass: 'text-red-600',
        showAlertIcon: true,
      };
    }
    if (item.daysUntilStockout <= 14) {
      return {
        title: `Đủ bán ~${item.daysUntilStockout} ngày`,
        subtitle: 'Nên chuẩn bị nhập thêm',
        titleClass: 'text-amber-600',
        showAlertIcon: false,
      };
    }
    return {
      title: `Đủ bán ~${item.daysUntilStockout} ngày`,
      subtitle: 'Theo sức mua hiện tại',
      titleClass: 'text-emerald-700',
      showAlertIcon: false,
    };
  }
  if (item.stock <= item.safetyStockThreshold) {
    return {
      title: 'Dưới mức an toàn',
      subtitle: `Chỉ còn ${item.stock} sản phẩm`,
      titleClass: 'text-amber-600',
      showAlertIcon: false,
    };
  }
  return {
    title: 'Chưa lo thiếu hàng',
    subtitle: `Đang sẵn ${item.stock} sản phẩm`,
    titleClass: 'text-slate-700',
    showAlertIcon: false,
  };
};

export default function AdminForecastPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || searchParams.get('forecastStatus') || '';
  const startDateInputRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<InventoryForecastItem[]>([]);
  const [summary, setSummary] = useState<InventoryForecastSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [draftFilters, setDraftFilters] = useState<ForecastFilters>(() => createDefaultFilters(initialStatus));
  const [appliedFilters, setAppliedFilters] = useState<ForecastFilters>(() => createDefaultFilters(initialStatus));
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [brands, setBrands] = useState<AdminBrandResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryForecastItem | null>(null);

  // Discount / Markdown state
  const [discountModalItem, setDiscountModalItem] = useState<InventoryForecastItem | null>(null);
  const [discountPercentInput, setDiscountPercentInput] = useState<number>(20);
  const [isUpdatingDiscount, setIsUpdatingDiscount] = useState<boolean>(false);

  const handleOpenDiscountModal = (item: InventoryForecastItem) => {
    setDiscountModalItem(item);
    setDiscountPercentInput(20);
  };

  const handleConfirmDiscount = async () => {
    if (!discountModalItem) return;
    setIsUpdatingDiscount(true);
    try {
      await AdminProductService.updateDiscount(discountModalItem.productId, discountPercentInput);
      toast.success(
        discountPercentInput > 0
          ? `Đã áp dụng giảm giá ${discountPercentInput}% cho sản phẩm "${discountModalItem.productName}"!`
          : `Đã hủy giảm giá cho sản phẩm "${discountModalItem.productName}" thành công!`
      );
      setDiscountModalItem(null);
      void loadForecastData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật mức giảm giá.');
    } finally {
      setIsUpdatingDiscount(false);
    }
  };

  const maxDate = useMemo(() => formatDateInput(new Date()), []);
  const dateRangeError = useMemo(() => {
    if (draftFilters.startDate && draftFilters.endDate && draftFilters.startDate > draftFilters.endDate) {
      return 'Ngày bắt đầu không được lớn hơn ngày kết thúc.';
    }
    return null;
  }, [draftFilters.endDate, draftFilters.startDate]);

  const loadMetadata = useCallback(async () => {
    try {
      const [brandData, categoryData] = await Promise.all([
        AdminBrandService.getBrands(),
        AdminCategoryService.getCategories(),
      ]);
      setBrands(brandData);
      setCategories(categoryData);
    } catch {
      // Metadata load is non-blocking
    }
  }, []);

  const loadForecastData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const isCustomRange =
        appliedFilters.periodPreset === 'custom' &&
        Boolean(appliedFilters.startDate || appliedFilters.endDate);

      const [forecastResult, summaryResult] = await Promise.all([
        AdminBatchesService.getForecast({
          days: appliedFilters.days,
          startDate: isCustomRange ? appliedFilters.startDate || undefined : undefined,
          endDate: isCustomRange ? appliedFilters.endDate || undefined : undefined,
          search: appliedSearch || undefined,
          brandId: appliedFilters.brandId ? Number(appliedFilters.brandId) : undefined,
          categoryId: appliedFilters.categoryId ? Number(appliedFilters.categoryId) : undefined,
          forecastStatus: appliedFilters.forecastStatus || undefined,
          sortBy: appliedFilters.sortBy,
          page,
          size: pageSize,
        }),
        AdminBatchesService.getForecastSummary({
          days: appliedFilters.days,
          startDate: isCustomRange ? appliedFilters.startDate || undefined : undefined,
          endDate: isCustomRange ? appliedFilters.endDate || undefined : undefined,
        }),
      ]);

      const fetchedItems = forecastResult.items ?? [];
      setItems(fetchedItems);
      setTotalPages(Math.max(forecastResult.totalPages ?? 1, 1));
      setTotalElements(forecastResult.totalElements ?? 0);
      setSummary(summaryResult ?? EMPTY_SUMMARY);

      setSelectedItem((current) => {
        if (!current) return fetchedItems[0] ?? null;
        const updated = fetchedItems.find((item) => item.variantId === current.variantId);
        return updated ?? fetchedItems[0] ?? null;
      });
    } catch {
      setItems([]);
      setErrorMessage('Không thể tải dữ liệu dự báo tồn kho. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, appliedSearch, page, pageSize]);

  useEffect(() => {
    void loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    void loadForecastData();
  }, [loadForecastData]);

  const statusTabs = useMemo(
    () =>
      [
        { value: '', label: 'Tất cả sản phẩm', count: summary.totalVariants },
        { value: 'CRITICAL', label: 'Cần nhập gấp', count: summary.criticalCount },
        { value: 'WARNING', label: 'Sắp hết hàng', count: summary.warningCount },
        { value: 'FAST_MOVING', label: 'Đang bán chạy', count: summary.fastMovingCount },
        { value: 'SLOW_MOVING', label: 'Tồn nhiều, bán chậm', count: summary.slowMovingCount },
        { value: 'HEALTHY', label: 'Tồn kho ổn định', count: summary.healthyCount },
      ] as const,
    [summary],
  );

  const activeFilterCount =
    (appliedSearch ? 1 : 0) +
    (appliedFilters.brandId ? 1 : 0) +
    (appliedFilters.categoryId ? 1 : 0) +
    (appliedFilters.forecastStatus ? 1 : 0) +
    (appliedFilters.periodPreset !== '30' ? 1 : 0);

  const handleApplyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    if (dateRangeError) return;
    const computedDays = computeDaysBetween(
      draftFilters.startDate,
      draftFilters.endDate,
      draftFilters.days,
    );
    const nextFilters: ForecastFilters = {
      ...draftFilters,
      days: computedDays,
    };
    setDraftFilters(nextFilters);
    setAppliedSearch(search.trim());
    setAppliedFilters(nextFilters);
    setPage(0);
  };

  const handleResetFilters = () => {
    const defaults = createDefaultFilters();
    setSearch('');
    setAppliedSearch('');
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    setPage(0);
  };

  const handleSelectStatus = (forecastStatus: '' | ForecastRiskStatus) => {
    setDraftFilters((current) => ({ ...current, forecastStatus }));
    setAppliedFilters((current) => ({ ...current, forecastStatus }));
    setPage(0);
  };

  const handleChangePeriod = (days: 7 | 30 | 90) => {
    const range = buildPresetDateRange(days);
    const presetKey = String(days) as PeriodPreset;
    setDraftFilters((current) => ({
      ...current,
      periodPreset: presetKey,
      days,
      startDate: range.startDate,
      endDate: range.endDate,
    }));
    setAppliedFilters((current) => ({
      ...current,
      periodPreset: presetKey,
      days,
      startDate: range.startDate,
      endDate: range.endDate,
    }));
    setPage(0);
  };

  const handleActivateCustomPeriod = () => {
    setFiltersOpen(true);
    setDraftFilters((current) => ({
      ...current,
      periodPreset: 'custom',
    }));
    window.setTimeout(() => {
      startDateInputRef.current?.focus();
    }, 50);
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDraftFilters((current) => {
      const nextStart = field === 'startDate' ? value : current.startDate;
      const nextEnd = field === 'endDate' ? value : current.endDate;
      const nextDays = computeDaysBetween(nextStart, nextEnd, current.days);
      return {
        ...current,
        periodPreset: 'custom',
        startDate: nextStart,
        endDate: nextEnd,
        days: nextDays,
      };
    });
  };

  const handleQuickRestock = (item: InventoryForecastItem) => {
    const qty = item.suggestedReorderQty > 0 ? item.suggestedReorderQty : Math.max(5, item.safetyStockThreshold);
    navigate(`/admin/inventory?productId=${item.productId}&variantId=${item.variantId}&action=import&suggestedQty=${qty}`);
  };

  return (
    <div className="space-y-4 pb-10">
      <AdminPageHeader
        title="Dự báo & Cảnh báo Tồn kho"
        description="Theo dõi sức mua thực tế, phát hiện sớm các mẫu giày sắp hết hàng và gợi ý số lượng cần nhập bổ sung."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              {([7, 30, 90] as const).map((d) => {
                const isSelected = appliedFilters.periodPreset === String(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleChangePeriod(d)}
                    className={`rounded-md px-3 py-1.5 text-xs font-black transition ${
                      isSelected
                        ? 'bg-slate-950 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {d} ngày qua
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleActivateCustomPeriod}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black transition ${
                  appliedFilters.periodPreset === 'custom' || draftFilters.periodPreset === 'custom'
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Tùy chỉnh
              </button>
            </div>
            <button
              type="button"
              onClick={() => void loadForecastData()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
            </button>
          </div>
        }
      />

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:items-start">
        <div className="min-w-0 space-y-3">
          <div className="z-30 -mx-1 bg-slate-50 px-1 pb-2 2xl:sticky 2xl:-top-5">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <AdminFilterHeader
                isOpen={filtersOpen}
                onToggle={() => setFiltersOpen((open) => !open)}
                activeCount={activeFilterCount}
                onReset={handleResetFilters}
              />

              {filtersOpen && (
                <form onSubmit={handleApplyFilters} className="space-y-3 p-4">
                  <div className="grid items-end gap-3 lg:grid-cols-[minmax(0,1.8fr)_minmax(150px,0.85fr)_minmax(150px,0.85fr)_auto]">
                    <label className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500">Tìm kiếm sản phẩm</span>
                      <span className="relative block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Tìm theo mã SKU, tên sản phẩm hoặc thương hiệu..."
                          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                        />
                      </span>
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500">Từ ngày</span>
                      <input
                        ref={startDateInputRef}
                        type="date"
                        value={draftFilters.startDate}
                        max={draftFilters.endDate || maxDate}
                        onChange={(event) => handleCustomDateChange('startDate', event.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                      />
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500">Đến ngày</span>
                      <input
                        type="date"
                        value={draftFilters.endDate}
                        min={draftFilters.startDate || undefined}
                        max={maxDate}
                        onChange={(event) => handleCustomDateChange('endDate', event.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={Boolean(dateRangeError)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Search className="h-4 w-4" /> Áp dụng
                    </button>
                  </div>

                  {dateRangeError && (
                    <p className="text-xs font-semibold text-red-600" role="alert">
                      {dateRangeError}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500">Thương hiệu</span>
                      <select
                        value={draftFilters.brandId}
                        onChange={(event) => setDraftFilters((current) => ({ ...current, brandId: event.target.value }))}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                      >
                        <option value="">Tất cả thương hiệu</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500">Danh mục</span>
                      <select
                        value={draftFilters.categoryId}
                        onChange={(event) => setDraftFilters((current) => ({ ...current, categoryId: event.target.value }))}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                      >
                        <option value="">Tất cả danh mục</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500">Mức độ cảnh báo</span>
                      <select
                        value={draftFilters.forecastStatus}
                        onChange={(event) =>
                          setDraftFilters((current) => ({
                            ...current,
                            forecastStatus: event.target.value as ForecastFilters['forecastStatus'],
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                      >
                        <option value="">Tất cả mức độ</option>
                        <option value="CRITICAL">Cần nhập gấp (Đã hết / Cạn trong ≤ 7 ngày)</option>
                        <option value="WARNING">Sắp hết hàng (Chạm mức tối thiểu)</option>
                        <option value="FAST_MOVING">Đang bán chạy (Sức mua cao)</option>
                        <option value="SLOW_MOVING">Tồn nhiều, bán chậm</option>
                        <option value="HEALTHY">Tồn kho ổn định</option>
                      </select>
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500">Sắp xếp theo</span>
                      <select
                        value={draftFilters.sortBy}
                        onChange={(event) => {
                          const nextSort = event.target.value;
                          setDraftFilters((current) => ({ ...current, sortBy: nextSort }));
                          setAppliedFilters((current) => ({ ...current, sortBy: nextSort }));
                          setPage(0);
                        }}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                      >
                        <option value="urgency">Ưu tiên cần nhập trước</option>
                        <option value="stock-asc">Tồn kho ít nhất trước</option>
                        <option value="velocity-desc">Bán chạy nhất trước</option>
                        <option value="restock-desc">Cần nhập số lượng nhiều nhất</option>
                      </select>
                    </label>
                  </div>
                </form>
              )}
            </section>
          </div>

          <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto border-b border-slate-200 px-4 pb-1 pt-3 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-slate-100">
              <div className="flex min-w-max gap-1">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.value || 'all'}
                    type="button"
                    onClick={() => handleSelectStatus(tab.value)}
                    className={`rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-black transition ${
                      appliedFilters.forecastStatus === tab.value
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}{' '}
                    <span className={`ml-1 ${appliedFilters.forecastStatus === tab.value ? 'text-slate-300' : 'text-slate-400'}`}>
                      ({tab.count.toLocaleString('vi-VN')})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <header className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-black text-slate-950">Danh sách dự báo tồn kho & gợi ý nhập hàng</h2>
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      <CalendarDays className="h-3 w-3 text-slate-400" />
                      {appliedFilters.startDate && appliedFilters.endDate
                        ? `${formatShortDateVi(appliedFilters.startDate)} – ${formatShortDateVi(appliedFilters.endDate)} (${appliedFilters.days} ngày)`
                        : `${appliedFilters.days} ngày gần nhất`}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {totalElements.toLocaleString('vi-VN')} biến thể · Gợi ý nhập thêm tổng cộng{' '}
                    <strong className="text-slate-900">{summary.totalSuggestedUnits.toLocaleString('vi-VN')} sản phẩm</strong> (Chi phí dự kiến:{' '}
                    <strong className="text-blue-600">{formatCurrency(summary.totalEstimatedRestockCost)}</strong>)
                  </p>
                </div>
              </div>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(0);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </header>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[880px] table-fixed text-left text-xs">
                <colgroup>
                  <col className="w-[26%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Sản phẩm & Biến thể</th>
                    <th className="px-3 py-3">Tồn kho / Tối thiểu</th>
                    <th className="px-3 py-3">Lượng bán ({appliedFilters.days} ngày)</th>
                    <th className="px-3 py-3">Dự báo hết hàng</th>
                    <th className="px-3 py-3">Mức độ cảnh báo</th>
                    <th className="px-3 py-3 text-right">Số lượng nên nhập</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-16 text-center text-sm text-slate-500">
                        <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
                        Đang phân tích dữ liệu dự báo tồn kho...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-16 text-center">
                        <PackageSearch className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-3 font-bold text-slate-700">Không có sản phẩm nào trong nhóm cảnh báo này</p>
                        <p className="mt-1 text-xs text-slate-400">Hãy thử chọn tab khác hoặc đặt lại bộ lọc.</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const badge = getForecastBadge(item.forecastStatus, item.stock);
                      const stockoutDisplay = getStockoutForecastDisplay(item);
                      const isSelected = selectedItem?.variantId === item.variantId;
                      const diffFromMin = item.stock - item.safetyStockThreshold;

                      return (
                        <tr
                          key={item.variantId}
                          onClick={() => setSelectedItem(item)}
                          className={`cursor-pointer transition hover:bg-blue-50/40 ${isSelected ? 'bg-blue-50/60' : ''}`}
                        >
                          <td className="px-3 py-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                {item.productImageUrl ? (
                                  <img src={item.productImageUrl} alt="" className="h-full w-full object-contain p-1" />
                                ) : (
                                  <ImageIcon className="h-5 w-5 text-slate-300" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-bold text-slate-900">{item.productName}</p>
                                <p className="mt-0.5 truncate font-mono text-[11px] font-bold text-blue-600">{item.sku}</p>
                                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                  {item.color} / Size {item.size} · {item.brandName ?? '—'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-baseline gap-1">
                              <span
                                className={`text-sm font-black ${
                                  item.stock === 0
                                    ? 'text-red-600'
                                    : item.stock <= item.safetyStockThreshold
                                      ? 'text-amber-600'
                                      : 'text-slate-900'
                                }`}
                              >
                                {item.stock}
                              </span>
                              <span className="text-[11px] text-slate-400">/ tối thiểu {item.safetyStockThreshold}</span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {item.stock === 0
                                ? `Thiếu ${item.safetyStockThreshold} SP tối thiểu`
                                : diffFromMin < 0
                                  ? `Thấp hơn tối thiểu ${Math.abs(diffFromMin)} SP`
                                  : diffFromMin === 0
                                    ? 'Đang chạm mức tối thiểu'
                                    : `Dư +${diffFromMin} SP so với tối thiểu`}
                            </p>
                          </td>

                          <td className="px-3 py-3">
                            {item.soldInPeriod > 0 ? (
                              <>
                                <p className="font-bold text-slate-900">Đã bán {item.soldInPeriod} SP</p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  Trung bình <strong className="text-slate-700">{item.dailyVelocity.toFixed(2)}</strong> SP/ngày
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold text-slate-500">Chưa có lượt mua</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">Trong {appliedFilters.days} ngày qua</p>
                              </>
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <p className={`inline-flex items-center gap-1 font-black ${stockoutDisplay.titleClass}`}>
                              {stockoutDisplay.showAlertIcon && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                              <span>{stockoutDisplay.title}</span>
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">{stockoutDisplay.subtitle}</p>
                          </td>

                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-black ${badge.className}`}
                            >
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${badge.dotClass}`} />
                              {badge.label}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-right">
                            {item.suggestedReorderQty > 0 ? (
                              <div>
                                <span className="inline-flex items-center whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-0.5 font-mono text-xs font-black text-white">
                                  Nhập +{item.suggestedReorderQty}
                                </span>
                                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                                  {formatCurrency(item.estimatedRestockCost)}
                                </p>
                              </div>
                            ) : item.forecastStatus === 'SLOW_MOVING' ? (
                              <span className="text-[11px] font-bold text-violet-700">Nên giảm giá xả kho</span>
                            ) : (
                              <span className="text-[11px] font-semibold text-emerald-600">Chưa cần nhập</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {loading ? (
                <div className="py-14 text-center text-sm text-slate-500">
                  <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
                  Đang tải dự báo...
                </div>
              ) : (
                items.map((item) => {
                  const badge = getForecastBadge(item.forecastStatus, item.stock);
                  return (
                    <button
                      key={item.variantId}
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="flex w-full gap-3 p-4 text-left hover:bg-slate-50"
                    >
                      <div className="flex h-14 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        {item.productImageUrl ? (
                          <img src={item.productImageUrl} alt="" className="h-full w-full object-contain p-1" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-bold text-slate-900">{item.productName}</p>
                          <span className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-black ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="mt-0.5 font-mono text-xs font-bold text-blue-600">{item.sku}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          Tồn: <strong>{item.stock}</strong> (Tối thiểu {item.safetyStockThreshold}) · Bán {appliedFilters.days}N:{' '}
                          <strong>{item.soldInPeriod} SP</strong>
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              visibleCount={items.length}
              itemLabel="sản phẩm"
              disabled={loading}
              onPageChange={setPage}
            />
          </section>
        </div>

        {selectedItem ? (
          <AdminDetailPanel ariaLabel={`Chi tiết dự báo ${selectedItem.sku}`} className="flex flex-col">
            <section className="flex min-h-0 flex-1 flex-col">
              <header className="flex h-11 items-center justify-between border-b border-slate-200 px-4">
                <h2 className="text-sm font-black text-slate-950">Chi tiết Dự báo & Nhập hàng</h2>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3.5">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {selectedItem.productImageUrl ? (
                      <img src={selectedItem.productImageUrl} alt="" className="h-full w-full object-contain p-1.5" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{selectedItem.productName}</p>
                    <p className="mt-0.5 font-mono text-xs font-bold text-blue-600">{selectedItem.sku}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedItem.color} / Size {selectedItem.size} · {selectedItem.brandName ?? '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Mức độ cảnh báo</p>
                    <p className="mt-1 text-xs font-black text-slate-900">
                      {getForecastBadge(selectedItem.forecastStatus, selectedItem.stock).label}
                    </p>
                  </div>
                  <span
                    className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-black ${
                      getForecastBadge(selectedItem.forecastStatus, selectedItem.stock).className
                    }`}
                  >
                    {getStockoutForecastDisplay(selectedItem).title}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <article className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tồn kho hiện tại</p>
                    <p className={`mt-1.5 text-2xl font-black ${selectedItem.stock === 0 ? 'text-red-600' : 'text-slate-950'}`}>
                      {selectedItem.stock}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Tối thiểu cần giữ: {selectedItem.safetyStockThreshold}</p>
                  </article>

                  <article className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Đã bán ({appliedFilters.days} ngày)
                    </p>
                    <p className="mt-1.5 text-2xl font-black text-blue-600">{selectedItem.soldInPeriod}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {selectedItem.soldInPeriod > 0
                        ? `~${selectedItem.dailyVelocity.toFixed(2)} SP/ngày`
                        : 'Chưa có lượt mua'}
                    </p>
                  </article>
                </div>

                <section className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
                  <div className="flex items-center gap-2 font-black text-slate-900">
                    <Flame className="h-4 w-4 text-amber-500" />
                    <h3>Kế hoạch Nhập hàng đề xuất</h3>
                  </div>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Mức tồn nên bắt đầu đặt hàng:</span>
                      <strong className="text-slate-900">≤ {selectedItem.reorderPoint} sản phẩm</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Số lượng gợi ý nhập thêm:</span>
                      <strong className="text-emerald-700">+{selectedItem.suggestedReorderQty} sản phẩm</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Nhà cung cấp gần nhất:</span>
                      <strong className="max-w-[160px] truncate text-slate-900">{selectedItem.latestSupplierName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Giá vốn dự kiến / SP:</span>
                      <strong className="text-slate-900">{formatCurrency(selectedItem.latestUnitCost)}</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5">
                      <span className="font-bold text-slate-700">Chi phí nhập ước tính:</span>
                      <strong className="text-sm font-black text-blue-600">
                        {formatCurrency(selectedItem.estimatedRestockCost)}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 p-3.5 text-xs leading-5 text-slate-600">
                  <div className="mb-1.5 flex items-center gap-1.5 font-black text-slate-900">
                    {selectedItem.forecastStatus === 'CRITICAL' || selectedItem.forecastStatus === 'WARNING' ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : selectedItem.forecastStatus === 'SLOW_MOVING' ? (
                      <TrendingDown className="h-4 w-4 text-violet-600" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    )}
                    <span>Lời khuyên xử lý</span>
                  </div>
                  {selectedItem.stock === 0 ? (
                    <p>
                      Sản phẩm này đã <strong>hết sạch trong kho</strong>. Bạn nên nhập thêm tối thiểu{' '}
                      <strong>{selectedItem.suggestedReorderQty} sản phẩm</strong> ngay để khách có thể đặt mua trở lại.
                    </p>
                  ) : selectedItem.daysUntilStockout != null && selectedItem.daysUntilStockout <= 14 ? (
                    <p>
                      Với sức mua trung bình <strong>{selectedItem.dailyVelocity.toFixed(2)} SP/ngày</strong>, số lượng còn lại dự kiến sẽ hết trong khoảng{' '}
                      <strong>{selectedItem.daysUntilStockout} ngày</strong>. Nên đặt hàng nhà cung cấp sớm để kịp thời gian giao hàng.
                    </p>
                  ) : selectedItem.stock <= selectedItem.safetyStockThreshold ? (
                    <p>
                      Số lượng tồn kho hiện tại (<strong>{selectedItem.stock} SP</strong>) đã chạm hoặc thấp hơn mức an toàn tối thiểu (
                      <strong>{selectedItem.safetyStockThreshold} SP</strong>). Nên nhập bù thêm{' '}
                      <strong>{selectedItem.suggestedReorderQty} sản phẩm</strong>.
                    </p>
                  ) : selectedItem.forecastStatus === 'SLOW_MOVING' ? (
                    <p>
                      Trong kho đang còn <strong>{selectedItem.stock} sản phẩm</strong> nhưng {appliedFilters.days} ngày qua chưa có lượt mua. Hãy bấm nút <strong>Áp dụng Giảm giá Xả kho</strong> bên dưới để kích hoạt Badge SALE và xả nhanh hàng tồn.
                    </p>
                  ) : (
                    <p>
                      Lượng tồn kho hiện tại hoàn toàn đáp ứng tốt nhu cầu mua sắm của khách hàng, chưa cần nhập thêm.
                    </p>
                  )}
                </section>
              </div>

              <footer className="space-y-2 border-t border-slate-200 bg-white p-3">
                {selectedItem.forecastStatus === 'SLOW_MOVING' && (
                  <button
                    type="button"
                    onClick={() => handleOpenDiscountModal(selectedItem)}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
                  >
                    <Tag className="h-4 w-4" />
                    Áp dụng Giảm giá Xả kho (-20%, -30%...)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleQuickRestock(selectedItem)}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Nhập thêm hàng ngay (
                  {selectedItem.suggestedReorderQty > 0
                    ? `+${selectedItem.suggestedReorderQty} SP`
                    : `+${Math.max(5, selectedItem.safetyStockThreshold)} SP`}
                  )
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/admin/inventory?productId=${selectedItem.productId}&variantId=${selectedItem.variantId}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Layers className="h-3.5 w-3.5" /> Mở Kho & Lô
                  </Link>
                  <Link
                    to={`/admin/batches?variantId=${selectedItem.variantId}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Clock className="h-3.5 w-3.5" /> Xem Nhật ký
                  </Link>
                </div>
              </footer>
            </section>
          </AdminDetailPanel>
        ) : (
          <AdminDetailPanel ariaLabel="Chưa chọn sản phẩm dự báo">
            <AdminDetailEmptyState
              icon={<TrendingUp className="h-9 w-9" />}
              title="Chưa chọn sản phẩm"
              description="Chọn một dòng sản phẩm trong bảng để xem chi tiết sức mua, dự kiến số ngày hết hàng và gợi ý số lượng nhập."
              items={[
                'Số lượng đã bán & Tốc độ mua trung bình',
                'Gợi ý số lượng & chi phí cần nhập thêm',
                'Chuyển thẳng sang tạo phiếu nhập kho chỉ với 1 chạm',
              ]}
            />
          </AdminDetailPanel>
        )}
      </div>

      {/* Modal Áp dụng Giảm giá Xả kho */}
      {discountModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <Tag className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Áp dụng Giảm giá Xả kho</h3>
                  <p className="text-xs text-slate-500">Kích thích sức mua cho sản phẩm tồn kho</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDiscountModalItem(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-900 line-clamp-1">{discountModalItem.productName}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Biến thể: <span className="font-semibold text-slate-700">{discountModalItem.color} - Size {discountModalItem.size}</span>
                  {' · '}Tồn kho: <span className="font-black text-amber-600">{discountModalItem.stock} SP</span>
                </p>
                <p className="mt-1 text-xs text-slate-700">
                  Giá gốc: <span className="font-bold text-slate-900">{formatCurrency(discountModalItem.retailPrice)}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Chọn nhanh mức giảm giá (%)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDiscountPercentInput(preset)}
                      className={`h-9 rounded-lg border text-xs font-black transition ${
                        discountPercentInput === preset
                          ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-200'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      -{preset}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Hoặc nhập phần trăm tùy chỉnh</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={discountPercentInput}
                    onChange={(e) => setDiscountPercentInput(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
                {discountPercentInput === 0 && (
                  <p className="mt-1 text-[11px] text-amber-600 font-medium">
                    ⚠️ Mức 0% sẽ hủy bỏ trạng thái giảm giá và gỡ bỏ Badge SALE.
                  </p>
                )}
              </div>

              {discountPercentInput > 0 && discountModalItem.retailPrice && (
                <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Giá bán sau khi giảm:</span>
                    <span className="text-sm font-black text-red-600">
                      {formatCurrency(discountModalItem.retailPrice * (1 - discountPercentInput / 100))}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Badge ngoài Website:</span>
                    <span className="inline-flex rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                      SALE -{discountPercentInput}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setDiscountModalItem(null)}
                disabled={isUpdatingDiscount}
                className="h-9 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscount}
                disabled={isUpdatingDiscount}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isUpdatingDiscount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
                {discountPercentInput > 0 ? 'Xác nhận & Gắn Badge SALE' : 'Xác nhận hủy giảm giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import {
  Check,
  Download,
  PackageOpen,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import AdminDateRangeFilter from "../../components/admin/AdminDateRangeFilter";
import AdminFilterHeader from "../../components/admin/AdminFilterHeader";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminCreateOrderModal from "../../components/admin/orders/AdminCreateOrderModal";
import AdminOrderDetailPanel from "../../components/admin/orders/AdminOrderDetailPanel";
import AdminOrderWaybillModal from "../../components/admin/orders/AdminOrderWaybillModal";
import { AdminDetailEmptyState, AdminDetailPanel } from "../../components/admin/AdminDetailPanel";
import {
  AdminDashboardService,
  type DashboardSummaryResponse,
} from "../../services/admin/adminDashboardService";
import {
  AdminOrderService,
  type OrderFilterParams,
  type OrderResponse,
} from "../../services/admin/adminOrderService";
import {
  formatOrderCurrency,
  formatOrderDateTime,
  getOrderDisplayCode,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
} from "../../utils/adminOrderPresentation";
import {
  createAdminDateRange,
  getAdminDateRangeError,
  type AdminDateRangeValue,
} from "../../utils/adminDateRange";

const PAGE_SIZE = 10;

type OrderStatusFilter = OrderResponse["status"] | "ALL";
type PaymentStatusFilter = OrderResponse["paymentStatus"] | "ALL";
type PaymentMethodFilter = OrderResponse["paymentMethod"] | "ALL";

interface FilterOption<T extends string> {
  value: T;
  label: string;
}

const ORDER_STATUS_OPTIONS: Array<FilterOption<OrderStatusFilter>> = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "PROCESSING", label: "Đang xử lý" },
  { value: "SHIPPING", label: "Đang giao" },
  { value: "DELIVERED", label: "Đã giao" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const PAYMENT_STATUS_OPTIONS: Array<FilterOption<PaymentStatusFilter>> = [
  { value: "ALL", label: "Mọi trạng thái" },
  { value: "UNPAID", label: "Chưa thanh toán" },
  { value: "PENDING", label: "Đang chờ thanh toán" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "FAILED", label: "Thanh toán lỗi" },
  { value: "REFUNDED", label: "Đã hoàn tiền" },
];

const PAYMENT_METHOD_OPTIONS: Array<FilterOption<PaymentMethodFilter>> = [
  { value: "ALL", label: "Mọi phương thức" },
  { value: "COD", label: "COD" },
  { value: "VNPAY", label: "VNPAY" },
];

const normalizeQueryValue = <T extends string>(value: string | null, allowedValues: readonly T[], fallback: T): T =>
  value && allowedValues.includes(value as T) ? value as T : fallback;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== "object" || error === null || !("response" in error)) return fallback;
  const response = (error as { response?: { data?: { message?: unknown } } }).response;
  return typeof response?.data?.message === "string" ? response.data.message : fallback;
};

const parseAmount = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const getStatusCount = (summary: DashboardSummaryResponse | null, status: OrderStatusFilter): number => {
  if (!summary) return 0;
  if (status === "ALL") return summary.totalOrders;
  return summary.orderStatusCounts[status] ?? 0;
};

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openedOrderIdRef = useRef<number | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dispatchingShipment, setDispatchingShipment] = useState(false);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isFilterOpen, setFilterOpen] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBatchWaybillOpen, setBatchWaybillOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("query") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatusFilter>(() =>
    normalizeQueryValue(searchParams.get("status"), ORDER_STATUS_OPTIONS.map((option) => option.value), "ALL"),
  );
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatusFilter>(() =>
    normalizeQueryValue(searchParams.get("paymentStatus"), PAYMENT_STATUS_OPTIONS.map((option) => option.value), "ALL"),
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodFilter>(() =>
    normalizeQueryValue(searchParams.get("paymentMethod"), PAYMENT_METHOD_OPTIONS.map((option) => option.value), "ALL"),
  );
  const [draftPaymentStatus, setDraftPaymentStatus] = useState(selectedPaymentStatus);
  const [draftPaymentMethod, setDraftPaymentMethod] = useState(selectedPaymentMethod);
  const [minAmount, setMinAmount] = useState(() => searchParams.get("minAmount") ?? "");
  const [maxAmount, setMaxAmount] = useState(() => searchParams.get("maxAmount") ?? "");
  const [appliedMinAmount, setAppliedMinAmount] = useState(minAmount);
  const [appliedMaxAmount, setAppliedMaxAmount] = useState(maxAmount);
  const [dateRange, setDateRange] = useState<AdminDateRangeValue>(() => createAdminDateRange("thirtyDays"));
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const dateRangeError = getAdminDateRangeError(dateRange, 366);
  const parsedMinAmount = parseAmount(appliedMinAmount);
  const parsedMaxAmount = parseAmount(appliedMaxAmount);
  const currentMinAmount = parseAmount(minAmount);
  const currentMaxAmount = parseAmount(maxAmount);
  const amountError = currentMinAmount !== undefined && currentMaxAmount !== undefined && currentMinAmount > currentMaxAmount
    ? "Giá trị tối thiểu không được lớn hơn giá trị tối đa."
    : null;

  const buildFilterParams = useCallback((targetPage = page, size = PAGE_SIZE): OrderFilterParams => {
    const params: OrderFilterParams = { page: targetPage, size };
    if (debouncedQuery.trim()) params.query = debouncedQuery.trim();
    if (selectedStatus !== "ALL") params.status = selectedStatus;
    if (selectedPaymentStatus !== "ALL") params.paymentStatus = selectedPaymentStatus;
    if (selectedPaymentMethod !== "ALL") params.paymentMethod = selectedPaymentMethod;
    if (dateRange.from) params.from = dateRange.from;
    if (dateRange.to) params.to = dateRange.to;
    if (parsedMinAmount !== undefined) params.minAmount = parsedMinAmount;
    if (parsedMaxAmount !== undefined) params.maxAmount = parsedMaxAmount;
    return params;
  }, [dateRange.from, dateRange.to, debouncedQuery, page, parsedMaxAmount, parsedMinAmount, selectedPaymentMethod, selectedPaymentStatus, selectedStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery), 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const fetchOrders = useCallback(async () => {
    if (dateRangeError) return;
    setLoading(true);
    try {
      const response = await AdminOrderService.getOrders(buildFilterParams());
      setOrders(response.items);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setSelectedIds(new Set());
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể tải danh sách đơn hàng."));
    } finally {
      setLoading(false);
    }
  }, [buildFilterParams, dateRangeError]);

  const fetchSummary = useCallback(async () => {
    if (dateRangeError || !dateRange.from || !dateRange.to) return;
    try {
      setSummary(await AdminDashboardService.getSummary({ from: dateRange.from, to: dateRange.to }));
    } catch {
      toast.error("Không thể tải chỉ số đơn hàng trong kỳ.");
    }
  }, [dateRange.from, dateRange.to, dateRangeError]);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);
  useEffect(() => { void fetchSummary(); }, [fetchSummary]);

  const handleOpenDetail = useCallback(async (order: OrderResponse, updateUrl = true) => {
    openedOrderIdRef.current = order.id;
    setSelectedOrder(order);
    if (updateUrl) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("orderId", String(order.id));
      setSearchParams(nextParams);
    }
    setDetailLoading(true);
    try {
      setSelectedOrder(await AdminOrderService.getOrderById(order.id));
    } catch {
      toast.error("Không thể tải chi tiết đơn hàng.");
    } finally {
      setDetailLoading(false);
    }
  }, [searchParams, setSearchParams]);

  const handleCloseDetail = useCallback(() => {
    setSelectedOrder(null);
    openedOrderIdRef.current = null;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("orderId");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleCloseStatusModal = useCallback(() => {
    setStatusModalOpen(false);
  }, []);

  useEffect(() => {
    if (!isStatusModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isStatusModalOpen) handleCloseStatusModal();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCloseStatusModal, isStatusModalOpen]);

  const actionParam = searchParams.get("action");
  useEffect(() => {
    if (actionParam !== "create") return;
    setCreateModalOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("action");
    setSearchParams(nextParams, { replace: true });
  }, [actionParam, searchParams, setSearchParams]);

  const orderIdParam = searchParams.get("orderId");
  useEffect(() => {
    const orderId = Number(orderIdParam);
    if (!Number.isInteger(orderId) || orderId <= 0 || openedOrderIdRef.current === orderId) return;
    let active = true;
    openedOrderIdRef.current = orderId;
    setDetailLoading(true);
    void AdminOrderService.getOrderById(orderId)
      .then((order) => { if (active) setSelectedOrder(order); })
      .catch(() => { if (active) toast.error("Không thể tải chi tiết đơn hàng."); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [orderIdParam]);

  const updateQueryFilter = useCallback((key: string, value: string, emptyValue = "ALL") => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === emptyValue) nextParams.delete(key);
    else nextParams.set(key, value);
    nextParams.delete("orderId");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleStatusChange = (status: OrderStatusFilter) => {
    setSelectedStatus(status);
    setPage(0);
    updateQueryFilter("status", status);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSelectedStatus("ALL");
    setSelectedPaymentStatus("ALL");
    setSelectedPaymentMethod("ALL");
    setDraftPaymentStatus("ALL");
    setDraftPaymentMethod("ALL");
    setMinAmount("");
    setMaxAmount("");
    setAppliedMinAmount("");
    setAppliedMaxAmount("");
    setDateRange(createAdminDateRange("thirtyDays"));
    setPage(0);
    setSearchParams({});
    toast.success("Đã cài lại bộ lọc");
  };

  const handleApplyBillingFilters = () => {
    if (amountError) return;
    setSelectedPaymentStatus(draftPaymentStatus);
    setSelectedPaymentMethod(draftPaymentMethod);
    setAppliedMinAmount(minAmount);
    setAppliedMaxAmount(maxAmount);
    setPage(0);
    const nextParams = new URLSearchParams(searchParams);
    if (draftPaymentStatus === "ALL") nextParams.delete("paymentStatus");
    else nextParams.set("paymentStatus", draftPaymentStatus);
    if (draftPaymentMethod === "ALL") nextParams.delete("paymentMethod");
    else nextParams.set("paymentMethod", draftPaymentMethod);
    if (minAmount) nextParams.set("minAmount", minAmount);
    else nextParams.delete("minAmount");
    if (maxAmount) nextParams.set("maxAmount", maxAmount);
    else nextParams.delete("maxAmount");
    nextParams.delete("orderId");
    setSearchParams(nextParams, { replace: true });
  };

  const handleUpdateStatus = async (status: OrderResponse["status"]) => {
    if (!selectedOrder) return;
    const toastId = toast.loading("Đang cập nhật trạng thái...");
    try {
      const updatedOrder = await AdminOrderService.updateOrderStatus(selectedOrder.id, status);
      setSelectedOrder(updatedOrder);
      setStatusModalOpen(false);
      await Promise.all([fetchOrders(), fetchSummary()]);
      toast.success("Cập nhật trạng thái thành công", { id: toastId });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Cập nhật trạng thái thất bại."), { id: toastId });
    }
  };

  const handleDispatchShipment = async () => {
    if (!selectedOrder || dispatchingShipment) return;
    setDispatchingShipment(true);
    const toastId = toast.loading("Đang tạo vận đơn GHN...");
    try {
      const shipment = await AdminOrderService.dispatchShipment(selectedOrder.id);
      setStatusModalOpen(false);
      const [updatedDetail] = await Promise.all([
        AdminOrderService.getOrderById(selectedOrder.id),
        fetchOrders(),
        fetchSummary(),
      ]);
      setSelectedOrder(updatedDetail);
      toast.success(`Đã tạo vận đơn ${shipment.providerOrderCode}`, { id: toastId });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Tạo vận đơn GHN thất bại."), { id: toastId });
    } finally {
      setDispatchingShipment(false);
    }
  };

  const exportOrders = useCallback(async () => {
    if (dateRangeError) return;
    const toastId = toast.loading("Đang chuẩn bị dữ liệu xuất...");
    try {
      const response = await AdminOrderService.getOrders(buildFilterParams(0, Math.min(Math.max(totalElements, 100), 2000)));
      const rows = [
        ["Mã đơn", "Mã vận đơn GHN", "Khách hàng", "Số điện thoại", "Ngày đặt", "Trạng thái", "Thanh toán", "Phương thức", "Tổng tiền", "Ghi chú"],
        ...response.items.map((order) => [
          getOrderDisplayCode(order),
          order.ghnOrderCode ?? "",
          order.shippingName,
          order.shippingPhone,
          formatOrderDateTime(order.createdAt),
          ORDER_STATUS_META[order.status].label,
          PAYMENT_STATUS_META[order.paymentStatus].label,
          order.paymentMethod,
          order.finalAmount,
          order.note ?? "",
        ]),
      ];
      const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `peaksneaker-orders-${dateRange.from}-${dateRange.to}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${response.items.length} đơn hàng`, { id: toastId });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể xuất danh sách đơn hàng."), { id: toastId });
    }
  }, [buildFilterParams, dateRange.from, dateRange.to, dateRangeError, totalElements]);

  useEffect(() => {
    const handleExport = () => { void exportOrders(); };
    window.addEventListener("admin:export", handleExport);
    return () => window.removeEventListener("admin:export", handleExport);
  }, [exportOrders]);

  const printableOrdersOnPage = useMemo(
    () => orders.filter((order) => Boolean(order.ghnOrderCode?.trim())),
    [orders],
  );
  const selectedPrintableOrders = useMemo(
    () => printableOrdersOnPage.filter((order) => selectedIds.has(order.id)),
    [printableOrdersOnPage, selectedIds],
  );
  const allVisibleSelected =
    printableOrdersOnPage.length > 0 &&
    printableOrdersOnPage.every((order) => selectedIds.has(order.id));
  const activeFilterCount = useMemo(() => [
    debouncedQuery.trim(),
    selectedStatus !== "ALL",
    selectedPaymentStatus !== "ALL",
    selectedPaymentMethod !== "ALL",
    appliedMinAmount,
    appliedMaxAmount,
  ].filter(Boolean).length, [appliedMaxAmount, appliedMinAmount, debouncedQuery, selectedPaymentMethod, selectedPaymentStatus, selectedStatus]);

  return (
    <div className="space-y-3 pb-6">
      <AdminPageHeader
        title="Đơn hàng"
        description="Quản lý, theo dõi và xử lý tất cả đơn hàng của cửa hàng."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void exportOrders()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Download className="h-4 w-4" /> Xuất báo cáo
            </button>
            <button
              type="button"
              onClick={() => {
                void fetchOrders();
                void fetchSummary();
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
            </button>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Tạo đơn hàng
            </button>
          </div>
        )}
      />

      <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:items-start">
      <div className="min-w-0 space-y-3">
      <div className="z-30 -mx-1 bg-slate-50 px-1 pb-2 2xl:sticky 2xl:-top-5">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <AdminFilterHeader
            isOpen={isFilterOpen}
            onToggle={() => setFilterOpen((current) => !current)}
            activeCount={activeFilterCount}
            onReset={handleResetFilters}
          />

          {isFilterOpen && (
            <div className="space-y-3 p-3">
              <div className="grid items-end gap-2 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.4fr)]">
              <label>
                <span className="sr-only">Tìm kiếm đơn hàng</span>
                <span className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setPage(0); }} placeholder="Mã đơn, mã vận đơn GHN, tên khách hàng, SĐT..." className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" />
                  {searchQuery && <button type="button" onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Xóa từ khóa"><X className="h-3.5 w-3.5" /></button>}
                </span>
              </label>
                <AdminDateRangeFilter value={dateRange} onChange={(value) => { setDateRange(value); setPage(0); }} title="Kỳ đơn hàng" allowAll={false} maxRangeDays={366} variant="toolbar" showPresets={false} />
              </div>

              <div className="grid items-end gap-2 border-t border-slate-100 pt-3 md:grid-cols-2 xl:grid-cols-[minmax(190px,1fr)_minmax(190px,1fr)_minmax(320px,1.4fr)_auto]">
                <label>
                  <span className="sr-only">Trạng thái thanh toán</span>
                  <select value={draftPaymentStatus} onChange={(event) => setDraftPaymentStatus(event.target.value as PaymentStatusFilter)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
                    {PAYMENT_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <label>
                  <span className="sr-only">Phương thức thanh toán</span>
                  <select value={draftPaymentMethod} onChange={(event) => setDraftPaymentMethod(event.target.value as PaymentMethodFilter)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
                    {PAYMENT_METHOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <fieldset className="md:col-span-2 xl:col-span-1">
                  <legend className="sr-only">Giá trị đơn hàng</legend>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="relative">
                      <span className="sr-only">Giá trị đơn từ</span>
                      <input id="order-min-amount" name="minAmount" type="number" inputMode="numeric" min="0" step="1000" value={minAmount} onChange={(event) => setMinAmount(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleApplyBillingFilters(); }} placeholder="Tối thiểu" className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">đ</span>
                    </label>
                    <label className="relative">
                      <span className="sr-only">Giá trị đơn đến</span>
                      <input id="order-max-amount" name="maxAmount" type="number" inputMode="numeric" min="0" step="1000" value={maxAmount} onChange={(event) => setMaxAmount(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleApplyBillingFilters(); }} placeholder="Tối đa" className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">đ</span>
                    </label>
                  </div>
                </fieldset>
                <button type="button" onClick={handleApplyBillingFilters} disabled={Boolean(amountError)} className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-slate-950 px-5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
                  <Search className="h-4 w-4" /> Áp dụng
                </button>
              </div>
              {amountError && <p className="text-xs font-semibold text-red-600" role="alert">Giá trị từ không được lớn hơn giá trị đến.</p>}
              {dateRangeError && <p className="text-xs font-semibold text-red-600" role="alert">{dateRangeError}</p>}
            </div>
          )}
        </section>
      </div>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <nav className="overflow-x-auto border-b border-slate-200 bg-slate-50/60 px-3 pb-2 pt-2.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-slate-100" aria-label="Lọc nhanh trạng thái đơn hàng">
            <div className="flex min-w-max gap-2">
              {ORDER_STATUS_OPTIONS.map((option) => {
                const active = selectedStatus === option.value;
                return (
                  <button key={option.value} type="button" onClick={() => handleStatusChange(option.value)} className={`inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors ${active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                    {option.label}<span className={`rounded-md px-2 py-0.5 text-[11px] ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>{getStatusCount(summary, option.value)}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {selectedPrintableOrders.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
              <span>Đã chọn <strong>{selectedPrintableOrders.length}</strong> đơn hàng đã có mã vận đơn GHN.</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBatchWaybillOpen(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  <Printer className="h-3.5 w-3.5" /> In vận đơn hàng loạt ({selectedPrintableOrders.length} đơn)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="inline-flex h-8 items-center rounded-lg border border-blue-200 bg-white px-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-px bg-slate-100 p-px" aria-label="Đang tải danh sách đơn hàng">
              {Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-14 animate-pulse bg-white" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="grid min-h-72 place-items-center p-8 text-center">
              <div><PackageOpen className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 text-sm font-black text-slate-800">Không tìm thấy đơn hàng</h2><p className="mt-1 text-xs text-slate-400">Hãy thay đổi điều kiện lọc hoặc cài lại bộ lọc.</p></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] table-fixed text-left text-xs">
                <colgroup>
                  <col className="w-11" /><col className="w-[17%]" /><col className="w-[16%]" /><col className="w-[10%]" />
                  <col className="w-[15%]" /><col className="w-[15%]" /><col className="w-[15%]" /><col className="w-[12%]" />
                </colgroup>
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-11 px-4 py-3.5">
                      <input
                        type="checkbox"
                        disabled={printableOrdersOnPage.length === 0}
                        checked={allVisibleSelected}
                        title={
                          printableOrdersOnPage.length > 0
                            ? "Chọn tất cả đơn hàng đã có mã vận đơn trên trang"
                            : "Chưa có đơn hàng nào trên trang có mã vận đơn GHN"
                        }
                        onChange={(event) =>
                          setSelectedIds(
                            event.target.checked
                              ? new Set(printableOrdersOnPage.map((order) => order.id))
                              : new Set(),
                          )
                        }
                        className="disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Chọn toàn bộ đơn hàng có mã vận đơn trên trang"
                      />
                    </th>
                    <th className="py-3.5">Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th className="pr-4">Ngày đặt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const status = ORDER_STATUS_META[order.status];
                    const payment = PAYMENT_STATUS_META[order.paymentStatus];
                    const isSelected = selectedOrder?.id === order.id;
                    const hasTrackingCode = Boolean(order.ghnOrderCode?.trim());
                    return (
                      <tr key={order.id} onClick={() => void handleOpenDetail(order)} className={`cursor-pointer transition-colors hover:bg-blue-50/30 ${isSelected ? "bg-blue-50/50" : "bg-white"}`}>
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            disabled={!hasTrackingCode}
                            checked={hasTrackingCode && selectedIds.has(order.id)}
                            title={
                              hasTrackingCode
                                ? `Chọn đơn ${getOrderDisplayCode(order)} để in vận đơn`
                                : "Đơn hàng chưa có mã vận đơn GHN nên chưa thể chọn in vận đơn"
                            }
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) =>
                              setSelectedIds((current) => {
                                const next = new Set(current);
                                if (event.target.checked && hasTrackingCode) next.add(order.id);
                                else next.delete(order.id);
                                return next;
                              })
                            }
                            className="disabled:cursor-not-allowed disabled:opacity-35"
                            aria-label={`Chọn đơn ${getOrderDisplayCode(order)}`}
                          />
                        </td>
                        <td className="py-3.5 pr-4">
                          <button type="button" onClick={(event) => { event.stopPropagation(); void handleOpenDetail(order); }} title={getOrderDisplayCode(order)} className="block max-w-full truncate whitespace-nowrap font-mono text-xs font-black text-blue-600 hover:underline">{getOrderDisplayCode(order)}</button>
                          {order.ghnOrderCode ? (
                            <span title={`Mã vận đơn GHN: ${order.ghnOrderCode}`} className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-700 ring-1 ring-blue-200">
                              <Truck className="h-2.5 w-2.5 shrink-0" />
                              {order.ghnOrderCode}
                            </span>
                          ) : order.status === "PROCESSING" ? (
                            <span className="mt-1 inline-block text-[10px] font-bold text-amber-600">Chờ tạo vận đơn</span>
                          ) : null}
                        </td>
                        <td className="pr-4"><p className="max-w-44 truncate text-sm font-bold text-slate-800">{order.shippingName}</p><p className="mt-1 text-xs text-slate-400">{order.shippingPhone}</p></td>
                        <td className="pr-4"><div className="flex items-center"><div className="flex -space-x-1.5">{order.items.slice(0, 2).map((item) => <span key={item.id} className="grid h-9 w-10 place-items-center overflow-hidden rounded-md border border-white bg-slate-50">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-contain" /> : <PackageOpen className="h-4 w-4 text-slate-300" />}</span>)}</div>{order.items.length > 2 && <span className="ml-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">+{order.items.length - 2}</span>}</div></td>
                        <td className="pr-4"><p className="text-sm font-black text-slate-900">{formatOrderCurrency(order.finalAmount)}</p><p className="mt-1 text-xs text-slate-400">{order.items.length} sản phẩm</p></td>
                        <td className="pr-4"><span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${payment.badgeClassName}`}>{payment.label}</span><p className="mt-1.5 text-xs font-semibold text-slate-500">{order.paymentMethod}</p></td>
                        <td className="pr-4">
                          <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.badgeClassName}`}>{status.label}</span>
                          {order.latestReturnId && (
                            <a
                              href={`/admin/returns?orderId=${order.id}`}
                              className="mt-1.5 block text-[11px] font-bold text-violet-600 hover:underline"
                            >
                              RMA #{order.latestReturnId} · {order.latestReturnStatus}
                            </a>
                          )}
                        </td>
                        <td className="pr-4 text-xs text-slate-500"><span className="whitespace-nowrap">{formatOrderDateTime(order.createdAt)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            visibleCount={orders.length}
            itemLabel="đơn hàng"
            disabled={loading}
            onPageChange={setPage}
            className="bg-slate-50"
          />
      </section>
      </div>
      <AdminDetailPanel ariaLabel={selectedOrder ? "Chi tiết đơn hàng" : "Chưa chọn đơn hàng"}>
        {selectedOrder || detailLoading ? (
          <AdminOrderDetailPanel
            order={selectedOrder}
            loading={detailLoading}
            onClose={handleCloseDetail}
            onManage={() => setStatusModalOpen(true)}
            onDispatchShipment={handleDispatchShipment}
            dispatchingShipment={dispatchingShipment}
          />
        ) : (
          <AdminDetailEmptyState
            icon={<PackageOpen className="h-9 w-9" />}
            title="Chưa chọn đơn hàng"
            description="Chọn một đơn hàng trong danh sách để xem thông tin, trạng thái và in phiếu vận đơn."
            items={["Thông tin khách hàng & sản phẩm", "Cập nhật trạng thái đơn hàng", "Tạo & in mã vận đơn GHN"]}
          />
        )}
      </AdminDetailPanel>
      </div>

      {isStatusModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) handleCloseStatusModal(); }}>
          <section className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="order-status-title">
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div><h2 id="order-status-title" className="text-base font-black text-slate-950">Xử lý đơn hàng</h2><p className="mt-1 font-mono text-xs text-slate-400">{getOrderDisplayCode(selectedOrder)}</p></div>
              <button type="button" onClick={handleCloseStatusModal} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button>
            </header>
            <div className="space-y-2 p-4">
              {selectedOrder.status === "PENDING" && (
                <button type="button" onClick={() => void handleUpdateStatus("CONFIRMED")} className="flex w-full items-center gap-4 rounded-lg border border-slate-200 p-4 text-left hover:border-sky-300 hover:bg-sky-50">
                  <Check className="h-6 w-6 text-sky-500" />
                  <span><strong className="block text-sm text-slate-800">Xác nhận đơn hàng</strong><small className="mt-1 block text-xs text-slate-400">Đã kiểm tra thông tin và tiếp nhận đơn</small></span>
                </button>
              )}
              {selectedOrder.status === "CONFIRMED" && (
                <button type="button" onClick={() => void handleUpdateStatus("PROCESSING")} className="flex w-full items-center gap-4 rounded-lg border border-slate-200 p-4 text-left hover:border-violet-300 hover:bg-violet-50">
                  <PackageOpen className="h-6 w-6 text-violet-500" />
                  <span><strong className="block text-sm text-slate-800">Bắt đầu xử lý</strong><small className="mt-1 block text-xs text-slate-400">Soạn hàng, đóng gói và chuẩn bị bàn giao</small></span>
                </button>
              )}
              {selectedOrder.status === "PROCESSING" && !selectedOrder.ghnOrderCode && (
                <button type="button" onClick={() => void handleDispatchShipment()} className="flex w-full items-center gap-4 rounded-lg border border-slate-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50">
                  <Truck className="h-6 w-6 text-blue-500" />
                  <span><strong className="block text-sm text-slate-800">Tạo vận đơn GHN</strong><small className="mt-1 block text-xs text-slate-400">Gửi thông tin đơn sang môi trường vận chuyển đã cấu hình</small></span>
                </button>
              )}
              {selectedOrder.status === "PROCESSING" && selectedOrder.ghnOrderCode && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  <strong className="block">Đang chờ GHN lấy hàng</strong>
                  <span className="mt-1 block text-xs">Vận đơn {selectedOrder.ghnOrderCode}. Trạng thái sẽ tự cập nhật qua webhook.</span>
                </div>
              )}
              {selectedOrder.status === "SHIPPING" && !selectedOrder.ghnOrderCode && (
                <button type="button" onClick={() => void handleUpdateStatus("DELIVERED")} className="flex w-full items-center gap-4 rounded-lg border border-slate-200 p-4 text-left hover:border-teal-300 hover:bg-teal-50">
                  <Check className="h-6 w-6 text-teal-500" />
                  <span><strong className="block text-sm text-slate-800">Xác nhận đã giao</strong><small className="mt-1 block text-xs text-slate-400">Khách hàng đã nhận được hàng</small></span>
                </button>
              )}
              {selectedOrder.status === "SHIPPING" && selectedOrder.ghnOrderCode && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  <strong className="block">GHN đang vận chuyển</strong>
                  <span className="mt-1 block text-xs">Không cập nhật thủ công. Hệ thống sẽ ghi nhận khi webhook báo giao thành công.</span>
                </div>
              )}
              {selectedOrder.status === "DELIVERED" && (
                <button type="button" onClick={() => void handleUpdateStatus("COMPLETED")} className="flex w-full items-center gap-4 rounded-lg border border-slate-200 p-4 text-left hover:border-emerald-300 hover:bg-emerald-50">
                  <Check className="h-6 w-6 text-emerald-500" />
                  <span><strong className="block text-sm text-slate-800">Hoàn tất đơn hàng</strong><small className="mt-1 block text-xs text-slate-400">Kết thúc quy trình giao nhận của đơn hàng</small></span>
                </button>
              )}
              {(selectedOrder.status === "PENDING" || selectedOrder.status === "CONFIRMED") && (
                <button type="button" onClick={() => void handleUpdateStatus("CANCELLED")} className="flex w-full items-center gap-4 rounded-lg border border-slate-200 p-4 text-left hover:border-red-300 hover:bg-red-50">
                  <XCircle className="h-6 w-6 text-red-500" />
                  <span><strong className="block text-sm text-slate-800">Hủy đơn hàng</strong><small className="mt-1 block text-xs text-slate-400">Dừng xử lý và hoàn lại tồn kho đã giữ</small></span>
                </button>
              )}
              {(selectedOrder.status === "COMPLETED" || selectedOrder.status === "CANCELLED") && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Đơn hàng đã ở trạng thái kết thúc và không còn hành động chuyển trạng thái.
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {isBatchWaybillOpen && selectedPrintableOrders.length > 0 && (
        <AdminOrderWaybillModal
          orders={selectedPrintableOrders}
          onClose={() => setBatchWaybillOpen(false)}
        />
      )}

      <AdminCreateOrderModal
        open={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(createdOrder) => {
          setSelectedOrder(createdOrder);
          void fetchOrders();
          void fetchSummary();
        }}
      />
    </div>
  );
}

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarDays,
  ChevronDown,
  CircleX,
  CircleDollarSign,
  Download,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardWorkspace from "../../components/admin/dashboard/DashboardWorkspace";
import AdminDateRangeFilter from "../../components/admin/AdminDateRangeFilter";
import AdminMetricCard, { type AdminMetricTone } from "../../components/admin/AdminMetricCard";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import {
  createAdminDateRange,
  getAdminDateRangeError,
  getAdminDateRangeLabel,
  type AdminDateRangeValue,
} from "../../utils/adminDateRange";
import {
  AdminBatchesService,
  type AuditLogItem,
} from "../../services/admin/adminBatchesService";
import {
  AdminDashboardService,
  type DashboardSummaryResponse,
  type RevenueChartResponse,
} from "../../services/admin/adminDashboardService";
import {
  AdminOrderService,
  type OrderResponse,
} from "../../services/admin/adminOrderService";
import { AdminReturnsService } from "../../services/admin/adminReturnsService";

interface DashboardMetric {
  label: string;
  value: string;
  change?: number;
  helper: string;
  icon: LucideIcon;
  tone: AdminMetricTone;
  positiveIsGood?: boolean;
}

interface UrgentTask {
  title: string;
  value: string;
  helper: string;
  path: string;
  icon: LucideIcon;
  tone: "blue" | "violet" | "red" | "orange";
}

const URGENT_TONE_CLASSES: Record<UrgentTask["tone"], string> = {
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  red: "bg-red-50 text-red-600",
  orange: "bg-orange-50 text-orange-600",
};

const PAYMENT_COLORS = ["#10b981", "#6366f1"];

const formatVND = (value: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatCompactVND = (value: number): string =>
  `${new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)} ₫`;

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-label="Đang tải dữ liệu tổng quan">
      <div className="h-40 rounded-xl border border-slate-200 bg-white" />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
        <div className="h-10 bg-white" />
        <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 bg-white" />
          ))}
        </div>
      </div>
      <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-28 bg-white" />
        ))}
      </div>
      <div className="grid gap-5 2xl:grid-cols-12">
        <div className="h-[440px] rounded-2xl border border-zinc-200 bg-white 2xl:col-span-8" />
        <div className="h-[440px] rounded-2xl border border-zinc-200 bg-white 2xl:col-span-4" />
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-full place-items-center rounded-xl bg-zinc-50 text-center text-sm text-zinc-400">
      {message}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin =
    user?.role === "ROLE_SUPER_ADMIN" ||
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ROLE_ADMIN" ||
    user?.role === "ADMIN";

  const [range, setRange] = useState<AdminDateRangeValue>(() => createAdminDateRange("thirtyDays"));
  const [isDateFilterOpen, setDateFilterOpen] = useState(true);
  const rangeError = getAdminDateRangeError(range, 366);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueChartResponse[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [pendingOrderTotal, setPendingOrderTotal] = useState(0);
  const [requestedReturns, setRequestedReturns] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [hasPartialData, setHasPartialData] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (rangeError || !range.from || !range.to) {
      setIsInitialLoading(false);
      setIsRefreshing(false);
      return;
    }

    setIsRefreshing(true);

    try {
      setError(null);
      const periodParams = { from: range.from, to: range.to };
      const [summaryResponse, chartResponse] = await Promise.all([
        AdminDashboardService.getSummary(periodParams),
        AdminDashboardService.getRevenueChart(periodParams),
      ]);

      const [ordersResult, pendingOrdersResult, returnsResult, auditsResult] = await Promise.allSettled([
        AdminOrderService.getOrders({ page: 0, size: 5 }),
        AdminOrderService.getOrders({ status: "PENDING", page: 0, size: 1 }),
        AdminReturnsService.getReturns({ status: "REQUESTED", page: 0, size: 1 }),
        AdminBatchesService.getAuditLogs({ page: 0, size: 8 }),
      ]);

      if (requestId !== requestIdRef.current) return;

      setSummary(summaryResponse);
      setRevenueData(chartResponse);
      setHasPartialData(
        [ordersResult, pendingOrdersResult, returnsResult, auditsResult].some(
          (result) => result.status === "rejected",
        ),
      );

      if (ordersResult.status === "fulfilled") {
        setOrders(ordersResult.value.items);
      }
      if (pendingOrdersResult.status === "fulfilled") {
        setPendingOrderTotal(pendingOrdersResult.value.totalElements);
      }
      if (returnsResult.status === "fulfilled") {
        setRequestedReturns(returnsResult.value.totalElements);
      }
      if (auditsResult.status === "fulfilled") {
        setAuditLogs(auditsResult.value.items);
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setError("Không thể tải dữ liệu vận hành. Vui lòng kiểm tra kết nối và thử lại.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [range.from, range.to, rangeError]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const exportDashboardCsv = useCallback(() => {
    if (!summary) return;
    const rows = [
      ["Báo cáo PeakSneaker", getAdminDateRangeLabel(range)],
      ["Từ ngày", summary.periodStart],
      ["Đến ngày", summary.periodEnd],
      ["Doanh thu", summary.totalRevenue],
      ["Tổng đơn", summary.totalOrders],
      ["Đơn hoàn thành", summary.completedOrders],
      ["Đơn hủy", summary.cancelledOrders],
      ["Khách hàng mới", summary.newCustomers],
      ["Tỷ lệ hoàn tất", `${summary.conversionRate}%`],
      [],
      ["Ngày", "Doanh thu"],
      ...revenueData.map((item) => [item.date, item.revenue]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `peaksneaker-dashboard-${range.from}-${range.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [range, revenueData, summary]);

  useEffect(() => {
    const handleExport = () => exportDashboardCsv();
    window.addEventListener("admin:export", handleExport);
    return () => window.removeEventListener("admin:export", handleExport);
  }, [exportDashboardCsv]);

  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

  if (!summary || error) {
    return (
      <section className="grid min-h-[460px] place-items-center rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="max-w-md">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-zinc-950">Không thể tải tổng quan</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{error}</p>
          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={isRefreshing}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Thử tải lại
          </button>
        </div>
      </section>
    );
  }

  const paidRate = summary.totalOrders > 0
    ? Math.round((summary.paidOrders / summary.totalOrders) * 1000) / 10
    : 0;
  const paymentTotal = summary.codOrders + summary.vnpayOrders;
  const paymentData = [
    { name: "VNPAY", value: summary.vnpayOrders },
    { name: "COD", value: summary.codOrders },
  ];

  const metrics: DashboardMetric[] = [
    {
      label: "Tổng doanh thu",
      value: isSuperAdmin ? formatVND(summary.totalRevenue) : "•••••••• ₫",
      change: isSuperAdmin ? summary.revenueChange : undefined,
      helper: isSuperAdmin ? "so với kỳ trước" : "Bảo mật Ban Giám Đốc",
      icon: CircleDollarSign,
      tone: isSuperAdmin ? "emerald" : "slate",
    },
    {
      label: "Tổng đơn hàng",
      value: summary.totalOrders.toLocaleString("vi-VN"),
      change: summary.ordersChange,
      helper: `${summary.cancelledOrders} đơn hủy`,
      icon: ShoppingBag,
      tone: "violet",
    },
    {
      label: "Giá trị TB / đơn",
      value: isSuperAdmin ? formatVND(summary.averageOrderValue) : "•••••••• ₫",
      change: isSuperAdmin ? summary.averageOrderValueChange : undefined,
      helper: isSuperAdmin ? "trên đơn hoàn thành" : "Bảo mật Ban Giám Đốc",
      icon: WalletCards,
      tone: isSuperAdmin ? "orange" : "slate",
    },
    {
      label: "Khách hàng mới",
      value: summary.newCustomers.toLocaleString("vi-VN"),
      change: summary.customersChange,
      helper: "so với kỳ trước",
      icon: Users,
      tone: "blue",
    },
    {
      label: "Tỷ lệ hoàn tất",
      value: `${summary.conversionRate}%`,
      change: summary.conversionRateChange,
      helper: `${paidRate}% đơn đã thanh toán`,
      icon: Activity,
      tone: "slate",
    },
    {
      label: "Tỷ lệ hủy đơn",
      value: `${summary.cancellationRate}%`,
      change: summary.cancellationRateChange,
      helper: `${summary.cancelledOrders} đơn đã hủy`,
      icon: CircleX,
      tone: "red",
      positiveIsGood: false,
    },
  ];

  const urgentTasks: UrgentTask[] = [
    {
      title: "Đơn chờ xác nhận",
      value: `${pendingOrderTotal} đơn hàng`,
      helper: "Mở hàng đợi xử lý đơn",
      path: "/admin/orders?status=PENDING",
      icon: Package,
      tone: "blue",
    },
    {
      title: "Thanh toán bất thường",
      value: `${summary.failedPaymentCount} giao dịch`,
      helper: "Đơn cần đối soát thanh toán",
      path: "/admin/orders?paymentStatus=FAILED",
      icon: AlertTriangle,
      tone: "red",
    },
    {
      title: "Yêu cầu đổi trả mới",
      value: `${requestedReturns} yêu cầu`,
      helper: "Cần phản hồi khách hàng",
      path: "/admin/returns?status=REQUESTED",
      icon: RotateCcw,
      tone: "orange",
    },
    {
      title: "Tồn kho rủi ro",
      value: `${summary.lowStockCount} SKU`,
      helper: "Sắp hết hoặc đã hết hàng",
      path: "/admin/forecast?status=CRITICAL",
      icon: Boxes,
      tone: "violet",
    },
  ];

  const orderStatusData = [
    { label: "Chờ xác nhận", value: summary.orderStatusCounts.PENDING ?? 0, color: "bg-amber-400" },
    { label: "Đang xử lý", value: (summary.orderStatusCounts.CONFIRMED ?? 0) + (summary.orderStatusCounts.PROCESSING ?? 0), color: "bg-blue-500" },
    { label: "Đang giao", value: (summary.orderStatusCounts.SHIPPING ?? 0) + (summary.orderStatusCounts.DELIVERED ?? 0), color: "bg-violet-500" },
    { label: "Hoàn thành", value: summary.orderStatusCounts.COMPLETED ?? 0, color: "bg-emerald-500" },
    { label: "Đã hủy", value: summary.orderStatusCounts.CANCELLED ?? 0, color: "bg-red-500" },
  ];
  return (
    <div className="flex flex-col gap-3 pb-6 print:bg-white print:p-0" aria-busy={isRefreshing}>
      <AdminPageHeader
        title="Tổng quan vận hành"
        description="Theo dõi hiệu suất kinh doanh và các hoạt động quan trọng của PeakSneaker."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportDashboardCsv}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Download className="h-4 w-4" /> Xuất báo cáo
            </button>
            <button
              type="button"
              onClick={() => void fetchData()}
              disabled={isRefreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} /> Làm mới
            </button>
          </div>
        }
      />

      <div className="sticky -top-3 z-30 -mx-1 bg-slate-50/95 px-1 pb-2 backdrop-blur-sm sm:-top-4 lg:-top-5 print:static print:mx-0 print:bg-transparent print:p-0 print:backdrop-blur-none">
        <AdminPanel
          title={(
            <button type="button" onClick={() => setDateFilterOpen((current) => !current)} className="flex min-w-0 items-center gap-2 py-3 text-left" aria-expanded={isDateFilterOpen}>
              <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" />
              <span>Kỳ báo cáo</span>
              <span className="hidden truncate text-xs font-semibold text-slate-400 sm:inline">{getAdminDateRangeLabel(range)}</span>
            </button>
          )}
          action={(
            <button type="button" onClick={() => setDateFilterOpen((current) => !current)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700" aria-label={isDateFilterOpen ? "Thu gọn bộ lọc thời gian" : "Mở bộ lọc thời gian"}>
              <ChevronDown className={`h-4 w-4 transition-transform ${isDateFilterOpen ? "rotate-180" : ""}`} />
            </button>
          )}
          headerClassName="min-h-12 py-0 print:hidden"
          contentClassName={isDateFilterOpen ? "p-3" : "hidden"}
        >
          <AdminDateRangeFilter
            value={range}
            onChange={setRange}
            title="Kỳ báo cáo"
            allowAll={false}
            maxRangeDays={366}
            variant="toolbar"
            className="print:hidden"
          />
        </AdminPanel>
      </div>

      <AdminPanel
        title="Ưu tiên hôm nay"
        description="Các luồng cần xử lý trước để bảo đảm SLA vận hành."
        action={<span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{urgentTasks.length} luồng</span>}
        contentClassName="grid gap-2 bg-slate-50 p-2 sm:grid-cols-2 xl:grid-cols-4"
      >
            {urgentTasks.map(({ title, value, helper, path, icon: Icon, tone }) => (
              <Link
                key={title}
                to={path}
                className="group flex min-h-24 min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${URGENT_TONE_CLASSES[tone]}`}>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.04em] text-slate-500">{title}</p>
                  <p className="mt-1 text-lg font-black leading-none tracking-tight text-slate-950">{value}</p>
                  <p className="mt-2 truncate text-[10px] text-slate-400">{helper}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-900" />
              </Link>
            ))}
      </AdminPanel>

      <AdminPanel title="KPI cốt lõi" contentClassName="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric) => <AdminMetricCard key={metric.label} {...metric} />)}
      </AdminPanel>

      <section className="grid gap-2.5 2xl:grid-cols-12">
        <AdminPanel
          title={isSuperAdmin ? "Doanh thu & số đơn hàng" : "Biến động số lượng đơn hàng"}
          description={isSuperAdmin ? "Doanh thu hoàn tất và tổng số đơn phát sinh trong kỳ" : "Theo dõi lượng đơn phát sinh trong kỳ (Doanh thu tài chính bảo mật Ban Giám Đốc)"}
          className="2xl:col-span-7"
          contentClassName="px-3 pb-2 pt-1"
        >
          <div className="mb-1 flex gap-4 text-[10px] font-semibold text-slate-500">
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" />Doanh thu</span>
            )}
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-500" />Số đơn hàng</span>
          </div>
          <div className="h-52">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                  {isSuperAdmin && (
                    <YAxis yAxisId="revenue" axisLine={false} tickLine={false} width={58} tick={{ fill: "#94a3b8", fontSize: 9 }} tickFormatter={formatCompactVND} />
                  )}
                  <YAxis yAxisId="orders" orientation={isSuperAdmin ? "right" : "left"} axisLine={false} tickLine={false} width={28} allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === "orderCount"
                        ? [`${Number(value)} đơn`, "Số đơn"]
                        : isSuperAdmin
                        ? [formatVND(Number(value)), "Doanh thu"]
                        : ["Bảo mật", "Doanh thu"]
                    }
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11 }}
                  />
                  {isSuperAdmin && (
                    <Area yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#dashboardRevenueFill)" />
                  )}
                  <Line yAxisId="orders" type="monotone" dataKey="orderCount" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Chưa có dữ liệu trong kỳ đã chọn" />
            )}
          </div>
        </AdminPanel>

        <AdminPanel title="Cơ cấu thanh toán" description="Theo phương thức khách lựa chọn" className="2xl:col-span-3" contentClassName="grid grid-cols-[minmax(130px,1fr)_1fr] items-center gap-2 px-3 py-2">
          <div className="relative h-44">{paymentTotal > 0 ? <><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentData} dataKey="value" cx="50%" cy="50%" innerRadius={46} outerRadius={68} paddingAngle={2} stroke="none">{paymentData.map((item, index) => <Cell key={item.name} fill={PAYMENT_COLORS[index]} />)}</Pie><Tooltip formatter={(value) => [`${Number(value)} đơn`, "Số lượng"]} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-xl font-black text-slate-950">{paymentTotal}</p><p className="text-[9px] text-slate-400">đơn hàng</p></div></div></> : <EmptyChart message="Chưa có dữ liệu" />}</div>
          <div className="space-y-3">{paymentData.map((item, index) => <div key={item.name} className="text-[10px]"><div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5 text-slate-600"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[index] }} />{item.name}</span><strong>{paymentTotal > 0 ? Math.round((item.value / paymentTotal) * 100) : 0}%</strong></div><p className="mt-0.5 text-right text-slate-400">{item.value} đơn</p></div>)}</div>
        </AdminPanel>

        <AdminPanel title="Trạng thái đơn hàng" description="Phân bổ trong kỳ" className="2xl:col-span-2" contentClassName="space-y-2.5 px-3 py-3">
          {orderStatusData.map((status) => { const percent = summary.totalOrders > 0 ? (status.value / summary.totalOrders) * 100 : 0; return <div key={status.label} className="text-[10px]"><div className="mb-1 flex justify-between gap-2"><span className="text-slate-600">{status.label}</span><span><strong>{status.value}</strong><span className="ml-2 text-slate-400">{percent.toFixed(1)}%</span></span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${status.color}`} style={{ width: `${Math.max(percent, status.value > 0 ? 3 : 0)}%` }} /></div></div>; })}
        </AdminPanel>
      </section>

      <DashboardWorkspace
        orders={orders.slice(0, 5)}
        products={summary.topProducts ?? []}
        brands={summary.brandSales ?? []}
        lowStockItems={summary.lowStockItems ?? []}
        audits={auditLogs}
        hasPartialData={hasPartialData}
      />
    </div>
  );
}

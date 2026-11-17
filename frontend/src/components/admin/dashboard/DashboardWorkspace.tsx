import { AlertTriangle, ArrowRight, Box, PackageCheck, ShieldCheck, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { AuditLogItem } from "../../../services/admin/adminBatchesService";
import type { OrderResponse } from "../../../services/admin/adminOrderService";
import type {
  BrandSalesResponse,
  LowStockItemResponse,
  TopProductResponse,
} from "../../../services/admin/adminDashboardService";
import AdminPanel from "../AdminPanel";

interface DashboardWorkspaceProps {
  orders: OrderResponse[];
  products: TopProductResponse[];
  brands: BrandSalesResponse[];
  lowStockItems: LowStockItemResponse[];
  audits: AuditLogItem[];
  hasPartialData: boolean;
}

const formatVND = (value: number): string =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const formatRelativeTime = (value: string): string => {
  const differenceMinutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (differenceMinutes < 1) return "Vừa xong";
  if (differenceMinutes < 60) return `${differenceMinutes} phút trước`;
  const hours = Math.floor(differenceMinutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
};

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  CONFIRMED: { label: "Đã xác nhận", className: "bg-sky-50 text-sky-700 ring-sky-200" },
  PROCESSING: { label: "Đang xử lý", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  SHIPPING: { label: "Đang giao", className: "bg-violet-50 text-violet-700 ring-violet-200" },
  DELIVERED: { label: "Đã giao", className: "bg-teal-50 text-teal-700 ring-teal-200" },
  COMPLETED: { label: "Hoàn thành", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  CANCELLED: { label: "Đã hủy", className: "bg-red-50 text-red-700 ring-red-200" },
};

function ProductRanking({ products, brands }: Pick<DashboardWorkspaceProps, "products" | "brands">) {
  const [mode, setMode] = useState<"products" | "brands">("products");
  const maxProductQuantity = Math.max(...products.map((product) => product.quantitySold), 1);
  const maxBrandSales = Math.max(...brands.map((brand) => brand.grossSales), 1);

  return (
    <AdminPanel
      title="Top sản phẩm / thương hiệu bán chạy"
      action={(
        <div className="flex rounded-md bg-slate-100 p-0.5">
          <button type="button" onClick={() => setMode("products")} className={`rounded px-3 py-1 text-[10px] font-bold ${mode === "products" ? "bg-slate-950 text-white" : "text-slate-500"}`}>Sản phẩm</button>
          <button type="button" onClick={() => setMode("brands")} className={`rounded px-3 py-1 text-[10px] font-bold ${mode === "brands" ? "bg-slate-950 text-white" : "text-slate-500"}`}>Thương hiệu</button>
        </div>
      )}
      contentClassName="p-0"
    >
      <div className="divide-y divide-slate-100">
        {mode === "products" ? products.slice(0, 5).map((product, index) => (
          <div key={product.productId} className="grid grid-cols-[22px_minmax(0,1fr)_52px_minmax(70px,1fr)_112px] items-center gap-2 px-3 py-1.5 text-[10px]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 font-black text-slate-600">{index + 1}</span>
            <div className="flex min-w-0 items-center gap-2">
              <div className="h-7 w-9 shrink-0 overflow-hidden rounded bg-slate-50">
                {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-contain" /> : <Box className="m-1.5 h-4 w-4 text-slate-300" />}
              </div>
              <span className="truncate font-semibold text-slate-700">{product.productName}</span>
            </div>
            <strong className="text-right text-slate-700">{product.quantitySold}</strong>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(8, (product.quantitySold / maxProductQuantity) * 100)}%` }} /></div>
            <strong className="text-right text-slate-900">{formatVND(product.grossSales)}</strong>
          </div>
        )) : brands.slice(0, 5).map((brand, index) => (
          <div key={brand.brandName} className="grid grid-cols-[22px_minmax(0,1fr)_minmax(90px,1fr)_112px] items-center gap-2 px-3 py-2 text-[10px]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 font-black text-slate-600">{index + 1}</span>
            <span className="truncate font-semibold text-slate-700">{brand.brandName}</span>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(8, (brand.grossSales / maxBrandSales) * 100)}%` }} /></div>
            <strong className="text-right text-slate-900">{formatVND(brand.grossSales)}</strong>
          </div>
        ))}
        {((mode === "products" && products.length === 0) || (mode === "brands" && brands.length === 0)) && <p className="px-4 py-8 text-center text-xs text-slate-400">Chưa có dữ liệu bán hàng trong kỳ.</p>}
      </div>
    </AdminPanel>
  );
}

function LowStockTable({ items }: { items: LowStockItemResponse[] }) {
  return (
    <AdminPanel title="Tồn kho cần chú ý" action={<Link to="/admin/forecast?status=CRITICAL" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600">Xem tất cả <ArrowRight className="h-3 w-3" /></Link>} contentClassName="p-0">
      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const isOut = item.stock <= 0;
          return (
            <Link to={`/admin/inventory?productId=${item.productId}&variantId=${item.variantId}`} key={item.variantId} className="grid grid-cols-[minmax(0,1fr)_minmax(90px,0.8fr)_42px_86px] items-center gap-2 px-3 py-1.5 text-[10px] transition-colors hover:bg-slate-50">
              <div className="flex min-w-0 items-center gap-2">
                <div className="h-7 w-9 shrink-0 overflow-hidden rounded bg-slate-50">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-contain" /> : <Box className="m-1.5 h-4 w-4 text-slate-300" />}</div>
                <span className="truncate font-semibold text-slate-700">{item.productName}</span>
              </div>
              <span className="truncate text-slate-500">{item.sku} · {item.color} / {item.size}</span>
              <strong className={isOut ? "text-red-600" : "text-amber-600"}>{item.stock}</strong>
              <span className={`rounded-full px-2 py-0.5 text-center font-bold ring-1 ring-inset ${isOut ? "bg-red-50 text-red-600 ring-red-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>{isOut ? "Hết hàng" : "Sắp hết"}</span>
            </Link>
          );
        })}
        {items.length === 0 && <p className="px-4 py-8 text-center text-xs text-slate-400">Không có biến thể tồn kho thấp.</p>}
      </div>
    </AdminPanel>
  );
}

function RecentOrders({ orders }: { orders: OrderResponse[] }) {
  return (
    <AdminPanel title="Đơn hàng gần đây" action={<Link to="/admin/orders" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600">Xem tất cả <ArrowRight className="h-3 w-3" /></Link>} contentClassName="overflow-x-auto p-0">
      <table className="w-full min-w-[720px] text-left text-[10px]">
        <thead className="bg-slate-50 font-bold uppercase tracking-wide text-slate-400"><tr><th className="px-3 py-1.5">Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Trạng thái</th><th>Thanh toán</th><th>Tổng tiền</th><th className="pr-3 text-right">Thao tác</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {orders.slice(0, 5).map((order) => {
            const status = ORDER_STATUS[order.status] ?? { label: order.status, className: "bg-slate-100 text-slate-600 ring-slate-200" };
            return <tr key={order.id} className="text-slate-600 hover:bg-slate-50"><td className="px-3 py-1.5 font-mono font-bold text-slate-800">{order.orderCode || `#${order.id}`}</td><td>{order.shippingName}</td><td><div className="flex -space-x-1">{order.items.slice(0, 3).map((item) => <span key={item.id} className="grid h-6 w-6 place-items-center overflow-hidden rounded-full border border-white bg-slate-100">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-contain" /> : <Box className="h-3 w-3" />}</span>)}</div></td><td><span className={`rounded-full px-2 py-0.5 font-bold ring-1 ring-inset ${status.className}`}>{status.label}</span></td><td className="font-semibold text-blue-600">{order.paymentMethod}</td><td className="font-bold text-slate-900">{formatVND(order.finalAmount)}</td><td className="pr-3 text-right"><Link to={`/admin/orders?orderId=${order.id}`} className="font-bold text-blue-600">Xem →</Link></td></tr>;
          })}
        </tbody>
      </table>
    </AdminPanel>
  );
}

function ActivityFeed({ audits }: { audits: AuditLogItem[] }) {
  return (
    <AdminPanel title="Hoạt động gần đây" action={<Link to="/admin/audit-logs" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600">Xem tất cả <ArrowRight className="h-3 w-3" /></Link>} contentClassName="px-3 py-1">
      <div className="divide-y divide-slate-100">
        {audits.slice(0, 5).map((audit) => {
          const Icon = audit.quantityChanged < 0 ? ShoppingCart : audit.changeType === "IMPORT" ? PackageCheck : ShieldCheck;
          return <Link to={`/admin/audit-logs?search=${encodeURIComponent(audit.productName || '')}`} key={audit.id} className="flex items-center gap-2 py-1.5 text-[10px] transition-colors hover:bg-slate-50"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${audit.quantityChanged < 0 ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}><Icon className="h-3 w-3" /></span><p className="min-w-0 flex-1 truncate text-slate-600"><strong className="text-slate-800">{audit.productName}</strong> · {audit.reason}</p><time className="shrink-0 text-slate-400">{formatRelativeTime(audit.createdAt)}</time></Link>;
        })}
        {audits.length === 0 && <div className="flex items-center gap-2 py-6 text-xs text-slate-400"><AlertTriangle className="h-4 w-4" /> Chưa có hoạt động kho gần đây.</div>}
      </div>
    </AdminPanel>
  );
}

export default function DashboardWorkspace({ orders, products, brands, lowStockItems, audits, hasPartialData }: DashboardWorkspaceProps) {
  return (
    <section className="space-y-2.5" aria-label="Dữ liệu vận hành gần đây">
      {hasPartialData && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Một số phân hệ chưa phản hồi; dữ liệu khả dụng vẫn được hiển thị.</p>}
      <div className="grid gap-2.5 xl:grid-cols-2"><ProductRanking products={products} brands={brands} /><LowStockTable items={lowStockItems} /></div>
      <div className="grid gap-2.5 xl:grid-cols-[1.65fr_1fr]"><RecentOrders orders={orders} /><ActivityFeed audits={audits} /></div>
    </section>
  );
}

import {
  AlertCircle,
  Clock,
  Copy,
  FileText,
  MapPin,
  Printer,
  Settings2,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AdminOrderService,
  type OrderResponse,
  type ShipmentResponse,
} from "../../../services/admin/adminOrderService";
import {
  formatOrderCurrency,
  formatOrderDateTime,
  getOrderDisplayCode,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
} from "../../../utils/adminOrderPresentation";
import AdminOrderWaybillModal from "./AdminOrderWaybillModal";

interface AdminOrderDetailPanelProps {
  order: OrderResponse | null;
  loading: boolean;
  onClose: () => void;
  onManage: () => void;
  onDispatchShipment?: () => Promise<void>;
  dispatchingShipment?: boolean;
}

const ORDER_FLOW_STEPS: Array<{ key: OrderResponse["status"]; label: string }> = [
  { key: "PENDING", label: "Chờ xác nhận" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "PROCESSING", label: "Đang xử lý" },
  { key: "SHIPPING", label: "Đang giao" },
  { key: "DELIVERED", label: "Đã giao" },
  { key: "COMPLETED", label: "Hoàn thành" },
];

const getShipmentStatusText = (status?: string | null): string => {
  if (!status) return "Chờ cập nhật";
  return (
    {
      ready_to_pick: "Đã tạo vận đơn, chờ GHN lấy hàng",
      picking: "GHN đang lấy hàng",
      money_collect_picking: "GHN đang lấy hàng & thu tiền",
      picked: "GHN đã lấy hàng",
      storing: "Đang lưu kho trung chuyển",
      transporting: "Đang vận chuyển",
      sorting: "Đang phân loại",
      delivering: "Đang giao đến người nhận",
      money_collect_delivering: "Đang giao & thu hộ COD",
      delivered: "Giao hàng thành công",
      delivery_fail: "Giao hàng chưa thành công",
      waiting_to_return: "Đang chờ hoàn hàng",
      return: "Bắt đầu hoàn hàng",
      return_transporting: "Đang vận chuyển hàng hoàn",
      return_sorting: "Đang phân loại hàng hoàn",
      returning: "Đang hoàn về cửa hàng",
      return_fail: "Hoàn hàng chưa thành công",
      returned: "Đã hoàn về cửa hàng",
      cancel: "Vận đơn đã hủy",
      exception: "Vận đơn ngoại lệ",
      damage: "Hàng hóa hư hỏng",
      lost: "Hàng hóa thất lạc",
    }[status.toLowerCase()] ?? status
  );
};

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export default function AdminOrderDetailPanel({
  order,
  loading,
  onClose,
  onManage,
  onDispatchShipment,
  dispatchingShipment = false,
}: AdminOrderDetailPanelProps) {
  const [shipment, setShipment] = useState<ShipmentResponse | null>(null);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [isWaybillOpen, setWaybillOpen] = useState(false);

  useEffect(() => {
    if (!order?.id || !order.ghnOrderCode) {
      setShipment(null);
      setShipmentLoading(false);
      return;
    }
    let active = true;
    setShipmentLoading(true);
    void AdminOrderService.getShipment(order.id)
      .then((data) => {
        if (active) setShipment(data);
      })
      .catch(() => {
        if (active) setShipment(null);
      })
      .finally(() => {
        if (active) setShipmentLoading(false);
      });
    return () => {
      active = false;
    };
  }, [order?.id, order?.ghnOrderCode, order?.ghnTrackingStatus]);

  if (loading) {
    return (
      <article className="min-h-[420px] w-full p-5" aria-label="Đang tải chi tiết đơn hàng">
        <div className="animate-pulse space-y-5">
          <div className="h-6 w-40 rounded bg-slate-100" />
          <div className="h-16 rounded-lg bg-slate-100" />
          <div className="h-28 rounded-lg bg-slate-100" />
          <div className="h-52 rounded-lg bg-slate-100" />
        </div>
      </article>
    );
  }

  if (!order) return null;

  const status = ORDER_STATUS_META[order.status];
  const paymentStatus = PAYMENT_STATUS_META[order.paymentStatus];
  const address = [
    order.shippingStreet,
    order.shippingWard,
    order.shippingDistrict,
    order.shippingProvince,
  ]
    .filter(Boolean)
    .join(", ");
  const currentStepIndex = ORDER_FLOW_STEPS.findIndex((step) => step.key === order.status);
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const copyOrderCode = async () => {
    await navigator.clipboard.writeText(getOrderDisplayCode(order));
    toast.success("Đã sao chép mã đơn hàng");
  };

  const copyTrackingCode = async () => {
    if (!order.ghnOrderCode) return;
    await navigator.clipboard.writeText(order.ghnOrderCode);
    toast.success(`Đã sao chép mã vận đơn ${order.ghnOrderCode}`);
  };

  return (
    <>
      <article
        className="flex min-h-[420px] w-full flex-col overflow-hidden"
        aria-label={`Chi tiết đơn hàng ${getOrderDisplayCode(order)}`}
      >
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <h2 className="text-sm font-black text-slate-950">Chi tiết & Vận đơn</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng chi tiết đơn hàng"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Order Code & Status Stepper */}
          <section className="border-b border-slate-100 pb-4">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <strong
                    title={getOrderDisplayCode(order)}
                    className="min-w-0 truncate whitespace-nowrap font-mono text-sm text-slate-950"
                  >
                    {getOrderDisplayCode(order)}
                  </strong>
                  <button
                    type="button"
                    onClick={() => void copyOrderCode()}
                    className="shrink-0 text-slate-400 hover:text-slate-700"
                    aria-label="Sao chép mã đơn hàng"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Đặt lúc {formatOrderDateTime(order.createdAt)}
                </p>
                {order.deliveredAt && (
                  <p className="mt-0.5 text-xs font-semibold text-teal-600">
                    Giao lúc {formatOrderDateTime(order.deliveredAt)}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.badgeClassName}`}
              >
                {status.label}
              </span>
            </div>

            {order.status === "CANCELLED" ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <div>
                  <strong className="font-bold">Đơn hàng đã hủy</strong>
                  {order.cancelReason && (
                    <p className="mt-0.5 text-rose-700">Lý do: {order.cancelReason}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <div className="grid grid-cols-6 gap-1" aria-label="Tiến trình trạng thái đơn hàng">
                  {ORDER_FLOW_STEPS.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    return (
                      <div key={step.key} className="min-w-0">
                        <div
                          className={`h-1.5 rounded-full transition-colors ${
                            isCurrent
                              ? "bg-blue-600"
                              : isCompleted
                                ? "bg-emerald-500"
                                : "bg-slate-200"
                          }`}
                          title={step.label}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>
                    Bước {Math.max(currentStepIndex + 1, 1)}/{ORDER_FLOW_STEPS.length}:{" "}
                    <strong className="text-slate-800">{status.label}</strong>
                  </span>
                  {order.status !== "COMPLETED" && (
                    <button
                      type="button"
                      onClick={onManage}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Chuyển trạng thái →
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Carrier & Tracking Code Section (Prominent) */}
          <section className="border-b border-slate-100 py-4">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Vận đơn & Đơn vị vận chuyển</h3>
              {order.ghnOrderCode && (
                <button
                  type="button"
                  onClick={() => setWaybillOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <Printer className="h-3.5 w-3.5" /> In vận đơn
                </button>
              )}
            </div>

            {order.ghnOrderCode ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
                      GHN · Giao Hàng Nhanh
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <strong className="font-mono text-sm font-black text-blue-950">
                        {order.ghnOrderCode}
                      </strong>
                      <button
                        type="button"
                        onClick={() => void copyTrackingCode()}
                        className="rounded p-1 text-blue-600 hover:bg-blue-100 hover:text-blue-900"
                        aria-label="Sao chép mã vận đơn GHN"
                        title="Sao chép mã vận đơn"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
                    {getShipmentStatusText(shipment?.providerStatus ?? order.ghnTrackingStatus)}
                  </span>
                </div>

                {shipment?.expectedDeliveryAt && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-blue-800">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                    Dự kiến giao: <strong>{formatOrderDateTime(shipment.expectedDeliveryAt)}</strong>
                  </p>
                )}

                <div className="mt-3 border-t border-blue-200/70 pt-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                    Hành trình vận đơn
                  </p>
                  {shipmentLoading ? (
                    <p className="text-xs text-blue-600">Đang tải hành trình vận đơn...</p>
                  ) : (shipment?.events?.filter((event) => event.applied) ?? []).length === 0 ? (
                    <p className="text-xs text-blue-700/80">
                      Đã khởi tạo vận đơn, đang chờ sự kiện cập nhật từ GHN.
                    </p>
                  ) : (
                    <ol className="space-y-2.5 border-l border-blue-300 pl-3.5">
                      {shipment!
                        .events!.filter((event) => event.applied)
                        .map((event) => (
                          <li key={event.id} className="relative text-xs">
                            <span className="absolute -left-[19px] top-1 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-blue-50" />
                            <p className="font-bold text-blue-950">
                              {getShipmentStatusText(event.providerStatus)}
                            </p>
                            <p className="mt-0.5 text-[11px] text-blue-700/80">
                              {formatOrderDateTime(event.occurredAt)}
                            </p>
                          </li>
                        ))}
                    </ol>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3.5">
                <div className="flex items-start gap-2.5">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800">Chưa có mã vận đơn GHN</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {order.status === "PROCESSING"
                        ? "Đơn hàng đang xử lý đóng gói. Hãy tạo vận đơn GHN để lấy mã vận đơn in lên kiện hàng."
                        : "Mã vận đơn sẽ được cấp khi đơn hàng chuyển sang bước Đang xử lý và đẩy sang GHN."}
                    </p>
                    {order.status === "PROCESSING" && onDispatchShipment && (
                      <button
                        type="button"
                        disabled={dispatchingShipment}
                        onClick={() => void onDispatchShipment()}
                        className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        {dispatchingShipment ? "Đang tạo vận đơn..." : "Tạo vận đơn GHN ngay"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Customer & Shipping Address */}
          <section className="border-b border-slate-100 py-4">
            <h3 className="mb-3 text-sm font-black text-slate-900">Khách hàng & Nhận hàng</h3>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-xs font-black text-blue-600">
                {getInitials(order.shippingName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{order.shippingName}</p>
                <p className="mt-0.5 font-mono text-xs font-semibold text-slate-600">
                  {order.shippingPhone}
                </p>
              </div>
              <span
                className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${paymentStatus.badgeClassName}`}
              >
                {paymentStatus.label}
              </span>
            </div>

            <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-slate-50 p-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <p className="text-xs leading-5 text-slate-700">{address}</p>
            </div>

            {order.note && (
              <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900">
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <div>
                  <strong className="font-bold">Ghi chú giao hàng:</strong> {order.note}
                </div>
              </div>
            )}
          </section>

          {/* Order Items */}
          <section className="border-b border-slate-100 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                Sản phẩm ({order.items.length})
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                Tổng SL: {totalQuantity}
              </span>
            </div>
            <div className="space-y-2.5">
              {order.items.map((item) => (
                <article
                  key={item.id}
                  className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2.5"
                >
                  <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xs text-slate-300">No img</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{item.productName}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {item.variantName || "Biến thể tiêu chuẩn"}
                      {item.sku ? (
                        <span className="ml-1.5 font-mono text-[11px] font-semibold text-slate-400">
                          · {item.sku}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-600">x{item.quantity}</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {formatOrderCurrency(item.subtotal)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Payment Summary */}
          <section className="space-y-2 py-4 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Tạm tính</span>
              <span>{formatOrderCurrency(order.subtotalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Phí vận chuyển</span>
              <span>{formatOrderCurrency(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                Giảm giá
                {order.voucherCode && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                    <Tag className="h-3 w-3" />
                    {order.voucherCode}
                  </span>
                )}
              </span>
              <span>-{formatOrderCurrency(order.discountAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2.5 text-sm font-black text-slate-950">
              <span>Tổng thanh toán</span>
              <span>{formatOrderCurrency(order.finalAmount)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-400">Phương thức thanh toán</span>
              <span className="font-bold text-slate-700">{order.paymentMethod}</span>
            </div>
          </section>

          {order.latestReturnId && (
            <section className="mb-2 rounded-xl border border-violet-200 bg-violet-50 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                Hồ sơ hậu mãi
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-violet-950">RMA #{order.latestReturnId}</p>
                  <p className="mt-0.5 text-xs text-violet-700">
                    Trạng thái: {order.latestReturnStatus}
                  </p>
                </div>
                <a
                  href={`/admin/returns?orderId=${order.id}`}
                  className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white hover:bg-violet-800"
                >
                  Mở hồ sơ RMA
                </a>
              </div>
            </section>
          )}
        </div>

        <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 p-3">
          <button
            type="button"
            disabled={!order.ghnOrderCode}
            onClick={() => {
              if (!order.ghnOrderCode) {
                toast.error("Đơn hàng cần được cấp mã vận đơn GHN trước khi in.");
                return;
              }
              setWaybillOpen(true);
            }}
            title={
              order.ghnOrderCode
                ? `In phiếu vận đơn ${order.ghnOrderCode}`
                : "Chỉ có thể in đơn sau khi đã tạo mã vận đơn GHN"
            }
            className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <Printer className={`h-4 w-4 ${order.ghnOrderCode ? "text-blue-600" : "text-slate-400"}`} />
            {order.ghnOrderCode ? "In vận đơn" : "Chưa có mã VĐ"}
          </button>
          <button
            type="button"
            onClick={onManage}
            className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-950 px-3 text-xs font-bold text-white hover:bg-slate-800"
          >
            <Settings2 className="h-4 w-4" /> Cập nhật trạng thái
          </button>
        </footer>
      </article>

      {isWaybillOpen && order.ghnOrderCode && (
        <AdminOrderWaybillModal
          orders={[order]}
          shipmentByOrderId={shipment ? { [order.id]: shipment } : undefined}
          onClose={() => setWaybillOpen(false)}
        />
      )}
    </>
  );
}

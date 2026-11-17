import { Check, Copy, Printer, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import type { OrderResponse, ShipmentResponse } from "../../../services/admin/adminOrderService";
import {
  formatOrderCurrency,
  formatOrderDateTime,
  getOrderDisplayCode,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
} from "../../../utils/adminOrderPresentation";

interface AdminOrderWaybillModalProps {
  orders: OrderResponse[];
  shipmentByOrderId?: Record<number, ShipmentResponse | null | undefined>;
  onClose: () => void;
}

const buildBarcodeBars = (code: string): number[] => {
  const normalized = (code || "PEAKSNEAKER").toUpperCase();
  const bars: number[] = [2, 1, 1, 2, 1, 1];
  for (let index = 0; index < normalized.length; index += 1) {
    const charCode = normalized.charCodeAt(index);
    bars.push(
      ((charCode >> 0) & 1) + 1,
      ((charCode >> 1) & 1) + 1,
      ((charCode >> 2) & 2) + 1,
      ((charCode >> 3) & 1) + 1,
      ((charCode >> 4) & 2) + 1,
      1,
    );
  }
  bars.push(2, 1, 2, 1, 1, 2);
  return bars;
};

const computeBarcodeRects = (code: string) => {
  const bars = buildBarcodeBars(code);
  const rects: Array<{ key: number; x: number; width: number }> = [];
  let currentX = 0;
  bars.forEach((barWidth, idx) => {
    const width = barWidth * 2;
    if (idx % 2 === 0) {
      rects.push({ key: idx, x: currentX, width });
    }
    currentX += width;
  });
  return { rects, totalWidth: currentX };
};

export default function AdminOrderWaybillModal({
  orders,
  shipmentByOrderId,
  onClose,
}: AdminOrderWaybillModalProps) {
  const printableRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  const printableOrders = useMemo(
    () => orders.filter((order) => Boolean(order.ghnOrderCode?.trim())),
    [orders],
  );

  const isBatch = printableOrders.length > 1;
  const singleOrder = printableOrders.length === 1 ? printableOrders[0] : null;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (printableOrders.length === 0) {
    return null;
  }

  const handleCopyTrackingCodes = async () => {
    const codes = printableOrders
      .map((order) => order.ghnOrderCode?.trim())
      .filter(Boolean)
      .join(", ");
    if (!codes) return;
    await navigator.clipboard.writeText(codes);
    setCopied(true);
    toast.success(
      isBatch
        ? `Đã sao chép ${printableOrders.length} mã vận đơn`
        : `Đã sao chép mã vận đơn ${codes}`,
    );
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handlePrintWaybills = () => {
    if (!printableRef.current) return;
    const printWindow = window.open("", "_blank", "width=860,height=980");
    if (!printWindow) {
      toast.error("Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép pop-up để in vận đơn.");
      return;
    }

    const title = isBatch
      ? `In hàng loạt ${printableOrders.length} vận đơn GHN - PeakSneaker`
      : `Vận đơn ${singleOrder?.ghnOrderCode} - PeakSneaker`;

    const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      @page {
        size: A5 portrait;
        margin: 8mm;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 12px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .waybill-sheet {
        max-width: 680px;
        margin: 0 auto 24px;
        border: 2px solid #0f172a;
        border-radius: 8px;
        overflow: hidden;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .waybill-sheet:not(:last-child) {
        page-break-after: always;
        break-after: page;
      }
      .waybill-batch-badge {
        display: none;
      }
      @media print {
        body {
          padding: 0;
        }
        .waybill-sheet {
          max-width: 100%;
          margin: 0;
          border-radius: 0;
        }
      }
    </style>
  </head>
  <body>
    ${printableRef.current.innerHTML}
    <script>
      window.onload = function () {
        setTimeout(function () {
          window.focus();
          window.print();
        }, 150);
      };
    </script>
  </body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="waybill-modal-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="waybill-modal-title" className="text-base font-black text-slate-950">
                {isBatch
                  ? `In vận đơn hàng loạt (${printableOrders.length} đơn hàng)`
                  : "Phiếu vận đơn & Đóng gói giao hàng"}
              </h2>
              {singleOrder && (
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${ORDER_STATUS_META[singleOrder.status].badgeClassName}`}
                >
                  {ORDER_STATUS_META[singleOrder.status].label}
                </span>
              )}
              {isBatch && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                  GHN Express · Khổ A5
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {singleOrder ? (
                <>
                  Mã đơn:{" "}
                  <strong className="font-mono text-slate-800">
                    {getOrderDisplayCode(singleOrder)}
                  </strong>
                  {" · "}
                  Mã vận đơn GHN:{" "}
                  <strong className="font-mono text-blue-700">
                    {singleOrder.ghnOrderCode}
                  </strong>
                </>
              ) : (
                <>
                  Đã kiểm tra hợp lệ{" "}
                  <strong className="text-slate-800">{printableOrders.length} vận đơn</strong>{" "}
                  đã được cấp mã vận đơn từ đơn vị vận chuyển GHN (tự động ngắt trang A5 theo từng đơn).
                </>
              )}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopyTrackingCodes()}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {isBatch ? "Sao chép DS mã vận đơn" : "Sao chép mã vận đơn"}
            </button>
            <button
              type="button"
              onClick={handlePrintWaybills}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-950 px-4 text-xs font-bold text-white hover:bg-slate-800"
            >
              <Printer className="h-3.5 w-3.5" />
              {isBatch ? `In ${printableOrders.length} phiếu vận đơn` : "In phiếu vận đơn"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-100/80 p-5">
          <div ref={printableRef} className="space-y-6">
            {printableOrders.map((order, orderIndex) => {
              const trackingCode = order.ghnOrderCode!;
              const orderDisplayCode = getOrderDisplayCode(order);
              const barcodeRects = computeBarcodeRects(trackingCode);
              const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const codAmount =
                order.paymentMethod === "COD" && order.paymentStatus !== "PAID"
                  ? order.finalAmount
                  : 0;
              const fullAddress = [
                order.shippingStreet,
                order.shippingWard,
                order.shippingDistrict,
                order.shippingProvince,
              ]
                .filter(Boolean)
                .join(", ");
              const shipment = shipmentByOrderId?.[order.id];

              return (
                <div
                  key={order.id}
                  className="waybill-sheet mx-auto max-w-[660px] rounded-lg border-2 border-slate-950 bg-white text-slate-950 shadow-sm"
                  style={{
                    border: "2px solid #0f172a",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                  }}
                >
                  {isBatch && (
                    <div
                      className="waybill-batch-badge"
                      style={{
                        backgroundColor: "#eff6ff",
                        borderBottom: "1px solid #bfdbfe",
                        padding: "6px 16px",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#1d4ed8",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        PHIẾU VẬN ĐƠN #{orderIndex + 1} / {printableOrders.length}
                      </span>
                      <span>MÃ VẬN ĐƠN: {trackingCode}</span>
                    </div>
                  )}

                  {/* Top Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "2px solid #0f172a",
                      padding: "12px 16px",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            backgroundColor: "#0f172a",
                            color: "#ffffff",
                            fontWeight: 900,
                            fontSize: "13px",
                            padding: "4px 10px",
                            borderRadius: "4px",
                            letterSpacing: "0.05em",
                          }}
                        >
                          GHN EXPRESS
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#334155" }}>
                          Đơn vị vận chuyển: Giao Hàng Nhanh
                        </span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#475569" }}>
                        PeakSneaker Authentic Footwear · Chính hãng 100%
                      </p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700 }}>
                        MÃ ĐƠN NỘI BỘ
                      </div>
                      <div
                        style={{
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontSize: "14px",
                          fontWeight: 900,
                        }}
                      >
                        {orderDisplayCode}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        Ngày đặt: {formatOrderDateTime(order.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Carrier Tracking Code & Barcode */}
                  <div
                    style={{
                      borderBottom: "2px solid #0f172a",
                      padding: "14px 16px",
                      textAlign: "center",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#475569",
                        marginBottom: "6px",
                      }}
                    >
                      Mã vận đơn đơn vị vận chuyển (GHN)
                    </div>

                    <svg
                      viewBox={`0 0 ${barcodeRects.totalWidth} 54`}
                      style={{
                        width: "100%",
                        maxWidth: "420px",
                        height: "52px",
                        display: "block",
                        margin: "0 auto",
                      }}
                      aria-label={`Mã vạch vận đơn ${trackingCode}`}
                    >
                      {barcodeRects.rects.map((rect) => (
                        <rect
                          key={rect.key}
                          x={rect.x}
                          y={0}
                          width={rect.width}
                          height={54}
                          fill="#0f172a"
                        />
                      ))}
                    </svg>

                    <div
                      style={{
                        marginTop: "6px",
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        fontSize: "20px",
                        fontWeight: 900,
                        letterSpacing: "0.14em",
                        color: "#0f172a",
                      }}
                    >
                      {trackingCode}
                    </div>

                    {shipment?.expectedDeliveryAt && (
                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#1d4ed8",
                        }}
                      >
                        Dự kiến giao: {formatOrderDateTime(shipment.expectedDeliveryAt)}
                      </div>
                    )}
                  </div>

                  {/* Route District / Province Banner */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      borderBottom: "2px solid #0f172a",
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  >
                    <div style={{ padding: "8px 14px", borderRight: "1px solid #0f172a" }}>
                      TUYẾN GIAO:{" "}
                      <span style={{ textTransform: "uppercase" }}>
                        {order.shippingDistrict} — {order.shippingProvince}
                      </span>
                    </div>
                    <div style={{ padding: "8px 14px", textAlign: "right" }}>
                      PHƯƠNG THỨC: {order.paymentMethod} (
                      {PAYMENT_STATUS_META[order.paymentStatus].label})
                    </div>
                  </div>

                  {/* Sender & Receiver Info */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1.25fr",
                      borderBottom: "2px solid #0f172a",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRight: "1px solid #0f172a",
                        fontSize: "12px",
                        lineHeight: 1.5,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          color: "#64748b",
                        }}
                      >
                        Từ (Người gửi)
                      </div>
                      <div style={{ fontWeight: 900, fontSize: "13px", marginTop: "2px" }}>
                        PeakSneaker Flagship Store
                      </div>
                      <div style={{ fontWeight: 700, marginTop: "2px" }}>SĐT: 1900 6868</div>
                      <div style={{ color: "#334155", marginTop: "2px" }}>
                        Kho trung tâm PeakSneaker, Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh
                      </div>
                    </div>

                    <div style={{ padding: "12px 14px", fontSize: "12px", lineHeight: 1.5 }}>
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          color: "#64748b",
                        }}
                      >
                        Đến (Người nhận)
                      </div>
                      <div style={{ fontWeight: 900, fontSize: "14px", marginTop: "2px" }}>
                        {order.shippingName}
                      </div>
                      <div
                        style={{
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontWeight: 900,
                          fontSize: "13px",
                          marginTop: "2px",
                        }}
                      >
                        SĐT: {order.shippingPhone}
                      </div>
                      <div style={{ fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                        {fullAddress}
                      </div>
                    </div>
                  </div>

                  {/* COD Box & Delivery Instructions */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1.25fr",
                      borderBottom: "2px solid #0f172a",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRight: "1px solid #0f172a",
                        backgroundColor: "#f8fafc",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          color: "#475569",
                        }}
                      >
                        Tiền thu hộ (COD) bưu tá cần thu
                      </div>
                      <div
                        style={{
                          fontSize: "22px",
                          fontWeight: 900,
                          marginTop: "4px",
                          color: "#0f172a",
                        }}
                      >
                        {formatOrderCurrency(codAmount)}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#475569",
                          marginTop: "2px",
                          fontWeight: 600,
                        }}
                      >
                        {codAmount > 0
                          ? "Thu tiền mặt khi giao hàng (COD)"
                          : "Đơn đã thanh toán — Không thu tiền COD"}
                      </div>
                    </div>

                    <div style={{ padding: "12px 14px", fontSize: "12px", lineHeight: 1.5 }}>
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          color: "#64748b",
                        }}
                      >
                        Chỉ dẫn giao hàng & Ghi chú
                      </div>
                      <div style={{ fontWeight: 800, marginTop: "3px" }}>
                        • Cho xem hàng, không cho thử (CHOXEMHANGKHONGTHU)
                      </div>
                      <div style={{ marginTop: "3px", color: "#334155" }}>
                        • Ghi chú khách hàng:{" "}
                        <strong>{order.note?.trim() ? order.note : "Không có ghi chú"}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Packing Items Table */}
                  <div style={{ padding: "12px 14px", borderBottom: "2px solid #0f172a" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      <span>Nội dung hàng hóa đóng gói ({order.items.length} mã hàng)</span>
                      <span>Tổng số lượng: {totalUnits} SP</span>
                    </div>

                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "12px",
                      }}
                    >
                      <thead>
                        <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left" }}>
                          <th style={{ padding: "6px 4px", width: "32px" }}>#</th>
                          <th style={{ padding: "6px 4px" }}>Sản phẩm / Phân loại</th>
                          <th style={{ padding: "6px 4px", width: "140px" }}>Mã SKU</th>
                          <th style={{ padding: "6px 4px", width: "52px", textAlign: "right" }}>
                            SL
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "6px 4px", fontWeight: 700 }}>{idx + 1}</td>
                            <td style={{ padding: "6px 4px" }}>
                              <div style={{ fontWeight: 800 }}>{item.productName}</div>
                              <div style={{ fontSize: "11px", color: "#475569" }}>
                                {item.variantName || "Tiêu chuẩn"}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "6px 4px",
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              {item.sku || "—"}
                            </td>
                            <td
                              style={{
                                padding: "6px 4px",
                                textAlign: "right",
                                fontWeight: 900,
                              }}
                            >
                              x{item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      padding: "12px 14px 28px",
                      fontSize: "11px",
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, textTransform: "uppercase" }}>
                        Xác nhận đóng gói
                      </div>
                      <div style={{ color: "#64748b", marginTop: "2px" }}>
                        (Ký & ghi rõ họ tên)
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, textTransform: "uppercase" }}>
                        Chữ ký người nhận
                      </div>
                      <div style={{ color: "#64748b", marginTop: "2px" }}>
                        Đã nhận nguyên kiện, đúng mã vận đơn
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

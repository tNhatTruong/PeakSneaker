import type { OrderResponse } from "../services/admin/adminOrderService";

export interface OrderStatusMeta {
  label: string;
  badgeClassName: string;
}

export const ORDER_STATUS_META: Record<OrderResponse["status"], OrderStatusMeta> = {
  PENDING: { label: "Chờ xác nhận", badgeClassName: "border-amber-200 bg-amber-50 text-amber-700" },
  CONFIRMED: { label: "Đã xác nhận", badgeClassName: "border-sky-200 bg-sky-50 text-sky-700" },
  PROCESSING: { label: "Đang xử lý", badgeClassName: "border-blue-200 bg-blue-50 text-blue-700" },
  SHIPPING: { label: "Đang giao", badgeClassName: "border-violet-200 bg-violet-50 text-violet-700" },
  DELIVERED: { label: "Đã giao", badgeClassName: "border-teal-200 bg-teal-50 text-teal-700" },
  COMPLETED: { label: "Hoàn thành", badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "Đã hủy", badgeClassName: "border-red-200 bg-red-50 text-red-700" },
};

export const PAYMENT_STATUS_META: Record<OrderResponse["paymentStatus"], OrderStatusMeta> = {
  UNPAID: { label: "Chưa thanh toán", badgeClassName: "border-amber-200 bg-amber-50 text-amber-700" },
  PENDING: { label: "Đang chờ", badgeClassName: "border-blue-200 bg-blue-50 text-blue-700" },
  PAID: { label: "Đã thanh toán", badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  FAILED: { label: "Thanh toán lỗi", badgeClassName: "border-red-200 bg-red-50 text-red-700" },
  REFUNDED: { label: "Đã hoàn tiền", badgeClassName: "border-violet-200 bg-violet-50 text-violet-700" },
};

export const formatOrderCurrency = (value: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export const formatOrderDateTime = (value: string): string =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export const getOrderDisplayCode = (order: Pick<OrderResponse, "id" | "orderCode">): string =>
  order.orderCode || `#${order.id}`;

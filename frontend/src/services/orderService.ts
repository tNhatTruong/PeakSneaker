import apiClient, { type ApiResponse } from "./api";

export interface CheckoutRequest {
  idempotencyKey: string;
  addressId: number;
  paymentMethod: string;
  voucherCode?: string;
  note?: string;
  buyNowVariantId?: number;
  buyNowQuantity?: number;
}

export interface ShipmentEventResponse {
  id: number;
  eventType: string;
  providerStatus: string;
  occurredAt: string;
  applied: boolean;
}

export interface ShipmentResponse {
  id: number;
  orderId: number;
  provider: string;
  providerOrderCode: string;
  status: string;
  providerStatus: string;
  codAmount: number;
  shippingFee: number;
  expectedDeliveryAt: string | null;
  lastEventAt: string | null;
  events: ShipmentEventResponse[];
}

export interface OrderItemResponse {
  id: number;
  productId: number;
  productVariantId: number;
  productName: string;
  sku: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export interface OrderResponse {
  id: number;
  orderCode: string;
  userId: number;
  voucherCode: string | null;
  items: OrderItemResponse[];
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "COMPLETED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: "COD" | "VNPAY";
  ghnOrderCode: string | null;
  ghnTrackingStatus: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingProvince: string;
  shippingDistrict: string;
  shippingWard: string;
  shippingStreet: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
  latestReturnId: number | null;
  latestReturnStatus: "REQUESTED" | "APPROVED" | "REJECTED" | "GOODS_RECEIVED" | "COMPLETED" | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface CheckoutResponse {
  orderId: number;
  paymentUrl?: string;
}

export const checkout = async (request: CheckoutRequest) => {
  return apiClient.post<ApiResponse<CheckoutResponse>, CheckoutRequest>("/orders/checkout", request);
};

export const getOrders = async (page = 0, size = 10): Promise<PaginatedResponse<OrderResponse>> => {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<OrderResponse>>>("/orders", {
    params: { page, size },
  });
  return response.data;
};

export const getOrderById = async (id: number): Promise<OrderResponse> => {
  const response = await apiClient.get<ApiResponse<OrderResponse>>(`/orders/${id}`);
  return response.data;
};

export const cancelOrder = async (id: number): Promise<OrderResponse> => {
  const response = await apiClient.post<ApiResponse<OrderResponse>>(`/orders/${id}/cancel`);
  return response.data;
};

export const getOrderShipment = async (id: number): Promise<ShipmentResponse> => {
  const response = await apiClient.get<ApiResponse<ShipmentResponse>>(`/orders/${id}/shipment`);
  return response.data;
};

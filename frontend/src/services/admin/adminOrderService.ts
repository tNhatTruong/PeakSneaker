import apiClient, { type ApiResponse } from '../api';

export interface OrderItemResponse {
  id: number;
  productId: number | null;
  productVariantId: number | null;
  productName: string;
  sku: string | null;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl: string | null;
}

export interface OrderResponse {
  id: number;
  orderCode: string;
  userId: number | null;
  voucherCode: string | null;
  items: OrderItemResponse[];
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'SHIPPING'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'COD' | 'VNPAY';
  ghnOrderCode: string | null;
  ghnTrackingStatus: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingProvince: string;
  shippingDistrict: string;
  shippingWard: string;
  shippingStreet: string;
  note: string | null;
  cancelReason?: string | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  deliveredAt: string | null;
  latestReturnId: number | null;
  latestReturnStatus: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'GOODS_RECEIVED' | 'COMPLETED' | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface OrderFilterParams {
  query?: string;
  status?: OrderResponse['status'];
  paymentStatus?: OrderResponse['paymentStatus'];
  paymentMethod?: OrderResponse['paymentMethod'];
  minAmount?: number;
  maxAmount?: number;
  from?: string;
  to?: string;
  specificDay?: string; // yyyy-MM-dd
  specificMonth?: string; // yyyy-MM
  page?: number;
  size?: number;
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
  codAmount?: number;
  shippingFee?: number;
  expectedDeliveryAt: string | null;
  lastEventAt: string | null;
  events?: ShipmentEventResponse[];
}

export interface AdminCreateOrderPayload {
  userId?: number | null;
  shippingName: string;
  shippingPhone: string;
  shippingProvince: string;
  shippingDistrict: string;
  shippingDistrictId: number;
  shippingWard: string;
  shippingWardCode: string;
  shippingStreet: string;
  paymentMethod?: 'COD' | 'VNPAY';
  voucherCode?: string;
  note?: string;
  items: Array<{
    variantId: number;
    quantity: number;
  }>;
}

export const AdminOrderService = {
  createOrder: async (payload: AdminCreateOrderPayload) => {
    const response = await apiClient.post<ApiResponse<OrderResponse>>('/admin/orders', payload);
    return response.data as OrderResponse;
  },

  getOrders: async (params: OrderFilterParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<OrderResponse>>>('/admin/orders', {
      params,
    });
    return response.data as PaginatedResponse<OrderResponse>;
  },

  getOrderById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<OrderResponse>>(`/admin/orders/${id}`);
    return response.data as OrderResponse;
  },

  updateOrderStatus: async (id: number, status: string) => {
    const response = await apiClient.patch<ApiResponse<OrderResponse>>(`/admin/orders/${id}/status`, null, {
      params: { status },
    });
    return response.data as OrderResponse;
  },

  dispatchShipment: async (id: number) => {
    const response = await apiClient.post<ApiResponse<ShipmentResponse>>(`/admin/orders/${id}/shipment`);
    return response.data as ShipmentResponse;
  },

  getShipment: async (id: number) => {
    const response = await apiClient.get<ApiResponse<ShipmentResponse>>(`/admin/orders/${id}/shipment`);
    return response.data as ShipmentResponse;
  },
};

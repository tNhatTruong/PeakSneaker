import apiClient, { type ApiResponse } from '../api';

export interface OrderItemResponse {
  id: number;
  productVariantId: number | null;
  productName: string;
  sku: string | null;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
  userId: number | null;
  voucherCode: string | null;
  items: OrderItemResponse[];
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  status: 'PENDING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  shippingName: string;
  shippingPhone: string;
  shippingProvince: string;
  shippingDistrict: string;
  shippingWard: string;
  shippingStreet: string;
  note: string | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
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
  status?: 'PENDING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
  specificDay?: string; // yyyy-MM-dd
  specificMonth?: string; // yyyy-MM
  page?: number;
  size?: number;
}

export const AdminOrderService = {
  getOrders: async (params: OrderFilterParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<OrderResponse>>>('/admin/orders', {
      params,
    });
    // @ts-ignore
    return response.data as PaginatedResponse<OrderResponse>;
  },

  getOrderById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<OrderResponse>>(`/admin/orders/${id}`);
    // @ts-ignore
    return response.data as OrderResponse;
  },

  updateOrderStatus: async (id: number, status: string) => {
    const response = await apiClient.patch<ApiResponse<OrderResponse>>(`/admin/orders/${id}/status`, null, {
      params: { status },
    });
    // @ts-ignore
    return response.data as OrderResponse;
  },
};

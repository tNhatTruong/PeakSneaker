import apiClient, { type ApiResponse } from '../api';
import type { PaginatedResponse } from '../productService';

export interface CreateVariantPayload {
  color: string;
  size: string;
  sku: string;
  priceAdjustment?: number;
}

export interface CreateTransactionPayload {
  variantId: number;
  quantity: number;
  type: 'IMPORT' | 'EXPORT';
  note?: string;
}

export interface InventoryTransactionResponse {
  id: number;
  productId: number;
  productName: string;
  variantId: number;
  color: string;
  size: string;
  sku: string;
  quantity: number;
  type: 'IMPORT' | 'EXPORT';
  note: string;
  createdAt: string;
}

export const AdminInventoryService = {
  /** Tạo biến thể mới cho sản phẩm */
  createVariant: async (productId: number, data: CreateVariantPayload) => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/admin/products/${productId}/variants`,
      data
    );
    return response.data;
  },

  /** Tạo phiếu nhập/xuất kho */
  createTransaction: async (data: CreateTransactionPayload) => {
    const response = await apiClient.post<ApiResponse<InventoryTransactionResponse>>(
      '/admin/inventory/transactions',
      data
    );
    return response.data;
  },

  /** Xem lịch sử giao dịch kho kèm filter */
  getTransactions: async (params?: {
    productId?: number;
    variantId?: number;
    type?: 'IMPORT' | 'EXPORT';
    startDate?: string; // yyyy-MM-dd
    endDate?: string;   // yyyy-MM-dd
    page?: number;
    size?: number;
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<InventoryTransactionResponse>>>(
      '/admin/inventory/transactions',
      { params }
    );
    // @ts-ignore
    return response.data as PaginatedResponse<InventoryTransactionResponse>;
  },
};

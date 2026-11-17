import apiClient, { type ApiResponse } from '../api';
import type { PaginatedResponse, ProductVariantResponse } from '../productService';

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
  batchCode?: string;
  supplierName?: string;
  unitCost?: number;
  manufacturingDate?: string;
  expiryDate?: string;
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

export type InventoryStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'INACTIVE';

export interface InventoryVariantResponse {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string | null;
  brandId: number | null;
  brandName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  silhouetteId: number | null;
  silhouetteName: string | null;
  sku: string;
  color: string;
  size: string;
  stock: number;
  safetyStockThreshold: number;
  priceAdjustment: number;
  finalPrice: number;
  productInactive: boolean;
  createdAt: string;
}

export interface InventoryVariantSummaryResponse {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  inactive: number;
}

export const AdminInventoryService = {
  getVariants: async (params?: {
    search?: string;
    productId?: number;
    brandId?: number;
    categoryId?: number;
    silhouetteId?: number;
    stockStatus?: InventoryStockStatus;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<InventoryVariantResponse>>>(
      '/admin/inventory/variants',
      { params },
    );
    return response.data as PaginatedResponse<InventoryVariantResponse>;
  },

  getVariantSummary: async () => {
    const response = await apiClient.get<ApiResponse<InventoryVariantSummaryResponse>>(
      '/admin/inventory/variants/summary',
    );
    return response.data as InventoryVariantSummaryResponse;
  },

  updateSafetyStockThreshold: async (variantId: number, threshold: number) => {
    const response = await apiClient.patch<ApiResponse<InventoryVariantResponse>>(
      `/admin/inventory/variants/${variantId}/threshold`,
      null,
      { params: { threshold } },
    );
    return response.data as InventoryVariantResponse;
  },

  /** Tạo biến thể mới cho sản phẩm */
  createVariant: async (productId: number, data: CreateVariantPayload) => {
    const response = await apiClient.post<ApiResponse<ProductVariantResponse>>(
      `/admin/products/${productId}/variants`,
      data
    );
    return response.data as ProductVariantResponse;
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
    return response.data as PaginatedResponse<InventoryTransactionResponse>;
  },
};

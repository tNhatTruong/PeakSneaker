import apiClient, { type ApiResponse } from '../api';
import type { OrderReturnItem, ReturnReasonCode } from '../returnService';
import type { PaginatedResponse } from '../orderService';

export interface UpdateReturnStatusPayload {
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'GOODS_RECEIVED' | 'COMPLETED';
  refundAmount?: number;
  adminNotes?: string;
  items?: Array<{
    returnItemId: number;
    approvedQuantity?: number;
    receivedQuantity?: number;
    restockableQuantity?: number;
    replacementVariantId?: number;
    conditionNote?: string;
  }>;
}

export interface ReturnFilterParams {
  query?: string;
  status?: OrderReturnItem['status'];
  reasonCode?: ReturnReasonCode;
  returnType?: OrderReturnItem['returnType'];
  paymentMethod?: OrderReturnItem['paymentMethod'];
  productId?: number;
  orderId?: number;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface ReturnFilterOptions {
  statusCounts: Partial<Record<OrderReturnItem['status'], number>>;
  products: Array<{ id: number; name: string }>;
}

export const AdminReturnsService = {
  getReturns: async (params?: ReturnFilterParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<OrderReturnItem>>>('/admin/returns', {
      params,
    });
    return response.data as PaginatedResponse<OrderReturnItem>;
  },

  getFilterOptions: async () => {
    const response = await apiClient.get<ApiResponse<ReturnFilterOptions>>('/admin/returns/filter-options');
    return response.data as ReturnFilterOptions;
  },

  getReturnById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<OrderReturnItem>>(`/admin/returns/${id}`);
    return response.data as OrderReturnItem;
  },

  updateStatus: async (id: number, data: UpdateReturnStatusPayload) => {
    const response = await apiClient.patch<ApiResponse<OrderReturnItem>>(`/admin/returns/${id}/status`, data);
    return response.data as OrderReturnItem;
  },
};

export default AdminReturnsService;

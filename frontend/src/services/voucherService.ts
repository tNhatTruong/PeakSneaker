import apiClient, { type ApiResponse } from "./api";

export interface VoucherCheckRequest {
  code: string;
  subtotal: number;
}

export interface VoucherCheckResponse {
  isValid?: boolean;
  valid?: boolean;
  discountAmount: number;
  message: string;
}

export interface VoucherResponse {
  id: number;
  code: string;
  name?: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  usageLimit: number;
  perUserLimit?: number;
  usedCount: number;
  startAt: string;
  expireAt: string;
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const VoucherService = {
  checkVoucher: async (data: VoucherCheckRequest) => {
    const response = await apiClient.post<ApiResponse<VoucherCheckResponse>>("/vouchers/check", data);
    return response.data;
  },
  getVouchers: async (page = 0, size = 100) => {
    const response = await apiClient.post<ApiResponse<PaginatedResponse<VoucherResponse>>>("/vouchers", {
      page,
      size,
      isActive: true
    });
    return response.data as PaginatedResponse<VoucherResponse>;
  }
};

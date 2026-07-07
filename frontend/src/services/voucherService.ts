import apiClient from "./api";

export interface VoucherCheckRequest {
  code: string;
  subtotal: number;
}

export interface VoucherCheckResponse {
  isValid: boolean;
  discountAmount: number;
  message: string;
}

export interface VoucherResponse {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  usageLimit: number;
  usedCount: number;
  startAt: string;
  expireAt: string;
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const VoucherService = {
  checkVoucher: async (data: VoucherCheckRequest) => {
    return apiClient.post<VoucherCheckResponse>("/vouchers/check", data);
  },
  getVouchers: async (page = 0, size = 100) => {
    return apiClient.post<PaginatedResponse<VoucherResponse>>("/vouchers", {
      page,
      size,
      isActive: true
    });
  }
};

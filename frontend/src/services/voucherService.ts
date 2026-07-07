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

export const VoucherService = {
  checkVoucher: async (data: VoucherCheckRequest) => {
    return apiClient.post<VoucherCheckResponse>("/vouchers/check", data);
  }
};

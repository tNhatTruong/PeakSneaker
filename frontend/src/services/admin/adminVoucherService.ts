import apiClient, { type ApiResponse } from '../api';

export interface VoucherResponse{
    id : number,
    code : string,
    discountType: "FIXED"| "PERCENTAGE",
    discountValue: number| null,
    minOrderAmount : number,
    maxDiscountAmount : number| null,
    usageLimit? : number| null,
    usedCount? : number| null,
    startAt?: string,
    expireAt?: string,
    isActive?: boolean,
}

export interface VoucherRequest{
    code : string,
    discountType: "FIXED"| "PERCENTAGE",
    discountValue: number| null,
    minOrderAmount : number,
    maxDiscountAmount : number| null,
    usageLimit? : number| null,
    usedCount? : number| null,
    startAt?: string,
    expireAt?: string,
    isActive?: boolean,
}

export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export interface VoucherParams {
    query?: string;
    isActive?: boolean;
    page?: number;
    size?: number;
}

export const VoucherService = {
    getVouchers: async (params: VoucherParams) => {
        const response = await apiClient.post<ApiResponse<PaginatedResponse<VoucherResponse>>>("/vouchers", params);
        return response.data;
    },

    createVoucher: async (voucher: VoucherRequest) => {
        const response = await apiClient.post<ApiResponse<VoucherResponse>>("/vouchers/create", voucher);
        return response.data;
    },
    
    updateVoucher: async (id: number, voucher: VoucherRequest) => {
        const response = await apiClient.put<ApiResponse<VoucherResponse>>(`/vouchers/${id}`, voucher);
        return response.data;
    },
    
    deleteVoucher: async (id: number) => {
        const response = await apiClient.delete<ApiResponse<void>>(`/vouchers/${id}`);
        return response.data;
    }
}



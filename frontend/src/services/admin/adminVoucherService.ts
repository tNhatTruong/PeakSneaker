import apiClient, { type ApiResponse } from '../api';

export type DiscountType = 'FIXED' | 'FIXED_AMOUNT' | 'PERCENTAGE';
export type VoucherStatus = 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'PAUSED';
export type VoucherApplicationScope = 'ALL_PRODUCTS';
export type VoucherChannel = 'WEB';

export interface VoucherResponse {
    id: number;
    code: string;
    name: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number | null;
    usageLimit: number | null;
    perUserLimit: number;
    usedCount: number;
    startAt: string;
    expireAt: string;
    isActive: boolean;
    applicationScope: VoucherApplicationScope;
    applicationChannel: VoucherChannel;
    isCombinable: boolean;
    status: VoucherStatus;
    createdAt: string;
    updatedAt: string;
}

export interface VoucherDetailResponse {
    voucher: VoucherResponse;
    usageCount: number;
    totalDiscountAmount: number;
    generatedRevenue: number;
}

export interface VoucherRequest {
    code: string;
    name: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number | null;
    usageLimit: number | null;
    perUserLimit: number;
    startAt: string;
    expireAt: string;
    isActive: boolean;
    applicationScope: VoucherApplicationScope;
    applicationChannel: VoucherChannel;
    isCombinable: boolean;
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
    status?: VoucherStatus;
    discountType?: DiscountType;
    applicationScope?: VoucherApplicationScope;
    applicationChannel?: VoucherChannel;
    fromDate?: string;
    toDate?: string;
    sortBy?: 'createdAt' | 'startAt' | 'expireAt' | 'code' | 'name';
    sortDirection?: 'asc' | 'desc';
    page?: number;
    size?: number;
}

export const VoucherService = {
    getVouchers: async (params: VoucherParams): Promise<PaginatedResponse<VoucherResponse>> => {
        const response = await apiClient.post<ApiResponse<PaginatedResponse<VoucherResponse>>, VoucherParams>('/vouchers', params);
        return response.data;
    },

    getVoucher: async (id: number): Promise<VoucherDetailResponse> => {
        const response = await apiClient.get<ApiResponse<VoucherDetailResponse>>(`/vouchers/${id}`);
        return response.data;
    },

    createVoucher: async (voucher: VoucherRequest): Promise<VoucherResponse> => {
        const response = await apiClient.post<ApiResponse<VoucherResponse>, VoucherRequest>('/vouchers/create', voucher);
        return response.data;
    },

    updateVoucher: async (id: number, voucher: VoucherRequest): Promise<VoucherResponse> => {
        const response = await apiClient.put<ApiResponse<VoucherResponse>, VoucherRequest>(`/vouchers/${id}`, voucher);
        return response.data;
    },

    deleteVoucher: async (id: number): Promise<void> => {
        await apiClient.delete<ApiResponse<void>>(`/vouchers/${id}`);
    }
}



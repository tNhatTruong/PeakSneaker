import apiClient, { type ApiResponse } from '../api';
import type { PaginatedResponse } from '../productService';

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  hasPassword: boolean;
  createdAt: string;
  orderCount?: number;
  totalSpent?: number;
  customerTier?: 'VIP' | 'LOYAL' | 'REGULAR';
  location?: string;
  lastOrderDate?: string;
}

export interface CustomerAddress {
  id: number;
  recipientName: string;
  phone: string;
  provinceId: number;
  provinceName: string;
  districtId: number;
  districtName: string;
  wardCode: string;
  wardName: string;
  streetDetail: string;
  isDefault: boolean;
}

export interface CustomerRecentOrder {
  id: number;
  orderCode: string;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  itemCount: number;
}

export interface CustomerDetailResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  averageRating: number;
  wishlistCount: number;
  customerTier: 'VIP' | 'LOYAL' | 'REGULAR';
  location: string;
  addresses: CustomerAddress[];
  recentOrders: CustomerRecentOrder[];
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface AdminUserQueryParams {
  query?: string;
  isActive?: boolean;
  role?: string;
  from?: string;
  to?: string;
  specificMonth?: string;
  page?: number;
  size?: number;
}

export const AdminUserService = {
  getUsers: async (params?: AdminUserQueryParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<UserResponse>>>('/admin/users', { params });
    return response.data as PaginatedResponse<UserResponse>;
  },

  getCustomerDetail: async (id: number) => {
    const response = await apiClient.get<ApiResponse<CustomerDetailResponse>>(`/admin/users/${id}/customer-detail`);
    return response.data;
  },

  updateUserStatus: async (id: number, isActive: boolean) => {
    const response = await apiClient.patch<ApiResponse<UserResponse>>(`/admin/users/${id}/status`, null, {
      params: { isActive }
    });
    return response.data;
  },

  updateUserRole: async (id: number, role: string) => {
    const response = await apiClient.patch<ApiResponse<UserResponse>>(`/admin/users/${id}/role`, null, {
      params: { role }
    });
    return response.data;
  },

  updateUserInfo: async (id: number, request: UpdateUserRequest) => {
    const response = await apiClient.put<ApiResponse<UserResponse>>(`/admin/users/${id}`, request);
    return response.data;
  }
};

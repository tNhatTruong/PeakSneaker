import apiClient, { type ApiResponse } from '../api';
import type { PaginatedResponse } from '../productService';

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phone: string;
}

export const AdminUserService = {
  getUsers: async (params?: {
    query?: string;
    isActive?: boolean;
    role?: 'USER' | 'ADMIN';
    specificMonth?: string; // format yyyy-MM
    page?: number;
    size?: number;
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<UserResponse>>>('/admin/users', { params });
    // @ts-ignore
    return response.data as PaginatedResponse<UserResponse>;
  },

  updateUserStatus: async (id: number, isActive: boolean) => {
    const response = await apiClient.patch<ApiResponse<UserResponse>>(`/admin/users/${id}/status`, null, {
      params: { isActive }
    });
    return response.data;
  },

  updateUserRole: async (id: number, role: 'USER' | 'ADMIN') => {
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

import apiClient, { type ApiResponse } from '../api';
import type { PaginatedResponse } from '../productService';

export interface StaffResponse {
  id: number;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  role: string;
  roleName: string;
  hierarchyLevel: number;
  department: string;
  departmentName: string;
  positionTitle: string;
  staffStatus: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  isActive: boolean;
  joinedAt: string;
  createdAt: string;
  notes?: string;
  permissions: string[];
}

export interface RoleResponse {
  id: number;
  code: string;
  name: string;
  hierarchyLevel: number;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

export interface PermissionResponse {
  id: number;
  code: string;
  name: string;
  module: string;
  description: string;
}

export interface CreateStaffRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  department: string;
  positionTitle: string;
  notes?: string;
  customPermissions?: string[];
}

export interface UpdateStaffRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  positionTitle?: string;
  notes?: string;
}

export interface AdminStaffQueryParams {
  query?: string;
  department?: string;
  status?: string;
  role?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

export const AdminStaffService = {
  getStaffList: async (params?: AdminStaffQueryParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<StaffResponse>>>('/admin/staff', { params });
    return response.data as PaginatedResponse<StaffResponse>;
  },

  getStaffById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<StaffResponse>>(`/admin/staff/${id}`);
    return response.data;
  },

  createStaff: async (request: CreateStaffRequest) => {
    const response = await apiClient.post<ApiResponse<StaffResponse>>('/admin/staff', request);
    return response.data;
  },

  updateStaff: async (id: number, request: UpdateStaffRequest) => {
    const response = await apiClient.put<ApiResponse<StaffResponse>>(`/admin/staff/${id}`, request);
    return response.data;
  },

  updateStaffRole: async (id: number, role: string) => {
    const response = await apiClient.put<ApiResponse<StaffResponse>>(`/admin/staff/${id}/role`, { role });
    return response.data;
  },

  updateStaffPermissions: async (id: number, permissions: string[]) => {
    const response = await apiClient.put<ApiResponse<StaffResponse>>(`/admin/staff/${id}/permissions`, { permissions });
    return response.data;
  },

  updateStaffStatus: async (id: number, status: string) => {
    const response = await apiClient.put<ApiResponse<StaffResponse>>(`/admin/staff/${id}/status`, { status });
    return response.data;
  },

  getAllRoles: async () => {
    const response = await apiClient.get<ApiResponse<RoleResponse[]>>('/admin/staff/roles');
    return response.data;
  },

  getAllPermissions: async () => {
    const response = await apiClient.get<ApiResponse<PermissionResponse[]>>('/admin/staff/permissions');
    return response.data;
  }
};


import apiClient, { type ApiResponse } from '../api';
import type { CategoryResponse } from '../categoryService';

export interface CategoryRequest {
  name: string;
  description?: string;
  parentId?: number | null;
}

// Extend CategoryResponse if it hasn't been updated in categoryService.ts yet
export interface AdminCategoryResponse extends CategoryResponse {
  description?: string;
  parentId?: number | null;
  parentName?: string | null;
  productCount?: number;
}

export const AdminCategoryService = {
  getCategories: async () => {
    const response = await apiClient.get<ApiResponse<AdminCategoryResponse[]>>('/admin/categories');
    return response.data as AdminCategoryResponse[];
  },

  createCategory: async (data: CategoryRequest) => {
    const response = await apiClient.post<ApiResponse<AdminCategoryResponse>>('/admin/categories', data);
    return response.data;
  },

  updateCategory: async (id: number, data: CategoryRequest) => {
    const response = await apiClient.put<ApiResponse<AdminCategoryResponse>>(`/admin/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/categories/${id}`);
    return response.data;
  },

  updateVisibility: async (id: number, isActive: boolean) => {
    const response = await apiClient.patch<ApiResponse<AdminCategoryResponse>>(
      `/admin/categories/${id}/visibility`,
      null,
      { params: { isActive } },
    );
    return response.data as AdminCategoryResponse;
  },
};

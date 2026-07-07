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
}

export const AdminCategoryService = {
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
};

import apiClient, { type ApiResponse } from './api';

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
}

export const CategoryService = {
  getAllCategories: async () => {
    const response = await apiClient.get<ApiResponse<CategoryResponse[]>>('/categories');
    // @ts-ignore
    return response.data as CategoryResponse[];
  },
};

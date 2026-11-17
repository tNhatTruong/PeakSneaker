import apiClient, { type ApiResponse } from './api';

export interface Silhouette {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
  description?: string;
  isActive: boolean;
  isVisible: boolean;
  activeProductCount: number;
  silhouettes?: Silhouette[];
}

export const BrandService = {
  getAllBrands: async () => {
    const response = await apiClient.get<ApiResponse<Brand[]>>('/brands');
    return response.data as Brand[]; // Interceptor unwraps response.data
  },
};

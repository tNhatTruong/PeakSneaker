import apiClient, { type ApiResponse } from './api';

export interface Silhouette {
  id: number;
  name: string;
  imageUrl: string;
}

export interface Brand {
  id: number;
  name: string;
  logoUrl: string;
  description?: string;
  silhouettes?: Silhouette[];
}

export const BrandService = {
  getAllBrands: async () => {
    const response = await apiClient.get<ApiResponse<Brand[]>>('/brands');
    // @ts-ignore
    return response.data as Brand[]; // Interceptor unwraps response.data
  },
};

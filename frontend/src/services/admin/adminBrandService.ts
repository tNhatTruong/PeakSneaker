import apiClient, { type ApiResponse } from '../api';

export interface BrandResponse {
  id: number;
  name: string;
  slug?: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
  isVisible: boolean;
  activeProductCount: number;
  silhouettes: SilhouetteResponse[] | null;
}

export interface SilhouetteResponse {
  id: number;
  name: string;
  slug?: string;
  imageUrl: string | null;
}

export const AdminBrandService = {
  getBrands: async (keyword?: string): Promise<BrandResponse[]> => {
    const response = await apiClient.get<ApiResponse<BrandResponse[]>>('/admin/brands', {
      params: keyword ? { keyword } : {},
    });
    return response.data as BrandResponse[];
  },

  createBrand: async (name: string, description: string, logoFile?: File): Promise<BrandResponse> => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description || '');
    if (logoFile) {
      formData.append('logoImage', logoFile);
    }
    const response = await apiClient.post<ApiResponse<BrandResponse>>('/admin/brands', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data as BrandResponse;
  },

  updateBrand: async (id: number, name: string, description: string, logoFile?: File): Promise<BrandResponse> => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description || '');
    if (logoFile) {
      formData.append('logoImage', logoFile);
    }
    const response = await apiClient.put<ApiResponse<BrandResponse>>(`/admin/brands/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data as BrandResponse;
  },

  updateVisibility: async (id: number, isActive: boolean): Promise<BrandResponse> => {
    const response = await apiClient.patch<ApiResponse<BrandResponse>>(`/admin/brands/${id}/visibility`, {
      isActive,
    });
    return response.data as BrandResponse;
  },

  deleteBrand: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/brands/${id}`);
  },
};

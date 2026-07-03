import apiClient, { type ApiResponse } from '../api';

export interface SilhouetteResponse {
  id: number;
  name: string;
  imageUrl: string | null;
}

export const AdminSilhouetteService = {
  getByBrand: async (brandId: number): Promise<SilhouetteResponse[]> => {
    const response = await apiClient.get<ApiResponse<SilhouetteResponse[]>>(`/admin/silhouettes/brand/${brandId}`);
    // @ts-ignore
    return response.data as SilhouetteResponse[];
  },

  create: async (name: string, brandId: number, imageFile?: File): Promise<SilhouetteResponse> => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('brandId', brandId.toString());
    if (imageFile) {
      formData.append('image', imageFile);
    }
    const response = await apiClient.post<ApiResponse<SilhouetteResponse>>('/admin/silhouettes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // @ts-ignore
    return response.data as SilhouetteResponse;
  },

  update: async (id: number, name: string, brandId: number, imageFile?: File): Promise<SilhouetteResponse> => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('brandId', brandId.toString());
    if (imageFile) {
      formData.append('image', imageFile);
    }
    const response = await apiClient.put<ApiResponse<SilhouetteResponse>>(`/admin/silhouettes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // @ts-ignore
    return response.data as SilhouetteResponse;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/silhouettes/${id}`);
  },
};

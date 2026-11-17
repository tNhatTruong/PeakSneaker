import apiClient, { type ApiResponse } from './api';

export interface SilhouetteResponse {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  activeProductCount?: number;
}

export const SilhouetteService = {
  getAllSilhouettes: async () => {
    const response = await apiClient.get<ApiResponse<SilhouetteResponse[]>>('/silhouettes');
    return response.data as SilhouetteResponse[];
  },

  getSilhouettesByBrand: async (brandId: number) => {
    const response = await apiClient.get<ApiResponse<SilhouetteResponse[]>>(`/silhouettes/brand/${brandId}`);
    return response.data as SilhouetteResponse[];
  },
};

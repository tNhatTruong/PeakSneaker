import apiClient, { type ApiResponse } from './api';

export interface SilhouetteResponse {
  id: number;
  name: string;
  imageUrl: string;
}

export const SilhouetteService = {
  getAllSilhouettes: async () => {
    const response = await apiClient.get<ApiResponse<SilhouetteResponse[]>>('/silhouettes');
    // @ts-ignore
    return response.data as SilhouetteResponse[];
  },

  getSilhouettesByBrand: async (brandId: number) => {
    const response = await apiClient.get<ApiResponse<SilhouetteResponse[]>>(`/silhouettes/brand/${brandId}`);
    // @ts-ignore
    return response.data as SilhouetteResponse[];
  },
};

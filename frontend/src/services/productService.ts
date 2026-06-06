import apiClient, { type ApiResponse } from './api';

export interface BrandResponse {
  id: number;
  name: string;
  logoUrl: string;
}

export interface ProductResponse {
  id: number;
  name: string;
  brand: BrandResponse;
  basePrice: number;
  defaultImageUrl: string;
  isFeatured: boolean;
  isNew: boolean;
}

export const ProductService = {
  getFeaturedProducts: async (limit: number = 8) => {
    const response = await apiClient.get<ApiResponse<ProductResponse[]>>('/products/featured', {
      params: { limit },
    });
    // @ts-ignore
    return response.data as ProductResponse[]; // Since interceptor unwraps response.data, response is actually ApiResponse
  },

  getNewArrivals: async (limit: number = 8) => {
    const response = await apiClient.get<ApiResponse<ProductResponse[]>>('/products/new', {
      params: { limit },
    });
    // @ts-ignore
    return response.data as ProductResponse[];
  },

  filterProducts: async (params: {
    categoryId?: number;
    brandId?: number;
    silhouetteId?: number;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProductResponse>>>('/products', {
      params,
    });
    // @ts-ignore
    return response.data as PaginatedResponse<ProductResponse>;
  },
};

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

import apiClient, { type ApiResponse } from './api';

export interface BrandResponse {
  id: number;
  name: string;
  slug: string;
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
  discountPercent?: number;
  price?: number;
  isDeleted?: boolean;
  totalStock?: number;
  gender?: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS';
  totalSold?: number;
}

export interface ImageResponse {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
}

export interface ProductVariantResponse {
  id: number;
  sku: string;
  color: string;
  size: string;
  stock: number;
  priceMultiplier: number;
  originalPrice?: number;
  finalPrice: number;
}

export interface CategoryResponse {
  id: number;
  name: string;
}

export interface ProductFilterOptionResponse {
  brandId: number | null;
  categoryId: number | null;
  silhouetteId: number | null;
}

export interface SilhouetteResponse {
  id: number;
  name: string;
  slug: string;
}

export interface ProductDetailResponse {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  discountPercent?: number;
  price?: number;
  brand: BrandResponse | null;
  category: CategoryResponse | null;
  silhouette: SilhouetteResponse | null;
  gender?: string;
  productType?: string;
  attributes?: string;
  isFeatured: boolean;
  isNew: boolean;
  isDeleted?: boolean;
  totalSold?: number;
  images: ImageResponse[];
  variants: ProductVariantResponse[];
}

export const ProductService = {
  getProductById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<ProductDetailResponse>>(`/products/${id}`);
    return response.data as ProductDetailResponse;
  },
  getFeaturedProducts: async (limit: number = 8) => {
    const response = await apiClient.get<ApiResponse<ProductResponse[]>>('/products/featured', {
      params: { limit },
    });
    return response.data as ProductResponse[]; // Since interceptor unwraps response.data, response is actually ApiResponse
  },

  getNewArrivals: async (limit: number = 8) => {
    const response = await apiClient.get<ApiResponse<ProductResponse[]>>('/products/new', {
      params: { limit },
    });
    return response.data as ProductResponse[];
  },

  getSaleProducts: async (limit: number = 12) => {
    const response = await apiClient.get<ApiResponse<ProductResponse[]>>('/products/sale', {
      params: { limit },
    });
    return response.data as ProductResponse[];
  },

  getAvailableSizes: async (params: {
    categoryId?: number;
    brandId?: number;
    silhouetteId?: number;
  }) => {
    const response = await apiClient.get<ApiResponse<string[]>>('/products/available-sizes', { params });
    return response.data as string[];
  },

  getFilterOptions: async () => {
    const response = await apiClient.get<ApiResponse<ProductFilterOptionResponse[]>>('/products/filter-options');
    return response.data as ProductFilterOptionResponse[];
  },

  filterProducts: async (params: {
    categoryId?: number;
    brandId?: number;
    silhouetteId?: number;
    gender?: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS';
    onSale?: boolean;
    inStockOnly?: boolean;
    variantSize?: string;
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

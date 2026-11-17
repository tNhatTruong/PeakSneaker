import apiClient, { type ApiResponse } from '../api';
import type { ProductDetailResponse, ProductResponse, PaginatedResponse } from '../productService';

export type ProductType = 'SNEAKER' | 'ACCESSORY' | 'SHOE_CARE';
export type AdminProductStatus = 'ACTIVE' | 'HIDDEN';
export type AdminProductStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface AdminProductFilterOption {
  brandId: number;
  categoryId: number;
  silhouetteId: number | null;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  attributes?: string;
  basePrice: number;
  discountPercent?: number;
  silhouetteId: number;
  categoryId?: number;
  gender?: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS';
  productType?: ProductType;
  isFeatured?: boolean;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  attributes?: string;
  basePrice?: number;
  discountPercent?: number;
  silhouetteId?: number;
  categoryId?: number;
  gender?: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS';
  productType?: ProductType;
  isFeatured?: boolean;
}

const toFormData = (data: object, images: File[]): FormData => {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  images.forEach((file) => formData.append('images', file));
  return formData;
};

export const AdminProductService = {
  getFilterOptions: async (): Promise<AdminProductFilterOption[]> => {
    const response = await apiClient.get<ApiResponse<AdminProductFilterOption[]>>('/products/admin/filter-options');
    return response.data as AdminProductFilterOption[];
  },

  /** Admin: lay tat ca san pham (ke ca da xoa mem) */
  getAdminProducts: async (params?: {
    search?: string;
    status?: AdminProductStatus;
    brandId?: number;
    categoryId?: number;
    silhouetteId?: number;
    stockStatus?: AdminProductStockStatus;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProductResponse>>>('/products/admin', {
      params: { size: 10, sortBy: 'createdAt', sortDirection: 'desc', ...params },
    });
    return response.data as PaginatedResponse<ProductResponse>;
  },

  /** Tao san pham moi kem upload anh */
  createProduct: async (data: CreateProductPayload, images: File[]) => {
    const response = await apiClient.post<ApiResponse<ProductDetailResponse>>(
      '/products/admin',
      toFormData(data, images),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data as ProductDetailResponse;
  },

  /** Cap nhat san pham, them anh moi (giu nguyen anh cu) */
  updateProduct: async (id: number, data: UpdateProductPayload, images: File[]) => {
    const response = await apiClient.put<ApiResponse<ProductDetailResponse>>(
      `/products/admin/${id}`,
      toFormData(data, images),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data as ProductDetailResponse;
  },

  /** Xoa mem san pham */
  deleteProduct: async (id: number) => {
    await apiClient.delete(`/products/admin/${id}`);
  },

  updateVisibility: async (id: number, isVisible: boolean) => {
    const response = await apiClient.patch<ApiResponse<ProductDetailResponse>>(
      `/products/admin/${id}/visibility`,
      null,
      { params: { isVisible } },
    );
    return response.data as ProductDetailResponse;
  },

  updateDiscount: async (id: number, discountPercent: number) => {
    const response = await apiClient.patch<ApiResponse<ProductDetailResponse>>(
      `/products/admin/${id}/discount`,
      null,
      { params: { discountPercent } },
    );
    return response.data as ProductDetailResponse;
  },
};

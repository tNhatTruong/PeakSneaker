import apiClient, { type ApiResponse } from '../api';
import type { ProductDetailResponse, ProductResponse, PaginatedResponse } from '../productService';

export interface CreateProductPayload {
  name: string;
  description?: string;
  basePrice: number;
  discountPercent?: number;
  silhouetteId: number;
  categoryId?: number;
  gender?: 'MEN' | 'WOMEN' | 'UNISEX';
  productType?: 'SNEAKER' | 'ACCESSORY';
  isFeatured?: boolean;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  basePrice?: number;
  discountPercent?: number;
  silhouetteId?: number;
  categoryId?: number;
  gender?: 'MEN' | 'WOMEN' | 'UNISEX';
  productType?: 'SNEAKER' | 'ACCESSORY';
  isFeatured?: boolean;
}

const toFormData = (data: object, images: File[]): FormData => {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  images.forEach((file) => formData.append('images', file));
  return formData;
};

export const AdminProductService = {
  /** Admin: lay tat ca san pham (ke ca da xoa mem) */
  getAdminProducts: async (params?: {
    search?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProductResponse>>>('/products/admin', {
      params: { size: 10, sortBy: 'createdAt', sortDirection: 'desc', ...params },
    });
    // @ts-ignore
    return response.data as PaginatedResponse<ProductResponse>;
  },

  /** Tao san pham moi kem upload anh */
  createProduct: async (data: CreateProductPayload, images: File[]) => {
    const response = await apiClient.post<ApiResponse<ProductDetailResponse>>(
      '/products/admin',
      toFormData(data, images),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    // @ts-ignore
    return response.data as ProductDetailResponse;
  },

  /** Cap nhat san pham, them anh moi (giu nguyen anh cu) */
  updateProduct: async (id: number, data: UpdateProductPayload, images: File[]) => {
    const response = await apiClient.put<ApiResponse<ProductDetailResponse>>(
      `/products/admin/${id}`,
      toFormData(data, images),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    // @ts-ignore
    return response.data as ProductDetailResponse;
  },

  /** Xoa mem san pham */
  deleteProduct: async (id: number) => {
    await apiClient.delete(`/products/admin/${id}`);
  },
};

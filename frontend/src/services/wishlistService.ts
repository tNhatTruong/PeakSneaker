import apiClient, { type ApiResponse } from './api';

export interface WishlistItem {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  basePrice: number;
  brandName: string | null;
  primaryImageUrl: string | null;
  createdAt: string;
}

export const WishlistService = {
  getWishlist: async () => {
    const response = await apiClient.get<ApiResponse<WishlistItem[]>>('/wishlist');
    return response.data as WishlistItem[];
  },

  addToWishlist: async (productId: number) => {
    const response = await apiClient.post<ApiResponse<WishlistItem>>('/wishlist', { productId });
    return response.data as WishlistItem;
  },

  removeFromWishlist: async (productId: number) => {
    await apiClient.delete(`/wishlist/${productId}`);
  },

  checkInWishlist: async (productId: number) => {
    const response = await apiClient.get<ApiResponse<boolean>>(`/wishlist/check/${productId}`);
    return response.data as boolean;
  },
};

export default WishlistService;

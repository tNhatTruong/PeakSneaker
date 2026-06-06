import apiClient, { type ApiResponse } from './api';

export interface CartItemResponse {
  id: number;
  productId: number;
  productName: string;
  variantId: number;
  color: string;
  size: string;
  quantity: number;
  price: number;
  totalPrice: number;
  productThumbnail: string;
}

export interface CartResponse {
  id: number;
  userId?: number;
  items: CartItemResponse[];
  totalQuantity: number;
  totalPrice: number;
}

export const CartService = {
  getCart: async () => {
    const response = await apiClient.get<ApiResponse<CartResponse>>('/cart');
    // @ts-ignore
    return response.data as CartResponse;
  },

  addToCart: async (variantId: number, quantity: number = 1) => {
    const response = await apiClient.post<ApiResponse<CartItemResponse>>('/cart/items', {
      variantId,
      quantity
    });
    // @ts-ignore
    return response.data as CartItemResponse;
  },

  updateCartItem: async (itemId: number, quantity: number) => {
    const response = await apiClient.put<ApiResponse<CartItemResponse>>(`/cart/items/${itemId}`, {
      quantity
    });
    // @ts-ignore
    return response.data as CartItemResponse;
  },

  removeCartItem: async (itemId: number) => {
    await apiClient.delete(`/cart/items/${itemId}`);
  },

  clearCart: async () => {
    await apiClient.delete('/cart/items');
  }
};

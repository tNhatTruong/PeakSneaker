import apiClient, { type ApiResponse } from "./api";

export interface PaginatedResponse<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ReviewResponse {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewStatsResponse {
  averageRating: number;
  totalReviews: number;
}

export interface ReviewRequest {
  productId: number;
  rating: number;
  comment?: string;
}

export const ReviewService = {
  getProductReviews: async (productId: number, page: number = 0, size: number = 10) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ReviewResponse>>>(`/reviews/product/${productId}`, {
      params: { page, size }
    });
    return response.data;
  },

  getProductReviewStats: async (productId: number) => {
    const response = await apiClient.get<ApiResponse<ReviewStatsResponse>>(`/reviews/product/${productId}/stats`);
    return response.data as ReviewStatsResponse;
  },

  addOrUpdateReview: async (data: ReviewRequest) => {
    const response = await apiClient.post<ApiResponse<ReviewResponse>>(`/reviews`, data);
    return response.data as ReviewResponse;
  },

  getMyReview: async (productId: number) => {
    const response = await apiClient.get<ApiResponse<ReviewResponse>>(`/reviews/product/${productId}/me`);
    return response.data as ReviewResponse;
  },

  checkCanReview: async (productId: number) => {
    const response = await apiClient.get<ApiResponse<boolean>>(`/reviews/product/${productId}/can-review`);
    return response.data as boolean;
  }
};

import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/orders";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface CheckoutRequest {
  addressId: number;
  paymentMethod: string;
  voucherCode?: string;
  note?: string;
}

export interface OrderItemResponse {
  id: number;
  productId: number;
  productVariantId: number;
  productName: string;
  sku: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export interface OrderResponse {
  id: number;
  userId: number;
  voucherCode: string | null;
  items: OrderItemResponse[];
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  status: "PENDING" | "PROCESSING" | "DELIVERING" | "COMPLETED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  shippingName: string;
  shippingPhone: string;
  shippingProvince: string;
  shippingDistrict: string;
  shippingWard: string;
  shippingStreet: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const checkout = async (request: CheckoutRequest) => {
  const response = await axios.post(`${API_URL}/checkout`, request, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getOrders = async (page = 0, size = 10): Promise<PaginatedResponse<OrderResponse>> => {
  const response = await axios.get(`${API_URL}?page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });
  return response.data.data;
};

export const getOrderById = async (id: number): Promise<OrderResponse> => {
  const response = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data.data;
};

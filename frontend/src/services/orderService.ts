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

export const checkout = async (request: CheckoutRequest) => {
  const response = await axios.post(`${API_URL}/checkout`, request, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getOrders = async (page = 0, size = 10) => {
  const response = await axios.get(`${API_URL}?page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

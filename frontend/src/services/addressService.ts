import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/addresses";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface AddressRequest {
  recipientName: string;
  phone: string;
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
  wardId: string;
  wardName: string;
  streetDetail: string;
  isDefault: boolean;
}

export const createAddress = async (address: AddressRequest) => {
  const response = await axios.post(API_URL, address, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getAddresses = async () => {
  const response = await axios.get(API_URL, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

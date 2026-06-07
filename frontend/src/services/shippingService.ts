import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/shipping";

export interface Province {
  ProvinceID: number;
  ProvinceName: string;
}

export interface District {
  DistrictID: number;
  DistrictName: string;
}

export interface Ward {
  WardCode: string;
  WardName: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const getProvinces = async () => {
  const response = await axios.get(`${API_URL}/provinces`, getAuthHeaders());
  return response.data;
};

export const getDistricts = async (provinceId: number) => {
  const response = await axios.get(`${API_URL}/districts?provinceId=${provinceId}`, getAuthHeaders());
  return response.data;
};

export const getWards = async (districtId: number) => {
  const response = await axios.get(`${API_URL}/wards?districtId=${districtId}`, getAuthHeaders());
  return response.data;
};

export const calculateFee = async (districtId: number, wardCode: string) => {
  const response = await axios.post(`${API_URL}/fee?toDistrictId=${districtId}&toWardCode=${wardCode}`, {}, getAuthHeaders());
  return response.data;
};

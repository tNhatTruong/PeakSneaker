import apiClient, { type ApiResponse } from "./api";

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

export interface ShippingFee {
  total: number;
  serviceFee?: number;
  insuranceFee?: number;
}

export const getProvinces = async () => {
  return apiClient.get<ApiResponse<Province[]>>("/shipping/provinces");
};

export const getDistricts = async (provinceId: number) => {
  return apiClient.get<ApiResponse<District[]>>("/shipping/districts", { params: { provinceId } });
};

export const getWards = async (districtId: number) => {
  return apiClient.get<ApiResponse<Ward[]>>("/shipping/wards", { params: { districtId } });
};

export const calculateFee = async (districtId: number, wardCode: string) => {
  return apiClient.post<ApiResponse<ShippingFee>>("/shipping/fee", {}, {
    params: { toDistrictId: districtId, toWardCode: wardCode },
  });
};

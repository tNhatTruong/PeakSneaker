import apiClient, { type ApiResponse } from "./api";

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

export interface AddressResponse extends AddressRequest {
  id: number;
}

export const createAddress = async (address: AddressRequest): Promise<ApiResponse<AddressResponse>> => {
  return apiClient.post<ApiResponse<AddressResponse>, AddressRequest>("/addresses", address);
};

export const getAddresses = async (): Promise<ApiResponse<AddressResponse[]>> => {
  return apiClient.get<ApiResponse<AddressResponse[]>>("/addresses");
};

export const updateAddress = async (id: number, address: AddressRequest) => {
  return apiClient.put<ApiResponse<AddressResponse>, AddressRequest>(`/addresses/${id}`, address);
};

export const deleteAddress = async (id: number) => {
  return apiClient.delete<ApiResponse<void>>(`/addresses/${id}`);
};

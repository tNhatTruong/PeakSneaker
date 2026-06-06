import apiClient, { type ApiResponse } from './api';

export interface LoginResponse {
  token: string;
  userId: number;
  fullName: string;
  role: string;
}

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  role: string;
  createdAt: string;
}

export const AuthService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password
    });
    // @ts-ignore
    return response.data as LoginResponse;
  },

  register: async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      phone
    });
    // @ts-ignore
    return response;
  },

  getMe: async () => {
    const response = await apiClient.get<ApiResponse<UserResponse>>('/auth/me');
    // @ts-ignore
    return response.data as UserResponse;
  }
};

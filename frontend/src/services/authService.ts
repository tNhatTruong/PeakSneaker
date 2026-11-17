import apiClient, { type ApiResponse } from './api';

export const STAFF_AND_ADMIN_ROLES = [
  'ADMIN',
  'ROLE_ADMIN',
  'SUPER_ADMIN',
  'ROLE_SUPER_ADMIN',
  'STAFF_MANAGER',
  'ROLE_STAFF_MANAGER',
  'WAREHOUSE',
  'ROLE_WAREHOUSE',
  'SALES',
  'ROLE_SALES',
  'SUPPORT',
  'ROLE_SUPPORT',
  'MARKETING',
  'ROLE_MARKETING',
] as const;

export const isStaffOrAdminRole = (role?: string | null): boolean => {
  if (!role) return false;
  const roleUpper = role.trim().toUpperCase();
  return (STAFF_AND_ADMIN_ROLES as readonly string[]).includes(roleUpper);
};

export const getRoleDisplayName = (role?: string | null): string => {
  if (!role) return 'Khách hàng';
  const roleUpper = role.trim().toUpperCase();
  switch (roleUpper) {
    case 'ROLE_SUPER_ADMIN':
    case 'SUPER_ADMIN':
      return 'Quản trị viên cấp cao';
    case 'ROLE_STAFF_MANAGER':
    case 'STAFF_MANAGER':
      return 'Quản lý Nhân sự & Vận hành';
    case 'ROLE_WAREHOUSE':
    case 'WAREHOUSE':
      return 'Quản lý Kho vận';
    case 'ROLE_SALES':
    case 'SALES':
      return 'Nhân viên Bán hàng';
    case 'ROLE_SUPPORT':
    case 'SUPPORT':
      return 'Chăm sóc khách hàng';
    case 'ROLE_MARKETING':
    case 'MARKETING':
      return 'Marketing & Nội dung';
    case 'ROLE_ADMIN':
    case 'ADMIN':
      return 'Quản trị viên';
    default:
      return 'Khách hàng';
  }
};

export interface LoginResponse {
  token: string;
  userId: number;
  fullName: string;
  role: string;
  hasPassword?: boolean;
}

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  role: string;
  hasPassword?: boolean;
  createdAt: string;
}

export const AuthService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password
    });
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
    return response;
  },

  getMe: async () => {
    const response = await apiClient.get<ApiResponse<UserResponse>>('/auth/me');
    return response.data as UserResponse;
  },

  loginWithGoogle: async (token: string) => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/google', { token });
    return response.data as LoginResponse;
  },

  updateMe: async (data: { firstName: string; lastName: string; phone: string }) => {
    const response = await apiClient.put<ApiResponse<UserResponse>>('/auth/me', data);
    return response.data as UserResponse;
  },

  changePassword: async (data: { oldPassword?: string; newPassword: string; confirmPassword: string }) => {
    const response = await apiClient.post<ApiResponse<void>>('/auth/password', data);
    return response.data;
  },

  verifyOtp: async (email: string, otpCode: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/auth/verify-otp', { email, otpCode });
    return response;
  },

  resendOtp: async (email: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/auth/resend-otp', null, { params: { email } });
    return response;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/auth/forgot-password', { email });
    return response;
  },

  resetPassword: async (data: { email: string; token: string; newPassword: string }) => {
    const response = await apiClient.post<ApiResponse<void>>('/auth/reset-password', data);
    return response;
  },
};

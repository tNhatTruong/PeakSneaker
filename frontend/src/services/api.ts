import axios, { type AxiosRequestConfig } from 'axios';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface ApiClient {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>;
  put<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>;
  patch<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>;
}

// Cấu hình URL mặc định dựa trên môi trường Vite
export const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || '/api/v1';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Gắn token vào header nếu user đã đăng nhập
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: Xử lý lỗi trả về (ví dụ token hết hạn)
axiosClient.interceptors.response.use(
  (response) => {
    return response.data; // Bóc tách thẳng vào object `ApiResponse`
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Chỉ xóa token nếu bị lỗi xác thực 401 Unauthorized (token hết hạn hoặc không hợp lệ)
      localStorage.removeItem('token');
      // Chuyển hướng sang trang đăng nhập nếu chưa ở trang đăng nhập
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Response interceptor trả trực tiếp payload JSON thay vì AxiosResponse.
// Interface này giữ kiểu runtime và compile-time đồng nhất cho toàn bộ service layer.
export const apiClient = axiosClient as unknown as ApiClient;

export default apiClient;

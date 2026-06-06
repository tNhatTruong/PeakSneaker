import axios from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Cấu hình URL mặc định dựa trên môi trường Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Gắn token vào header nếu user đã đăng nhập
apiClient.interceptors.request.use(
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
apiClient.interceptors.response.use(
  (response) => {
    return response.data; // Bóc tách thẳng vào object `ApiResponse`
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Xóa token nếu bị lỗi xác thực 401 Unauthorized
      localStorage.removeItem('token');
      // Tùy chọn: Chuyển hướng sang trang đăng nhập (có thể dùng window.location)
    }
    return Promise.reject(error);
  }
);

export default apiClient;

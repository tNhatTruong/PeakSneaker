import apiClient, { type ApiResponse } from '../api';

export interface TopProductResponse {
  productId: number;
  productName: string;
  imageUrl: string;
  quantitySold: number;
  price: number;
}

export interface DashboardSummaryResponse {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  newCustomers: number;
  customersChange: number;
  conversionRate: number;
  conversionRateChange: number;
  lowStockCount: number;
  topProducts: TopProductResponse[];
}

export interface RevenueChartResponse {
  name: string;
  date: string;
  revenue: number;
}

export const AdminDashboardService = {
  getSummary: async () => {
    const response = await apiClient.get<ApiResponse<DashboardSummaryResponse>>('/admin/dashboard/summary');
    // @ts-ignore
    return response.data as DashboardSummaryResponse;
  },

  getRevenueChart: async () => {
    const response = await apiClient.get<ApiResponse<RevenueChartResponse[]>>('/admin/dashboard/revenue-chart');
    // @ts-ignore
    return response.data as RevenueChartResponse[];
  },
};

import apiClient, { type ApiResponse } from '../api';

export interface TopProductResponse {
  productId: number;
  productName: string;
  imageUrl: string;
  quantitySold: number;
  price: number;
  grossSales: number;
}

export interface BrandSalesResponse {
  brandName: string;
  grossSales: number;
}

export interface DashboardPeriodParams {
  from: string;
  to: string;
}

export interface LowStockItemResponse {
  variantId: number;
  productId: number;
  productName: string;
  imageUrl: string;
  sku: string;
  color: string;
  size: string;
  stock: number;
  safetyStockThreshold: number;
}

export interface DashboardSummaryResponse {
  periodStart: string;
  periodEnd: string;
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  processingOrders: number;
  shippingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  paidOrders: number;
  failedPaymentCount: number;
  codOrders: number;
  vnpayOrders: number;
  averageOrderValue: number;
  averageOrderValueChange: number;
  newCustomers: number;
  customersChange: number;
  conversionRate: number;
  conversionRateChange: number;
  cancellationRate: number;
  cancellationRateChange: number;
  lowStockCount: number;
  agedBatchCount: number;
  topProducts: TopProductResponse[];
  brandSales: BrandSalesResponse[];
  lowStockItems: LowStockItemResponse[];
  orderStatusCounts: Record<string, number>;
  paymentMethodCounts: Record<string, number>;
}

export interface RevenueChartResponse {
  name: string;
  date: string;
  revenue: number;
  orderCount: number;
}

const toFiniteNumber = (value: unknown): number => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const normalizeDashboardSummary = (
  payload: Partial<DashboardSummaryResponse> | null | undefined,
  fallbackPeriod?: DashboardPeriodParams,
): DashboardSummaryResponse => ({
  periodStart: payload?.periodStart ?? fallbackPeriod?.from ?? "",
  periodEnd: payload?.periodEnd ?? fallbackPeriod?.to ?? "",
  totalRevenue: toFiniteNumber(payload?.totalRevenue),
  revenueChange: toFiniteNumber(payload?.revenueChange),
  totalOrders: toFiniteNumber(payload?.totalOrders),
  ordersChange: toFiniteNumber(payload?.ordersChange),
  processingOrders: toFiniteNumber(payload?.processingOrders),
  shippingOrders: toFiniteNumber(payload?.shippingOrders),
  completedOrders: toFiniteNumber(payload?.completedOrders),
  cancelledOrders: toFiniteNumber(payload?.cancelledOrders),
  paidOrders: toFiniteNumber(payload?.paidOrders),
  failedPaymentCount: toFiniteNumber(payload?.failedPaymentCount),
  codOrders: toFiniteNumber(payload?.codOrders),
  vnpayOrders: toFiniteNumber(payload?.vnpayOrders),
  averageOrderValue: toFiniteNumber(payload?.averageOrderValue),
  averageOrderValueChange: toFiniteNumber(payload?.averageOrderValueChange),
  newCustomers: toFiniteNumber(payload?.newCustomers),
  customersChange: toFiniteNumber(payload?.customersChange),
  conversionRate: toFiniteNumber(payload?.conversionRate),
  conversionRateChange: toFiniteNumber(payload?.conversionRateChange),
  cancellationRate: toFiniteNumber(payload?.cancellationRate),
  cancellationRateChange: toFiniteNumber(payload?.cancellationRateChange),
  lowStockCount: toFiniteNumber(payload?.lowStockCount),
  agedBatchCount: toFiniteNumber(payload?.agedBatchCount),
  topProducts: Array.isArray(payload?.topProducts) ? payload.topProducts : [],
  brandSales: Array.isArray(payload?.brandSales) ? payload.brandSales : [],
  lowStockItems: Array.isArray(payload?.lowStockItems) ? payload.lowStockItems : [],
  orderStatusCounts: payload?.orderStatusCounts ?? {},
  paymentMethodCounts: payload?.paymentMethodCounts ?? {},
});

export const AdminDashboardService = {
  getSummary: async (params?: DashboardPeriodParams) => {
    const response = await apiClient.get<ApiResponse<DashboardSummaryResponse>>('/admin/dashboard/summary', {
      params,
    });
    return normalizeDashboardSummary(response.data, params);
  },

  getRevenueChart: async (params?: DashboardPeriodParams) => {
    const response = await apiClient.get<ApiResponse<RevenueChartResponse[]>>('/admin/dashboard/revenue-chart', {
      params,
    });
    return Array.isArray(response.data)
      ? response.data.map((item) => ({
          ...item,
          revenue: toFiniteNumber(item.revenue),
          orderCount: toFiniteNumber(item.orderCount),
        }))
      : [];
  },
};

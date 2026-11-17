import apiClient, { type ApiResponse } from '../api';
import type { PaginatedResponse } from '../orderService';

export interface BatchItem {
  id: number;
  variantId: number;
  variantSku: string;
  variantColor?: string;
  variantSize?: string;
  productId?: number;
  productName: string;
  productImageUrl?: string | null;
  brandName?: string | null;
  batchCode: string;
  supplierName: string;
  quantityImported: number;
  quantityRemaining: number;
  unitCost: number;
  retailPrice?: number;
  manufacturingDate?: string;
  expiryDate?: string;
  receivedDate: string;
  poNumber?: string;
  invoiceNumber?: string;
  paymentStatus?: 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE';
  isQuarantined?: boolean;
  quarantineReason?: string;
}

export interface BatchTraceabilityResponse {
  variantId: number;
  variantSku: string;
  productName: string;
  productImageUrl?: string | null;
  color?: string;
  size?: string;
  batches: Array<{
    batchId: number;
    batchCode: string;
    supplierName: string;
    quantityImported: number;
    quantityRemaining: number;
    unitCost: number;
    poNumber?: string;
    invoiceNumber?: string;
    paymentStatus?: string;
    isQuarantined: boolean;
    quarantineReason?: string;
    receivedDate: string;
  }>;
  orders: Array<{
    orderId: number;
    orderCode: string;
    customerName: string;
    customerPhone?: string;
    quantityOrdered: number;
    orderStatus: string;
    orderDate: string;
  }>;
  returns: Array<{
    returnId: number;
    orderCode: string;
    quantityReturned: number;
    returnReason: string;
    returnStatus: string;
    evidenceImages: string[];
    customerNotes?: string;
    createdAt: string;
  }>;
}

export interface SupplierClaimResponse {
  batchId: number;
  batchCode: string;
  supplierName: string;
  poNumber?: string;
  invoiceNumber?: string;
  paymentStatus?: string;
  unitCost: number;
  productName: string;
  variantSku: string;
  color?: string;
  size?: string;
  totalReceived: number;
  currentRemaining: number;
  quarantinedQuantity: number;
  defectiveFromCustomersCount: number;
  totalClaimQuantity: number;
  totalClaimAmount: number;
  recommendation: string;
  claimReferenceCode: string;
  generatedAt: string;
}

export interface QuarantineBatchPayload {
  quarantine: boolean;
  reason?: string;
}

export interface AuditLogItem {
  id: number;
  variantId: number;
  variantSku: string;
  variantColor?: string;
  variantSize?: string;
  sku?: string;
  color?: string;
  size?: string;
  productId?: number;
  productName: string;
  productImageUrl?: string | null;
  brandName?: string | null;
  changeType: string;
  quantityChanged: number;
  previousStock?: number;
  currentStock?: number;
  note?: string;
  reason?: string;
  orderCode?: string;
  batchCode?: string;
  unitCost?: number;
  performedBy: string;
  createdAt: string;
  formattedCreatedAt?: string;
}

export interface AuditLogSummary {
  total: number;
  importCount: number;
  orderHoldCount: number;
  restockCount: number;
  adjustmentCount: number;
  performers: string[];
}

export type ForecastRiskStatus = 'CRITICAL' | 'WARNING' | 'FAST_MOVING' | 'SLOW_MOVING' | 'HEALTHY';

export interface InventoryForecastItem {
  variantId: number;
  sku: string;
  color: string;
  size: string;
  productId: number;
  productName: string;
  productImageUrl?: string | null;
  brandId?: number | null;
  brandName?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  stock: number;
  safetyStockThreshold: number;
  soldInPeriod: number;
  dailyVelocity: number;
  daysUntilStockout: number | null;
  reorderPoint: number;
  suggestedReorderQty: number;
  retailPrice: number;
  latestUnitCost: number;
  estimatedRestockCost: number;
  latestSupplierName: string;
  forecastStatus: ForecastRiskStatus;
}

export interface InventoryForecastSummary {
  totalVariants: number;
  criticalCount: number;
  warningCount: number;
  fastMovingCount: number;
  slowMovingCount: number;
  healthyCount: number;
  totalSuggestedUnits: number;
  totalEstimatedRestockCost: number;
}

export interface LowStockVariantItem {
  id: number;
  sku: string;
  color: string;
  size: string;
  stock: number;
  priceMultiplier: number;
  finalPrice: number;
}

export interface CreateBatchPayload {
  variantId: number;
  batchCode: string;
  supplierName: string;
  quantityImported: number;
  unitCost: number;
  manufacturingDate?: string;
  expiryDate?: string;
  poNumber?: string;
  invoiceNumber?: string;
  paymentStatus?: 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE';
}

export const AdminBatchesService = {
  createBatch: async (data: CreateBatchPayload) => {
    const response = await apiClient.post<ApiResponse<BatchItem>>('/admin/batches', data);
    return response.data as BatchItem;
  },

  getBatches: async (params?: {
    search?: string;
    variantId?: number;
    isQuarantined?: boolean;
    page?: number;
    size?: number;
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<BatchItem>>>('/admin/batches', { params });
    return response.data as PaginatedResponse<BatchItem>;
  },

  toggleQuarantine: async (id: number, payload: QuarantineBatchPayload) => {
    const response = await apiClient.post<ApiResponse<BatchItem>>(`/admin/batches/${id}/quarantine`, payload);
    return response.data as BatchItem;
  },

  traceBatch: async (query: string) => {
    const response = await apiClient.get<ApiResponse<BatchTraceabilityResponse>>('/admin/batches/trace', {
      params: { query },
    });
    return response.data as BatchTraceabilityResponse;
  },

  getSupplierClaim: async (id: number) => {
    const response = await apiClient.get<ApiResponse<SupplierClaimResponse>>(`/admin/batches/${id}/supplier-claim`);
    return response.data as SupplierClaimResponse;
  },

  getAuditLogs: async (params?: {
    search?: string;
    variantId?: number;
    categoryGroup?: string;
    performedBy?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<AuditLogItem>>>('/admin/batches/audit-logs', { params });
    return response.data as PaginatedResponse<AuditLogItem>;
  },

  getAuditLogSummary: async () => {
    const response = await apiClient.get<ApiResponse<AuditLogSummary>>('/admin/batches/audit-logs/summary');
    return response.data as AuditLogSummary;
  },

  getForecast: async (params?: {
    days?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    brandId?: number;
    categoryId?: number;
    forecastStatus?: string;
    sortBy?: string;
    page?: number;
    size?: number;
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<InventoryForecastItem>>>('/admin/batches/forecast', { params });
    return response.data as PaginatedResponse<InventoryForecastItem>;
  },

  getForecastSummary: async (
    params?:
      | number
      | {
          days?: number;
          startDate?: string;
          endDate?: string;
        },
  ) => {
    const queryParams = typeof params === 'number' ? { days: params } : (params ?? { days: 30 });
    const response = await apiClient.get<ApiResponse<InventoryForecastSummary>>('/admin/batches/forecast/summary', {
      params: queryParams,
    });
    return response.data as InventoryForecastSummary;
  },

  getLowStock: async (threshold: number = 10): Promise<LowStockVariantItem[]> => {
    const response = await apiClient.get<ApiResponse<LowStockVariantItem[]>>('/admin/batches/low-stock', { params: { threshold } });
    return Array.isArray(response.data) ? response.data : [];
  },
};

export default AdminBatchesService;

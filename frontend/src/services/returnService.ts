import apiClient, { type ApiResponse } from './api';

export type ReturnReasonCode =
  | 'WRONG_SIZE'
  | 'DEFECTIVE_PRODUCT'
  | 'WRONG_ITEM'
  | 'NOT_AS_DESCRIBED'
  | 'SHIPPING_DAMAGE'
  | 'CHANGE_OF_MIND'
  | 'OTHER';

export interface OrderReturnPayload {
  orderId: number;
  returnType: 'RETURN_REFUND' | 'EXCHANGE';
  reasonCode: ReturnReasonCode;
  reason: string;
  evidenceImages?: string[];
  items: Array<{ orderItemId: number; quantity: number }>;
}

export interface OrderReturnLine {
  id: number;
  orderItemId: number;
  productVariantId: number | null;
  productId: number | null;
  productName: string;
  sku: string;
  variantName: string;
  unitPrice: number;
  purchasedQuantity: number;
  requestedQuantity: number;
  approvedQuantity: number;
  receivedQuantity: number;
  restockableQuantity: number;
  replacementVariantId: number | null;
  replacementSku: string | null;
  conditionNote: string | null;
  restockedAt: string | null;
}

export interface OrderReturnItem {
  id: number;
  orderId: number;
  orderCode: string;
  userId: number;
  userEmail: string;
  customerName: string;
  customerPhone: string | null;
  returnType: 'RETURN_REFUND' | 'EXCHANGE';
  reasonCode: ReturnReasonCode;
  reason: string;
  evidenceImages: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'GOODS_RECEIVED' | 'COMPLETED';
  refundAmount: number;
  adminNotes: string | null;
  processedBy: string | null;
  createdAt: string;
  updatedAt: string;
  paymentMethod: 'COD' | 'VNPAY';
  orderStatus: string;
  items: OrderReturnLine[];
}

export const ReturnService = {
  createReturn: async (data: OrderReturnPayload) => {
    const response = await apiClient.post<ApiResponse<OrderReturnItem>>('/orders/returns', data);
    return response.data as OrderReturnItem;
  },

  getUserReturns: async () => {
    const response = await apiClient.get<ApiResponse<OrderReturnItem[]>>('/orders/returns');
    return response.data as OrderReturnItem[];
  },

  getReturnDetail: async (id: number) => {
    const response = await apiClient.get<ApiResponse<OrderReturnItem>>(`/orders/returns/${id}`);
    return response.data as OrderReturnItem;
  },
};

export default ReturnService;

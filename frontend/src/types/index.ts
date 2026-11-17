// ==============================================================================
// PEAKSNEAKER CORE TYPE DEFINITIONS & API CONTRACTS
// File: frontend/src/types/index.ts
// Mục đích: Tập trung hóa các hợp đồng kiểu dữ liệu (Data Contracts) dùng chung
// ==============================================================================

// --- TẦNG PHẢN HỒI API CHUẨN (API WRAPPERS) ---
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// --- PHÂN HỆ NGƯỜI DÙNG & PHÂN QUYỀN (AUTH & RBAC) ---
export type SystemRole =
  | 'ROLE_SUPER_ADMIN'
  | 'ROLE_STAFF_MANAGER'
  | 'ROLE_WAREHOUSE'
  | 'ROLE_SALES'
  | 'ROLE_SUPPORT'
  | 'ROLE_MARKETING'
  | 'ROLE_CUSTOMER'
  | 'ROLE_ADMIN'
  | 'ROLE_USER';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: SystemRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface StaffProfile {
  id: number;
  userId: number;
  employeeCode: string;
  department: string;
  positionTitle?: string;
  staffStatus: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  joinedAt: string;
  notes?: string;
  user?: User;
}

export interface Permission {
  id: number;
  code: string;
  name: string;
  module: 'DASHBOARD' | 'ORDER' | 'PRODUCT' | 'INVENTORY' | 'MARKETING' | 'STAFF';
  description?: string;
}

// --- PHÂN HỆ SẢN PHẨM & BIẾN THỂ (CATALOG & VARIANTS) ---
export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
  description?: string;
}

export interface Silhouette {
  id: number;
  brandId: number;
  name: string;
  slug: string;
  description?: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  color: string;
  colorCode?: string;
  size: string;
  stockQuantity: number;
  safetyStockThreshold: number;
  priceAdjustment: number;
  finalPrice?: number;
}

export interface Product {
  id: number;
  categoryId?: number;
  brandId?: number;
  silhouetteId?: number;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  gender: 'MEN' | 'WOMEN' | 'UNISEX';
  productType: 'SNEAKER' | 'ACCESSORY';
  isFeatured: boolean;
  isDeleted: boolean;
  variants?: ProductVariant[];
  images?: string[];
  createdAt: string;
}

// --- PHÂN HỆ ĐƠN HÀNG, THANH TOÁN & GIAO VẬN (ORDERS & LOGISTICS) ---
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED';
export type PaymentMethod = 'COD' | 'VNPAY';

export interface OrderItem {
  id: number;
  orderId: number;
  productVariantId?: number;
  productName: string;
  sku: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderCode: string;
  userId?: number;
  voucherId?: number;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  ghnOrderCode?: string;
  ghnTrackingStatus?: string;
  shippingName: string;
  shippingPhone: string;
  shippingProvince: string;
  shippingDistrict: string;
  shippingWard: string;
  shippingStreet: string;
  note?: string;
  cancelReason?: string;
  createdAt: string;
  deliveredAt?: string;
  items?: OrderItem[];
}

// --- PHÂN HỆ ĐỔI TRẢ RMA (REVERSE LOGISTICS) ---
export type ReturnType = 'RETURN_REFUND' | 'EXCHANGE';
export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'GOODS_RECEIVED' | 'COMPLETED' | 'CANCELLED';
export type ReturnReasonCode =
  | 'DEFECTIVE_PRODUCT'
  | 'WRONG_ITEM'
  | 'WRONG_SIZE'
  | 'NOT_AS_DESCRIBED'
  | 'SHIPPING_DAMAGE'
  | 'CHANGE_OF_MIND'
  | 'OTHER';

export interface OrderReturnItem {
  id: number;
  orderReturnId: number;
  orderItemId: number;
  requestedQuantity: number;
  approvedQuantity: number;
  receivedQuantity: number;
  restockableQuantity: number;
  replacementVariantId?: number;
  conditionNote?: string;
}

export interface OrderReturn {
  id: number;
  orderId: number;
  userId: number;
  returnType: ReturnType;
  reasonCode: ReturnReasonCode;
  reason: string;
  evidenceImages?: string[];
  status: ReturnStatus;
  refundAmount?: number;
  adminNotes?: string;
  processedBy?: string;
  createdAt: string;
  items?: OrderReturnItem[];
}

// --- PHÂN HỆ KHUYẾN MÃI, ĐỊA CHỈ & ĐÁNH GIÁ ---
export interface Voucher {
  id: number;
  code: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Address {
  id: number;
  userId: number;
  recipientName: string;
  phone: string;
  provinceId: number;
  provinceName: string;
  districtId: number;
  districtName: string;
  wardCode: string;
  wardName: string;
  streetDetail: string;
  isDefault: boolean;
}

export interface ProductReview {
  id: number;
  userId: number;
  productId: number;
  orderItemId?: number;
  rating: number;
  comment?: string;
  isVerifiedPurchase: boolean;
  status: 'APPROVED' | 'HIDDEN';
  images?: string[];
  createdAt: string;
}

export interface ContactMessage {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}


import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Check,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Loader2,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminFilterHeader from '../../components/admin/AdminFilterHeader';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminPagination from '../../components/admin/AdminPagination';
import { AdminDetailEmptyState, AdminDetailPanel } from '../../components/admin/AdminDetailPanel';
import {
  AdminReturnsService,
  type ReturnFilterOptions,
  type ReturnFilterParams,
  type UpdateReturnStatusPayload,
} from '../../services/admin/adminReturnsService';
import { AdminOrderService, type OrderResponse } from '../../services/admin/adminOrderService';
import { ProductService, type ProductVariantResponse } from '../../services/productService';
import type { OrderReturnItem, ReturnReasonCode } from '../../services/returnService';

type ReturnStatus = OrderReturnItem['status'];
type ReturnStatusFilter = ReturnStatus | 'ALL';
type ReturnTypeFilter = OrderReturnItem['returnType'] | 'ALL';
type ReasonFilter = ReturnReasonCode | 'ALL';
type PaymentMethodFilter = OrderReturnItem['paymentMethod'] | 'ALL';

interface FilterState {
  query: string;
  from: string;
  to: string;
  status: ReturnStatusFilter;
  reasonCode: ReasonFilter;
  returnType: ReturnTypeFilter;
  paymentMethod: PaymentMethodFilter;
}

interface ReturnItemDecision {
  approvedQuantity: number;
  receivedQuantity: number;
  restockableQuantity: number;
  conditionNote: string;
}

const EMPTY_FILTERS: FilterState = {
  query: '',
  from: '',
  to: '',
  status: 'ALL',
  reasonCode: 'ALL',
  returnType: 'ALL',
  paymentMethod: 'ALL',
};

const STATUS_OPTIONS: Array<{ value: ReturnStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'REQUESTED', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt · Chờ nhận hàng' },
  { value: 'GOODS_RECEIVED', label: 'Đã nhận hàng · Chờ hoàn tất' },
  { value: 'COMPLETED', label: 'Đã hoàn tất' },
  { value: 'REJECTED', label: 'Đã từ chối' },
];

const STATUS_LABELS: Record<ReturnStatus, string> = {
  REQUESTED: 'Chờ duyệt',
  APPROVED: 'Chờ nhận hàng',
  GOODS_RECEIVED: 'Chờ hoàn tất',
  COMPLETED: 'Đã hoàn tất',
  REJECTED: 'Đã từ chối',
};

const REASON_OPTIONS: Array<{ value: ReasonFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả lý do' },
  { value: 'WRONG_SIZE', label: 'Kích thước không phù hợp' },
  { value: 'DEFECTIVE_PRODUCT', label: 'Sản phẩm lỗi kỹ thuật' },
  { value: 'WRONG_ITEM', label: 'Giao sai sản phẩm / màu sắc' },
  { value: 'NOT_AS_DESCRIBED', label: 'Sản phẩm không đúng mô tả' },
  { value: 'SHIPPING_DAMAGE', label: 'Hư hại khi vận chuyển' },
  { value: 'CHANGE_OF_MIND', label: 'Không còn phù hợp nhu cầu' },
  { value: 'OTHER', label: 'Lý do khác' },
];

const REASON_LABELS = Object.fromEntries(
  REASON_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => [option.value, option.label]),
) as Record<ReturnReasonCode, string>;

const NEXT_STATUS: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['GOODS_RECEIVED'],
  GOODS_RECEIVED: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
};

const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
}).format(value);

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
}).format(new Date(value));

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback;
  const response = (error as { response?: { data?: { message?: unknown } } }).response;
  return typeof response?.data?.message === 'string' ? response.data.message : fallback;
};

const parseEvidenceImages = (value?: string): string[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
};

function StatusBadge({ status }: { status: ReturnStatus }) {
  const styles: Record<ReturnStatus, string> = {
    REQUESTED: 'border-amber-200 bg-amber-50 text-amber-800',
    APPROVED: 'border-blue-200 bg-blue-50 text-blue-700',
    GOODS_RECEIVED: 'border-violet-200 bg-violet-50 text-violet-700',
    COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  };
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}>{STATUS_LABELS[status]}</span>;
}

function ReturnTypeBadge({ type }: { type: OrderReturnItem['returnType'] }) {
  return type === 'RETURN_REFUND'
    ? <span className="inline-flex rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700">Hoàn tiền</span>
    : <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">Đổi hàng</span>;
}

const calculateMaximumRefund = (item: OrderReturnItem, order: OrderResponse | null): number => {
  const approvedGross = item.items.reduce(
    (sum, line) => sum + line.unitPrice * (line.approvedQuantity || line.requestedQuantity),
    0,
  );
  if (!order || order.subtotalAmount <= 0) return Math.floor(approvedGross);
  const merchandisePaid = Math.max(0, order.subtotalAmount - order.discountAmount);
  const proRated = (approvedGross * merchandisePaid) / order.subtotalAmount;
  return Math.floor(Math.min(proRated, merchandisePaid));
};

export default function AdminReturnsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId') ?? '';
  const initialStatus = (searchParams.get('status') as ReturnStatusFilter | null) ?? 'ALL';
  const [draftFilters, setDraftFilters] = useState<FilterState>({ ...EMPTY_FILTERS, status: initialStatus });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({ ...EMPTY_FILTERS, status: initialStatus });
  const [orderIdFilter, setOrderIdFilter] = useState(initialOrderId);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [returns, setReturns] = useState<OrderReturnItem[]>([]);
  const [filterOptions, setFilterOptions] = useState<ReturnFilterOptions>({ statusCounts: {}, products: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedReturn, setSelectedReturn] = useState<OrderReturnItem | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [productVariantsMap, setProductVariantsMap] = useState<Record<number, ProductVariantResponse[]>>({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalStatus, setModalStatus] = useState<ReturnStatus>('APPROVED');
  const [modalRefundAmount, setModalRefundAmount] = useState(0);
  const [modalAdminNotes, setModalAdminNotes] = useState('');
  const [replacementVariants, setReplacementVariants] = useState<Record<number, string>>({});
  const [itemDecisions, setItemDecisions] = useState<Record<number, ReturnItemDecision>>({});
  const [updating, setUpdating] = useState(false);
  const [, setQuickActionId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const activeFilterCount = useMemo(() => Object.entries(appliedFilters)
    .filter(([key, value]) => value && value !== 'ALL' && !(key === 'status' && value === 'ALL')).length
    + (orderIdFilter ? 1 : 0), [appliedFilters, orderIdFilter]);

  useEffect(() => {
    const paramOrderId = searchParams.get('orderId') ?? '';
    setOrderIdFilter((current) => (current !== paramOrderId ? paramOrderId : current));
  }, [searchParams]);

  const initializeDecisionState = useCallback((item: OrderReturnItem, order: OrderResponse | null = null) => {
    const nextStep = NEXT_STATUS[item.status][0] ?? item.status;
    setModalStatus(nextStep);
    const maxRefund = calculateMaximumRefund(item, order);
    setModalRefundAmount(
      item.refundAmount > 0
        ? item.refundAmount
        : item.returnType === 'RETURN_REFUND' && nextStep === 'COMPLETED'
          ? maxRefund
          : 0,
    );
    setModalAdminNotes(item.adminNotes || '');
    setReplacementVariants(Object.fromEntries(item.items.map((line) => [line.id, line.replacementVariantId?.toString() ?? ''])));
    setItemDecisions(Object.fromEntries(item.items.map((line) => {
      const defaultApproved = item.status === 'REQUESTED'
        ? (line.approvedQuantity > 0 ? line.approvedQuantity : line.requestedQuantity)
        : line.approvedQuantity;
      const defaultReceived = item.status === 'APPROVED'
        ? (line.receivedQuantity > 0 ? line.receivedQuantity : defaultApproved)
        : line.receivedQuantity;
      const defaultRestockable = item.status === 'APPROVED'
        ? (line.restockableQuantity > 0 ? line.restockableQuantity : defaultReceived)
        : line.restockableQuantity;
      return [line.id, {
        approvedQuantity: defaultApproved,
        receivedQuantity: defaultReceived,
        restockableQuantity: defaultRestockable,
        conditionNote: line.conditionNote ?? '',
      }];
    })));
  }, []);

  const openDetail = useCallback(async (item: OrderReturnItem) => {
    setSelectedReturn(item);
    setSelectedOrder(null);
    initializeDecisionState(item, null);
    setDetailLoading(true);
    try {
      const [returnDetail, orderDetail] = await Promise.all([
        AdminReturnsService.getReturnById(item.id),
        AdminOrderService.getOrderById(item.orderId),
      ]);
      setSelectedReturn(returnDetail);
      setSelectedOrder(orderDetail);
      initializeDecisionState(returnDetail, orderDetail);

      if (returnDetail.returnType === 'EXCHANGE') {
        const productIds = Array.from(
          new Set(returnDetail.items.map((line) => line.productId).filter((id): id is number => typeof id === 'number' && id > 0)),
        );
        if (productIds.length > 0) {
          const loadedEntries = await Promise.all(
            productIds.map(async (productId) => {
              try {
                const detail = await ProductService.getProductById(productId);
                return [productId, detail.variants ?? []] as const;
              } catch {
                return [productId, []] as const;
              }
            }),
          );
          setProductVariantsMap((current) => ({
            ...current,
            ...Object.fromEntries(loadedEntries),
          }));
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải đầy đủ chi tiết yêu cầu'));
    } finally {
      setDetailLoading(false);
    }
  }, [initializeDecisionState]);

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      const params: ReturnFilterParams = { page, size: 10 };
      if (appliedFilters.query.trim()) params.query = appliedFilters.query.trim();
      if (appliedFilters.status !== 'ALL') params.status = appliedFilters.status;
      if (appliedFilters.reasonCode !== 'ALL') params.reasonCode = appliedFilters.reasonCode;
      if (appliedFilters.returnType !== 'ALL') params.returnType = appliedFilters.returnType;
      if (appliedFilters.paymentMethod !== 'ALL') params.paymentMethod = appliedFilters.paymentMethod;
      if (appliedFilters.from) params.from = appliedFilters.from;
      if (appliedFilters.to) params.to = appliedFilters.to;
      if (orderIdFilter) params.orderId = Number(orderIdFilter);
      const data = await AdminReturnsService.getReturns(params);
      const items = data.items ?? [];
      setReturns(items);
      setTotalPages(Math.max(data.totalPages ?? 1, 1));
      setTotalElements(data.totalElements ?? 0);
      if (orderIdFilter && items.length > 0) {
        setSelectedReturn((current) => {
          if (current && items.some((candidate) => candidate.id === current.id)) return current;
          void openDetail(items[0]);
          return items[0];
        });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải danh sách yêu cầu đổi trả'));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, openDetail, orderIdFilter, page]);

  const fetchOptions = useCallback(async () => {
    try {
      setFilterOptions(await AdminReturnsService.getFilterOptions());
    } catch {
      setFilterOptions({ statusCounts: {}, products: [] });
    }
  }, []);

  useEffect(() => { void fetchReturns(); }, [fetchReturns]);
  useEffect(() => { void fetchOptions(); }, [fetchOptions]);

  const applyFilters = () => {
    if (draftFilters.from && draftFilters.to && draftFilters.from > draftFilters.to) {
      toast.error('Ngày bắt đầu không thể sau ngày kết thúc');
      return;
    }
    setPage(0);
    setAppliedFilters(draftFilters);
    const next = new URLSearchParams();
    if (draftFilters.status !== 'ALL') next.set('status', draftFilters.status);
    if (orderIdFilter) next.set('orderId', orderIdFilter);
    setSearchParams(next);
  };

  const clearOrderIdFilter = () => {
    setOrderIdFilter('');
    setPage(0);
    const next = new URLSearchParams(searchParams);
    next.delete('orderId');
    setSearchParams(next);
  };

  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setOrderIdFilter('');
    setPage(0);
    setSearchParams(new URLSearchParams());
  };

  const buildPayload = (item: OrderReturnItem, status: ReturnStatus, adminNotes = modalAdminNotes): UpdateReturnStatusPayload => ({
    status,
    refundAmount: modalRefundAmount > 0 ? modalRefundAmount : undefined,
    adminNotes: adminNotes.trim() || undefined,
    items: item.items.map((line) => ({
      returnItemId: line.id,
      ...(status === 'APPROVED' ? { approvedQuantity: itemDecisions[line.id]?.approvedQuantity ?? line.requestedQuantity } : {}),
      ...(status === 'GOODS_RECEIVED' ? {
        receivedQuantity: itemDecisions[line.id]?.receivedQuantity ?? line.approvedQuantity,
        restockableQuantity: itemDecisions[line.id]?.restockableQuantity ?? line.approvedQuantity,
        conditionNote: itemDecisions[line.id]?.conditionNote || undefined,
      } : {}),
      ...(status === 'COMPLETED' && replacementVariants[line.id]
        ? { replacementVariantId: Number(replacementVariants[line.id]) } : {}),
    })),
  });

  const processReturn = async (item: OrderReturnItem, status: ReturnStatus, notes = modalAdminNotes) => {
    if (status === 'REJECTED' && !notes.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      setUpdating(true);
      const updated = await AdminReturnsService.updateStatus(item.id, buildPayload(item, status, notes));
      toast.success(status === 'REJECTED' ? 'Đã từ chối yêu cầu' : 'Đã cập nhật yêu cầu đổi trả');
      setSelectedReturn((current) => current?.id === updated.id ? updated : current);
      if (selectedOrder && updated.orderId === selectedOrder.id) {
        try {
          const refreshedOrder = await AdminOrderService.getOrderById(updated.orderId);
          setSelectedOrder(refreshedOrder);
          initializeDecisionState(updated, refreshedOrder);
        } catch {
          initializeDecisionState(updated, selectedOrder);
        }
      } else {
        initializeDecisionState(updated, selectedOrder);
      }
      await Promise.all([fetchReturns(), fetchOptions()]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể cập nhật yêu cầu đổi trả'));
    } finally {
      setUpdating(false);
    }
  };

  const quickDecision = async (item: OrderReturnItem, status: 'APPROVED' | 'REJECTED') => {
    let notes = '';
    if (status === 'REJECTED') {
      notes = window.prompt('Nhập lý do từ chối yêu cầu:')?.trim() ?? '';
      if (!notes) return;
    } else if (!window.confirm(`Duyệt yêu cầu RMA-${String(item.id).padStart(5, '0')}?`)) {
      return;
    }
    setQuickActionId(item.id);
    try {
      await AdminReturnsService.updateStatus(item.id, {
        status,
        adminNotes: notes || undefined,
        items: status === 'APPROVED'
          ? item.items.map((line) => ({ returnItemId: line.id, approvedQuantity: line.requestedQuantity }))
          : undefined,
      });
      toast.success(status === 'APPROVED' ? 'Đã duyệt yêu cầu' : 'Đã từ chối yêu cầu');
      await Promise.all([fetchReturns(), fetchOptions()]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xử lý yêu cầu'));
    } finally {
      setQuickActionId(null);
    }
  };

  useEffect(() => {
    if (!previewImage) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (previewImage) setPreviewImage(null);
    };
    window.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', close);
    };
  }, [previewImage]);

  const statusCount = (status: ReturnStatusFilter) => status === 'ALL'
    ? Object.values(filterOptions.statusCounts).reduce((sum, count) => sum + (count ?? 0), 0)
    : filterOptions.statusCounts[status] ?? 0;

  return (
    <div className="space-y-4 pb-10">
      <AdminPageHeader
        title="Đổi trả (RMA)"
        description="Kiểm duyệt yêu cầu, tiếp nhận hàng hoàn và xử lý hoàn tiền hoặc đổi hàng."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/orders"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <Package className="h-4 w-4" /> Quản lý Đơn hàng
            </Link>
            <button
              type="button"
              onClick={() => {
                void fetchReturns();
                void fetchOptions();
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
            </button>
          </div>
        }
      />

      <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:items-start">
      <div className="min-w-0 space-y-3">
      <div className="z-30 -mx-1 bg-slate-50 px-1 pb-2 2xl:sticky 2xl:-top-5">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <AdminFilterHeader isOpen={filtersOpen} onToggle={() => setFiltersOpen((value) => !value)} activeCount={activeFilterCount} onReset={resetFilters} />
          {filtersOpen && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                applyFilters();
              }}
              className="space-y-3 p-4"
            >
              <div className="grid items-end gap-3 lg:grid-cols-[minmax(0,2.2fr)_minmax(170px,0.95fr)_minmax(170px,0.95fr)]">
                <label className="relative min-w-0">
                  <span className="sr-only">Tìm yêu cầu đổi trả</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={draftFilters.query}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))}
                    placeholder="Tìm mã RMA, mã đơn, khách hàng, email, SĐT hoặc sản phẩm..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">Từ ngày</span>
                  <input type="date" value={draftFilters.from} onChange={(event) => setDraftFilters((current) => ({ ...current, from: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">Đến ngày</span>
                  <input type="date" value={draftFilters.to} onChange={(event) => setDraftFilters((current) => ({ ...current, to: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400" />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">Trạng thái</span>
                  <select value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value as ReturnStatusFilter }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400">
                    {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">Lý do</span>
                  <select value={draftFilters.reasonCode} onChange={(event) => setDraftFilters((current) => ({ ...current, reasonCode: event.target.value as ReasonFilter }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400">
                    {REASON_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">Loại yêu cầu</span>
                  <select value={draftFilters.returnType} onChange={(event) => setDraftFilters((current) => ({ ...current, returnType: event.target.value as ReturnTypeFilter }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400">
                    <option value="ALL">Tất cả</option>
                    <option value="RETURN_REFUND">Hoàn tiền</option>
                    <option value="EXCHANGE">Đổi hàng</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">Phương thức hoàn tiền</span>
                  <select value={draftFilters.paymentMethod} onChange={(event) => setDraftFilters((current) => ({ ...current, paymentMethod: event.target.value as PaymentMethodFilter }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400">
                    <option value="ALL">Tất cả</option>
                    <option value="COD">COD</option>
                    <option value="VNPAY">VNPay</option>
                  </select>
                </label>
                <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-lg bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300">
                  <Search className="h-4 w-4" /> Áp dụng
                </button>
              </div>
              {orderIdFilter && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs text-blue-900">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">Đang lọc theo Đơn hàng #{orderIdFilter}</span>
                    {returns[0]?.orderCode && <span className="font-mono font-bold text-blue-700">({returns[0].orderCode})</span>}
                    <Link
                      to={`/admin/orders?orderId=${orderIdFilter}`}
                      className="inline-flex items-center gap-1 font-semibold text-blue-700 underline-offset-2 hover:underline"
                    >
                      Mở đơn hàng <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={clearOrderIdFilter}
                    className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2 py-1 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100"
                  >
                    <X className="h-3 w-3" /> Bỏ lọc đơn
                  </button>
                </div>
              )}
            </form>
          )}
        </section>
      </div>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm [&_table]:table-fixed [&_table]:!min-w-[860px]">
        <header className="border-b border-slate-200 px-4 pt-4">
          <div className="flex items-center justify-between gap-3 pb-3"><div><h2 className="text-sm font-black text-slate-950">Danh sách yêu cầu đổi trả</h2><p className="mt-0.5 text-xs text-slate-500">{totalElements.toLocaleString('vi-VN')} yêu cầu phù hợp</p></div></div>
          <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-slate-100">
            <div className="flex min-w-max gap-1">
              {STATUS_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => { const next = { ...draftFilters, status: option.value }; setDraftFilters(next); setAppliedFilters(next); setPage(0); }} className={`border-b-2 px-3 py-2.5 text-xs font-bold transition ${appliedFilters.status === option.value ? 'border-slate-950 text-slate-950' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>{option.label.replace('Tất cả trạng thái', 'Tất cả')} <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{statusCount(option.value)}</span></button>)}
            </div>
          </div>
        </header>

        {loading ? <div className="py-20 text-center text-sm text-slate-500"><Loader2 className="mr-2 inline h-5 w-5 animate-spin" />Đang tải danh sách...</div> : returns.length === 0 ? <div className="py-20 text-center text-slate-400"><RotateCcw className="mx-auto h-9 w-9 opacity-30" /><p className="mt-3 text-sm font-semibold">Không tìm thấy yêu cầu phù hợp</p></div> : <>
          <div className="grid gap-3 p-3 xl:hidden">{returns.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-sm font-black">RMA-{String(item.id).padStart(5, '0')}</p><p className="mt-1 text-xs font-bold text-blue-600">{item.orderCode || `Đơn #${item.orderId}`}</p></div><StatusBadge status={item.status} /></div><p className="mt-3 text-sm font-bold">{item.items[0]?.productName}</p><p className="mt-1 text-xs text-slate-500">{item.customerName || item.userEmail} · {getReasonLabel(item.reasonCode)}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</span><div className="flex gap-2">{item.status === 'REQUESTED' && <><IconButton label="Duyệt" onClick={() => void quickDecision(item, 'APPROVED')}><Check className="h-4 w-4" /></IconButton><IconButton label="Từ chối" danger onClick={() => void quickDecision(item, 'REJECTED')}><X className="h-4 w-4" /></IconButton></>}<IconButton label="Xem chi tiết" onClick={() => void openDetail(item)}><Eye className="h-4 w-4" /></IconButton></div></div></article>)}</div>
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[860px] text-left text-xs">
              <colgroup>
                <col className="w-[10%]" /><col className="w-[13%]" /><col className="w-[14%]" /><col className="w-[18%]" />
                <col className="w-[10%]" /><col className="w-[15%]" /><col className="w-[11%]" /><col className="w-[9%]" />
              </colgroup>
              <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500">
                <tr><th className="px-3 py-3">Mã RMA</th><th className="px-3 py-3">Mã đơn</th><th className="px-3 py-3">Khách hàng</th><th className="px-3 py-3">Sản phẩm</th><th className="px-3 py-3">Phân loại</th><th className="px-3 py-3">Lý do & mô tả</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3">Ngày gửi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map((item) => {
                  const first = item.items[0];
                  return (
                    <tr key={item.id} onClick={() => void openDetail(item)} className={`cursor-pointer align-middle transition hover:bg-blue-50/40 ${selectedReturn?.id === item.id ? 'bg-blue-50/60' : ''}`}>
                      <td className="truncate px-3 py-3 font-mono font-black text-slate-950" title={`RMA-${String(item.id).padStart(5, '0')}`}>RMA-{String(item.id).padStart(5, '0')}</td>
                      <td className="truncate px-3 py-3 font-bold text-blue-600" title={item.orderCode || `#${item.orderId}`}>{item.orderCode || `#${item.orderId}`}</td>
                      <td className="min-w-0 px-3 py-3"><p className="truncate font-bold text-slate-800">{item.customerName || 'Khách hàng'}</p><p className="mt-1 truncate text-[11px] text-slate-400">{item.userEmail}</p></td>
                      <td className="min-w-0 px-3 py-3"><p className="truncate font-bold text-slate-800">{first?.productName ?? '—'}</p><p className="mt-1 truncate text-[11px] text-slate-400">{first ? `${first.variantName} · ${first.sku}${item.items.length > 1 ? ` · +${item.items.length - 1}` : ''}` : '—'}</p></td>
                      <td className="px-3 py-3"><ReturnTypeBadge type={item.returnType} /></td>
                      <td className="min-w-0 px-3 py-3"><p className="truncate font-bold text-slate-700">{getReasonLabel(item.reasonCode)}</p><p className="mt-1 truncate text-[11px] text-slate-400">{item.reason}</p></td>
                      <td className="px-3 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-3 py-3 whitespace-nowrap text-[11px] text-slate-500">{formatDateTime(item.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <AdminPagination page={page} totalPages={totalPages} totalElements={totalElements} pageSize={10} visibleCount={returns.length} itemLabel="yêu cầu" disabled={loading} onPageChange={setPage} />
        </>}
      </section>
      </div>

      {selectedReturn ? <ReturnDetailPanel item={selectedReturn} order={selectedOrder} productVariantsMap={productVariantsMap} loading={detailLoading} evidence={parseEvidenceImages(selectedReturn.evidenceImages)} status={modalStatus} setStatus={setModalStatus} refundAmount={modalRefundAmount} setRefundAmount={setModalRefundAmount} notes={modalAdminNotes} setNotes={setModalAdminNotes} decisions={itemDecisions} setDecisions={setItemDecisions} replacementVariants={replacementVariants} setReplacementVariants={setReplacementVariants} updating={updating} onClose={() => setSelectedReturn(null)} onProcess={(status) => void processReturn(selectedReturn, status)} onPreview={setPreviewImage} /> : <AdminDetailPanel ariaLabel="Chưa chọn yêu cầu đổi trả"><AdminDetailEmptyState icon={<RotateCcw className="h-9 w-9" />} title="Chưa chọn yêu cầu đổi trả" description="Chọn một yêu cầu trong danh sách để xem hồ sơ và quyết định xử lý." items={["Thông tin đơn hàng và khách hàng", "Sản phẩm, lý do và hình ảnh", "Tiến trình và phán định xử lý"]} /></AdminDetailPanel>}
      </div>

      {previewImage && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewImage(null); }}>
          <button type="button" onClick={() => setPreviewImage(null)} className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          <img src={previewImage} alt="Ảnh bằng chứng" className="max-h-[88vh] max-w-[92vw] rounded-xl object-contain" />
        </div>,
        document.body,
      )}
    </div>
  );
}

const getReasonLabel = (code: ReturnReasonCode | undefined) => code ? REASON_LABELS[code] ?? 'Lý do khác' : 'Lý do khác';

function IconButton({ label, danger = false, onClick, children }: { label: string; danger?: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} className={`grid h-9 w-9 place-items-center rounded-lg border transition ${danger ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}>{children}</button>;
}

interface ReturnDetailPanelProps {
  item: OrderReturnItem;
  order: OrderResponse | null;
  productVariantsMap: Record<number, ProductVariantResponse[]>;
  loading: boolean;
  evidence: string[];
  status: ReturnStatus;
  setStatus: (status: ReturnStatus) => void;
  refundAmount: number;
  setRefundAmount: (value: number) => void;
  notes: string;
  setNotes: (value: string) => void;
  decisions: Record<number, ReturnItemDecision>;
  setDecisions: Dispatch<SetStateAction<Record<number, ReturnItemDecision>>>;
  replacementVariants: Record<number, string>;
  setReplacementVariants: Dispatch<SetStateAction<Record<number, string>>>;
  updating: boolean;
  onClose: () => void;
  onProcess: (status: ReturnStatus) => void;
  onPreview: (url: string) => void;
}

function ReturnDetailPanel(props: ReturnDetailPanelProps) {
  const {
    item,
    order,
    productVariantsMap,
    loading,
    evidence,
    status,
    setStatus,
    refundAmount,
    setRefundAmount,
    notes,
    setNotes,
    decisions,
    setDecisions,
    replacementVariants,
    setReplacementVariants,
    updating,
    onClose,
    onProcess,
    onPreview,
  } = props;
  const nextStatuses = NEXT_STATUS[item.status];
  const closed = nextStatuses.length === 0;
  const address = order ? [order.shippingStreet, order.shippingWard, order.shippingDistrict, order.shippingProvince].filter(Boolean).join(', ') : '';
  const orderLine = (orderItemId: number) => order?.items.find((candidate) => candidate.id === orderItemId);
  const customerName = item.customerName || order?.shippingName || 'Khách hàng';
  const initials = customerName.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase();
  const maxRefund = calculateMaximumRefund(item, order);

  return (
    <AdminDetailPanel ariaLabel={`Chi tiết yêu cầu RMA-${String(item.id).padStart(5, '0')}`} className="flex flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <div>
            <h2 className="text-sm font-black text-slate-950">Chi tiết yêu cầu đổi trả</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </header>

        {loading ? (
          <div className="grid min-h-[420px] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3">
              <div className="space-y-3.5">
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-slate-950">RMA-{String(item.id).padStart(5, '0')}</p>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Đơn hàng{' '}
                        <Link
                          to={`/admin/orders?orderId=${item.orderId}`}
                          className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
                        >
                          {item.orderCode || order?.orderCode || `#${item.orderId}`}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <span className="mx-2 text-slate-300">•</span>
                        Tạo lúc {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ReturnTypeBadge type={item.returnType} />
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{getReasonLabel(item.reasonCode)}</span>
                    </div>
                  </div>
                </section>

                <DetailSection title="Thông tin khách hàng & đơn hàng">
                  <div className="grid gap-4">
                    <div className="flex min-w-0 gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-black text-blue-700">{initials || 'KH'}</div>
                      <div className="min-w-0 text-sm">
                        <p className="font-bold text-slate-950">{customerName}</p>
                        <p className="mt-1 text-slate-600">{item.customerPhone || order?.shippingPhone || 'Chưa có số điện thoại'}</p>
                        <p className="break-all text-slate-600">{item.userEmail}</p>
                        {address && <p className="mt-1.5 text-xs leading-5 text-slate-500">{address}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs">
                      <DetailValue label="Trạng thái đơn" value={item.orderStatus || order?.status || '—'} />
                      <DetailValue label="Thanh toán" value={order ? `${order.paymentMethod} · ${order.paymentStatus}` : item.paymentMethod} />
                      <DetailValue label="Ngày đặt" value={order ? formatDateTime(order.createdAt) : '—'} />
                      <DetailValue label="Ngày giao" value={order?.deliveredAt ? formatDateTime(order.deliveredAt) : 'Chưa có'} />
                      <DetailValue label="Tạm tính" value={order ? formatCurrency(order.subtotalAmount) : '—'} />
                      <DetailValue label="Giảm giá" value={order ? formatCurrency(order.discountAmount) : '—'} />
                      <DetailValue label="Phí giao hàng" value={order ? formatCurrency(order.shippingFee) : '—'} />
                      <DetailValue label="Tổng thanh toán" value={order ? formatCurrency(order.finalAmount) : '—'} emphasized />
                      {order?.voucherCode && <DetailValue label="Voucher" value={order.voucherCode} />}
                      {order?.ghnOrderCode && <DetailValue label="Mã vận đơn" value={order.ghnOrderCode} />}
                    </div>
                  </div>
                </DetailSection>

                <DetailSection title={`Sản phẩm yêu cầu đổi trả (${item.items.length})`}>
                  <div className="divide-y divide-slate-100">
                    {item.items.map((line) => {
                      const purchasedItem = orderLine(line.orderItemId);
                      const availableVariants = line.productId ? (productVariantsMap[line.productId] ?? []) : [];
                      return (
                        <div key={line.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex gap-3 sm:gap-4">
                            {purchasedItem?.imageUrl ? (
                              <img src={purchasedItem.imageUrl} alt={line.productName} className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-contain" />
                            ) : (
                              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50">
                                <Package className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold leading-5 text-slate-950">{line.productName}</p>
                              <p className="mt-1 text-xs text-slate-500">SKU: {line.sku || '—'}</p>
                              <p className="mt-0.5 text-xs text-slate-500">Phân loại: {line.variantName || '—'}</p>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                <span>Đã mua: <strong>{line.purchasedQuantity}</strong></span>
                                <span>Yêu cầu: <strong>{line.requestedQuantity}</strong></span>
                                <span className="font-bold text-slate-950">{formatCurrency(line.unitPrice)}</span>
                              </div>
                              {(line.approvedQuantity > 0 || line.receivedQuantity > 0 || item.status === 'GOODS_RECEIVED' || item.status === 'COMPLETED') && (
                                <p className="mt-2 text-xs text-slate-500">
                                  Đã duyệt {line.approvedQuantity} · Đã nhận {line.receivedQuantity} · Hoàn kho {line.restockableQuantity}
                                </p>
                              )}
                              {line.replacementSku && (
                                <p className="mt-1 text-xs font-semibold text-blue-700">
                                  Biến thể đổi: {line.replacementSku}
                                </p>
                              )}
                              {line.conditionNote && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Kiểm định: {line.conditionNote}
                                </p>
                              )}
                            </div>
                          </div>

                          {!closed && status === 'APPROVED' && (
                            <NumberField label="Số lượng duyệt" value={decisions[line.id]?.approvedQuantity ?? 0} max={line.requestedQuantity} onChange={(value) => setDecisions((current) => ({ ...current, [line.id]: { ...current[line.id], approvedQuantity: value } }))} />
                          )}
                          {!closed && status === 'GOODS_RECEIVED' && (
                            <div className="mt-3 grid gap-2">
                              <NumberField label="Số lượng đã nhận" value={decisions[line.id]?.receivedQuantity ?? 0} max={line.approvedQuantity} onChange={(value) => setDecisions((current) => ({ ...current, [line.id]: { ...current[line.id], receivedQuantity: value, restockableQuantity: Math.min(current[line.id]?.restockableQuantity ?? value, value) } }))} />
                              <NumberField label="Đủ điều kiện hoàn kho" value={decisions[line.id]?.restockableQuantity ?? 0} max={decisions[line.id]?.receivedQuantity ?? line.approvedQuantity} onChange={(value) => setDecisions((current) => ({ ...current, [line.id]: { ...current[line.id], restockableQuantity: value } }))} />
                              <label className="text-xs font-semibold text-slate-600">Kết quả kiểm định
                                <input value={decisions[line.id]?.conditionNote ?? ''} onChange={(event) => setDecisions((current) => ({ ...current, [line.id]: { ...current[line.id], conditionNote: event.target.value } }))} placeholder="VD: Đế giày nguyên vẹn, hộp hơi móp..." className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" />
                              </label>
                            </div>
                          )}
                          {!closed && item.returnType === 'EXCHANGE' && status === 'COMPLETED' && (
                            <label className="mt-3 block text-xs font-semibold text-slate-600">
                              Chọn biến thể xuất đổi (cần tồn ≥ {line.approvedQuantity})
                              {availableVariants.length > 0 ? (
                                <select
                                  value={replacementVariants[line.id] ?? ''}
                                  onChange={(event) => setReplacementVariants((current) => ({ ...current, [line.id]: event.target.value }))}
                                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-slate-400"
                                >
                                  <option value="">-- Chọn phân loại thay thế --</option>
                                  {availableVariants.map((variant) => {
                                    const isOriginal = variant.id === line.productVariantId;
                                    const insufficientStock = variant.stock < line.approvedQuantity;
                                    return (
                                      <option
                                        key={variant.id}
                                        value={variant.id.toString()}
                                        disabled={insufficientStock}
                                      >
                                        {variant.color} / Size {variant.size} — {variant.sku} (Tồn: {variant.stock})
                                        {isOriginal ? ' [Cùng size gốc]' : ''}
                                        {insufficientStock ? ' [Không đủ tồn]' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Nhập ID biến thể đổi..."
                                  value={replacementVariants[line.id] ?? ''}
                                  onChange={(event) => setReplacementVariants((current) => ({ ...current, [line.id]: event.target.value }))}
                                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                                />
                              )}
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </DetailSection>

                <DetailSection title="Hình ảnh & mô tả từ khách hàng" suffix={`${evidence.length} ảnh`}>
                  {evidence.length > 0 ? (
                    <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                      {evidence.map((url, index) => (
                        <button key={url} type="button" onClick={() => onPreview(url)} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          <img src={url} alt={`Bằng chứng đổi trả ${index + 1}`} className="h-full w-full object-cover transition hover:scale-105" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500"><ImageIcon className="h-4 w-4" />Khách hàng không gửi ảnh bằng chứng.</div>
                  )}
                  <div className="rounded-lg bg-slate-50 px-3.5 py-3">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.reason || 'Khách hàng không cung cấp mô tả bổ sung.'}</p>
                  </div>
                </DetailSection>

                <DetailSection title="Tiến trình xử lý">
                  <ReturnTimeline item={item} />
                </DetailSection>

                <DetailSection title="Phán định & xử lý">
                  {item.adminNotes && (
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
                      <p className="text-[11px] font-bold uppercase text-amber-700">Ghi chú đã lưu</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-amber-950">{item.adminNotes}</p>
                    </div>
                  )}
                  {closed ? (
                    <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                      Hồ sơ đã đóng bởi {item.processedBy || 'quản trị viên'}.
                      {item.refundAmount > 0 && <> Số tiền hoàn: <strong>{formatCurrency(item.refundAmount)}</strong>.</>}
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {item.status !== 'REQUESTED' && (
                        <label className="block text-xs font-bold text-slate-600">Bước tiếp theo
                          <select value={status} onChange={(event) => setStatus(event.target.value as ReturnStatus)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-slate-400">
                            {nextStatuses.map((next) => <option key={next} value={next}>{STATUS_LABELS[next]}</option>)}
                          </select>
                        </label>
                      )}
                      {item.returnType === 'RETURN_REFUND' && status === 'COMPLETED' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-600">Số tiền hoàn (VND)</span>
                            {maxRefund > 0 && (
                              <button
                                type="button"
                                onClick={() => setRefundAmount(maxRefund)}
                                className="text-[11px] font-bold text-blue-600 hover:underline"
                              >
                                Điền mức tối đa ({formatCurrency(maxRefund)})
                              </button>
                            )}
                          </div>
                          <input
                            type="number"
                            min="0"
                            max={maxRefund > 0 ? maxRefund : undefined}
                            step="1000"
                            value={refundAmount}
                            onChange={(event) => setRefundAmount(Number(event.target.value))}
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                          />
                          <p className="text-[11px] text-slate-500">
                            Trần hoàn tối đa sau khấu trừ ưu đãi: <strong className="text-slate-700">{formatCurrency(maxRefund)}</strong>
                          </p>
                        </div>
                      )}
                      <label className="block text-xs font-bold text-slate-600">{item.status === 'REQUESTED' ? 'Ghi chú phán định' : 'Ghi chú xử lý'}
                        <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={item.status === 'REQUESTED' ? 'Nhập hướng dẫn gửi hàng hoặc lý do từ chối...' : 'Nhập kết quả kiểm định hoặc nội dung xử lý...'} className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm leading-5 outline-none focus:border-slate-400" />
                      </label>
                    </div>
                  )}
                </DetailSection>
              </div>
            </div>

            <footer className="shrink-0 space-y-2 border-t border-slate-200 bg-white px-3 py-3">
              <p className="truncate text-[11px] text-slate-400">Cập nhật gần nhất: {formatDateTime(item.updatedAt)}</p>
              <div className="flex w-full gap-2">
                {closed ? (
                  <button type="button" onClick={onClose} className="h-10 w-full rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50">Đóng</button>
                ) : item.status === 'REQUESTED' ? (
                  <>
                    <button type="button" disabled={updating} onClick={() => onProcess('REJECTED')} className="h-10 flex-1 whitespace-nowrap rounded-lg border border-rose-200 px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Từ chối</button>
                    <button type="button" disabled={updating} onClick={() => onProcess('APPROVED')} className="inline-flex h-10 flex-[1.45] items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-slate-950 px-3 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50">
                      {updating && <Loader2 className="h-4 w-4 animate-spin" />}Duyệt yêu cầu
                    </button>
                  </>
                ) : (
                  <button type="button" disabled={updating} onClick={() => onProcess(status)} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50">
                    {updating && <Loader2 className="h-4 w-4 animate-spin" />}Xác nhận {STATUS_LABELS[status].toLowerCase()}
                  </button>
                )}
              </div>
            </footer>
          </>
        )}
      </div>
    </AdminDetailPanel>
  );
}

function DetailSection({ title, suffix, children }: { title: string; suffix?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
        {suffix && <span className="text-xs font-semibold text-slate-400">{suffix}</span>}
      </div>
      {children}
    </section>
  );
}

function DetailValue({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-slate-400">{label}</p>
      <p className={`mt-0.5 truncate font-semibold ${emphasized ? 'text-slate-950' : 'text-slate-700'}`} title={value}>{value}</p>
    </div>
  );
}

function ReturnTimeline({ item }: { item: OrderReturnItem }) {
  const steps = item.status === 'REJECTED'
    ? [
      { key: 'REQUESTED', label: 'Khách hàng tạo yêu cầu', detail: 'Hồ sơ được gửi đến bộ phận hậu mãi', time: item.createdAt },
      { key: 'REJECTED', label: 'Yêu cầu bị từ chối', detail: item.adminNotes || 'Không đủ điều kiện xử lý', time: item.updatedAt },
    ]
    : [
      { key: 'REQUESTED', label: 'Khách hàng tạo yêu cầu', detail: 'Hồ sơ được gửi đến bộ phận hậu mãi', time: item.createdAt },
      { key: 'APPROVED', label: 'Admin duyệt yêu cầu', detail: 'Chờ khách hàng gửi sản phẩm về kho', time: item.status === 'APPROVED' ? item.updatedAt : undefined },
      { key: 'GOODS_RECEIVED', label: 'Kho nhận và kiểm định hàng', detail: 'Ghi nhận số lượng, tình trạng và khả năng hoàn kho', time: item.status === 'GOODS_RECEIVED' ? item.updatedAt : undefined },
      { key: 'COMPLETED', label: 'Hoàn tất đổi trả', detail: item.returnType === 'EXCHANGE' ? 'Đã xác nhận sản phẩm thay thế' : 'Đã hoàn tất nghiệp vụ hoàn tiền', time: item.status === 'COMPLETED' ? item.updatedAt : undefined },
    ];
  const progressIndex: Record<string, number> = { REQUESTED: 0, APPROVED: 1, GOODS_RECEIVED: 2, COMPLETED: 3, REJECTED: 1 };
  const currentIndex = progressIndex[item.status];

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const reached = index <= currentIndex;
        const current = index === currentIndex;
        return (
          <li key={step.key} className="grid grid-cols-[18px_minmax(0,1fr)] gap-3">
            <div className="flex flex-col items-center">
              <span className={`mt-1.5 h-2.5 w-2.5 rounded-full border-2 ${current ? 'border-slate-950 bg-white' : reached ? 'border-slate-950 bg-slate-950' : 'border-slate-300 bg-white'}`} />
              {index < steps.length - 1 && <span className={`min-h-12 w-px flex-1 ${index < currentIndex ? 'bg-slate-800' : 'bg-slate-200'}`} />}
            </div>
            <div className="pb-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className={`text-sm font-bold ${reached ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                {step.time && <time className="text-[11px] text-slate-400">{formatDateTime(step.time)}</time>}
              </div>
              <p className={`mt-0.5 text-xs leading-5 ${reached ? 'text-slate-500' : 'text-slate-400'}`}>{step.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function NumberField({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  return <label className="mt-3 block text-xs font-semibold text-slate-600">{label}<input type="number" min="0" max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" /></label>;
}

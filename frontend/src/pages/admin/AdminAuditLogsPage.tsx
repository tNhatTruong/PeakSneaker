import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  UserCheck,
  X,
} from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminFilterHeader from '../../components/admin/AdminFilterHeader';
import AdminPagination from '../../components/admin/AdminPagination';
import { AdminDetailEmptyState, AdminDetailPanel } from '../../components/admin/AdminDetailPanel';
import {
  AdminBatchesService,
  type AuditLogItem,
  type AuditLogSummary,
} from '../../services/admin/adminBatchesService';

interface AuditFilters {
  categoryGroup: string;
  performedBy: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FILTERS: AuditFilters = {
  categoryGroup: '',
  performedBy: '',
  startDate: '',
  endDate: '',
};

const EMPTY_SUMMARY: AuditLogSummary = {
  total: 0,
  importCount: 0,
  orderHoldCount: 0,
  restockCount: 0,
  adjustmentCount: 0,
  performers: [],
};

const getActionMetadata = (changeType: string) => {
  switch (changeType) {
    case 'IMPORT':
    case 'INITIAL_IMPORT':
      return {
        label: 'Nhập kho / Lô hàng',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: ArrowDownLeft,
        iconClass: 'text-emerald-600',
        direction: 'IN',
      };
    case 'ORDER_HOLD':
      return {
        label: 'Tạm giữ đơn hàng',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: ArrowUpRight,
        iconClass: 'text-amber-600',
        direction: 'OUT',
      };
    case 'ORDER_DEDUCT':
      return {
        label: 'Xuất kho giao hàng',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: ArrowUpRight,
        iconClass: 'text-blue-600',
        direction: 'OUT',
      };
    case 'RESTOCK':
    case 'RETURN_RESTOCK':
      return {
        label: 'Hoàn kho (Hủy đơn/RMA)',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: RotateCcw,
        iconClass: 'text-purple-600',
        direction: 'IN',
      };
    case 'ADJUSTMENT':
    case 'DEFECT':
    case 'DEMO_NORMALIZE':
      return {
        label: 'Điều chỉnh kiểm kê',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        icon: Activity,
        iconClass: 'text-slate-600',
        direction: 'ADJUST',
      };
    default:
      return {
        label: changeType || 'Khác',
        badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
        icon: Activity,
        iconClass: 'text-slate-500',
        direction: 'NEUTRAL',
      };
  }
};

const formatDelta = (previous?: number, current?: number) => {
  if (previous == null || current == null) return null;
  const delta = current - previous;
  if (delta === 0) return { text: '0', class: 'text-slate-400 font-semibold' };
  if (delta > 0) return { text: `+${delta}`, class: 'text-emerald-600 font-black' };
  return { text: `${delta}`, class: 'text-rose-600 font-black' };
};

const formatVND = (value?: number) =>
  value != null ? value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '—';

export default function AdminAuditLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary>(EMPTY_SUMMARY);
  const [selectedItem, setSelectedItem] = useState<AuditLogItem | null>(null);

  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  const [draftFilters, setDraftFilters] = useState<AuditFilters>(() => ({
    categoryGroup: searchParams.get('categoryGroup') ?? '',
    performedBy: searchParams.get('performedBy') ?? '',
    startDate: searchParams.get('startDate') ?? '',
    endDate: searchParams.get('endDate') ?? '',
  }));
  const [appliedFilters, setAppliedFilters] = useState<AuditFilters>(draftFilters);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await AdminBatchesService.getAuditLogSummary();
      setSummary(res);
    } catch {
      setSummary(EMPTY_SUMMARY);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await AdminBatchesService.getAuditLogs({
        page,
        size: pageSize,
        search: debouncedSearch.trim() || undefined,
        categoryGroup: appliedFilters.categoryGroup || undefined,
        performedBy: appliedFilters.performedBy || undefined,
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
      });

      const fetchedItems = res.items ?? [];
      setItems(fetchedItems);
      setTotalPages(Math.max(1, res.totalPages ?? 1));
      setTotalElements(res.totalElements ?? 0);

      if (fetchedItems.length === 0) {
        setSelectedItem(null);
      } else {
        setSelectedItem((prev) => {
          if (!prev) return fetchedItems[0];
          const matched = fetchedItems.find((item) => item.id === prev.id);
          return matched || fetchedItems[0];
        });
      }
    } catch {
      setItems([]);
      setSelectedItem(null);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, appliedFilters]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setPage(0);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (draftFilters.categoryGroup) params.set('categoryGroup', draftFilters.categoryGroup);
    if (draftFilters.performedBy) params.set('performedBy', draftFilters.performedBy);
    if (draftFilters.startDate) params.set('startDate', draftFilters.startDate);
    if (draftFilters.endDate) params.set('endDate', draftFilters.endDate);
    setSearchParams(params, { replace: true });
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(0);
    setSearchParams({}, { replace: true });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.categoryGroup) count++;
    if (appliedFilters.performedBy) count++;
    if (appliedFilters.startDate) count++;
    if (appliedFilters.endDate) count++;
    return count;
  }, [appliedFilters]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Nhật ký Hoạt động"
        description="Giám sát minh bạch mọi thay đổi tồn kho, phân hệ nghiệp vụ, nhân sự thực hiện và đối soát số liệu hệ thống."
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <AdminFilterHeader
          isOpen={isFilterExpanded}
          onToggle={() => setIsFilterExpanded(!isFilterExpanded)}
          activeCount={activeFilterCount}
          onReset={handleResetFilters}
          title="Bộ lọc & Tìm kiếm Nhật ký"
        />

        {isFilterExpanded && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Nhân sự thực hiện</label>
                <select
                  value={draftFilters.performedBy}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, performedBy: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400"
                >
                  <option value="">Tất cả tài khoản ({summary.performers.length})</option>
                  {summary.performers.map((performer) => (
                    <option key={performer} value={performer}>
                      {performer}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Phân hệ thao tác</label>
                <select
                  value={draftFilters.categoryGroup}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, categoryGroup: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400"
                >
                  <option value="">Tất cả phân hệ</option>
                  <option value="IMPORT">Nhập kho / Lô hàng</option>
                  <option value="ORDER">Bán hàng & Đơn hàng</option>
                  <option value="RESTOCK">Hoàn kho & Trả hàng</option>
                  <option value="ADJUSTMENT">Kiểm kê & Điều chỉnh</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Từ ngày</label>
                <input
                  type="date"
                  value={draftFilters.startDate}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Đến ngày</label>
                <input
                  type="date"
                  value={draftFilters.endDate}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Workspace */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* Cột trái: Bảng danh sách log */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs lg:col-span-7 xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-3.5">
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã SKU, sản phẩm, mã đơn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-7 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value={15}>15 dòng</option>
                <option value={30}>30 dòng</option>
                <option value={50}>50 dòng</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  void fetchLogs();
                  void fetchSummary();
                }}
                disabled={loading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 pl-4 pr-2">Thời gian</th>
                  <th className="px-2 py-2.5">Thao tác</th>
                  <th className="px-2 py-2.5">Sản phẩm / SKU</th>
                  <th className="px-2 py-2.5 text-center">Biến động</th>
                  <th className="px-2 py-2.5">Người thực hiện</th>
                  <th className="py-2.5 pl-2 pr-4 text-right">Chứng từ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
                      <p className="text-xs font-semibold">Đang tải dữ liệu nhật ký...</p>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <FileText className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                      <p className="text-xs font-semibold">Không tìm thấy bản ghi nhật ký phù hợp</p>
                    </td>
                  </tr>
                ) : (
                  items.map((log) => {
                    const meta = getActionMetadata(log.changeType);
                    const delta = formatDelta(log.previousStock, log.currentStock);
                    const isSelected = selectedItem?.id === log.id;
                    const ActionIcon = meta.icon;

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedItem(log)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-100/90 font-semibold' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="whitespace-nowrap py-2.5 pl-4 pr-2 text-[11px] text-slate-500">
                          {log.formattedCreatedAt || log.createdAt}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                          >
                            <ActionIcon className={`h-2.5 w-2.5 ${meta.iconClass}`} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="max-w-[200px] truncate font-bold text-slate-900" title={log.productName}>
                            {log.productName || 'Sản phẩm không xác định'}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">
                            {log.variantSku || log.sku} {log.variantSize || log.size ? `· Size ${log.variantSize || log.size}` : ''}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-center">
                          {delta ? (
                            <span className={delta.class}>{delta.text}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          <div className="text-[10px] text-slate-400">
                            {log.previousStock ?? '—'} → {log.currentStock ?? '—'}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                            <UserCheck className="h-3 w-3 text-slate-400" />
                            {log.performedBy || 'SYSTEM'}
                          </div>
                        </td>
                        <td className="whitespace-nowrap py-2.5 pl-2 pr-4 text-right font-mono text-[11px] text-slate-600">
                          {log.orderCode ? (
                            <span className="text-blue-600 hover:underline">{log.orderCode}</span>
                          ) : log.batchCode ? (
                            <span className="text-emerald-700 font-bold">{log.batchCode}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            visibleCount={items.length}
            itemLabel="bản ghi nhật ký"
            onPageChange={setPage}
          />
        </div>

        {/* Cột phải: Panel chi tiết bản ghi (Audit Log Detail) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <AdminDetailPanel ariaLabel="Chi tiết Nhật ký">
            {!selectedItem ? (
              <AdminDetailEmptyState
                icon={<Clock className="h-8 w-8 text-blue-500" />}
                title="Chưa chọn bản ghi"
                description="Chọn một bản ghi nhật ký trong bảng bên trái để xem đầy đủ chi tiết đối soát."
              />
            ) : (
              <div className="p-4 space-y-4">
                {/* Header card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Mã bản ghi #{selectedItem.id}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        getActionMetadata(selectedItem.changeType).badgeClass
                      }`}
                    >
                      {getActionMetadata(selectedItem.changeType).label}
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-black text-slate-900">{selectedItem.productName}</h4>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">
                    SKU: {selectedItem.variantSku || selectedItem.sku}{' '}
                    {selectedItem.variantSize || selectedItem.size ? `· Size ${selectedItem.variantSize || selectedItem.size}` : ''}
                  </p>
                </div>

                {/* Đối soát số lượng */}
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Đối soát Tồn kho thực tế
                  </p>
                  <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-[10px] font-bold text-slate-400">Trước thao tác</p>
                      <p className="mt-1 text-base font-black text-slate-700">
                        {selectedItem.previousStock ?? '—'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-[10px] font-bold text-slate-400">Biến động</p>
                      <p className="mt-1 text-base font-black text-slate-900">
                        {formatDelta(selectedItem.previousStock, selectedItem.currentStock)?.text ?? '—'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-[10px] font-bold text-slate-400">Sau thao tác</p>
                      <p className="mt-1 text-base font-black text-slate-900">
                        {selectedItem.currentStock ?? '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Thông tin ngữ cảnh */}
                <div className="space-y-2 rounded-xl border border-slate-200 p-3.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Người thực hiện</span>
                    <span className="font-bold text-slate-900">{selectedItem.performedBy || 'SYSTEM'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Thời gian ghi nhận</span>
                    <span className="font-semibold text-slate-700">
                      {selectedItem.formattedCreatedAt || selectedItem.createdAt}
                    </span>
                  </div>
                  {selectedItem.orderCode && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Đơn hàng liên quan</span>
                      <Link
                        to={`/admin/orders?query=${encodeURIComponent(selectedItem.orderCode)}`}
                        className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {selectedItem.orderCode} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                  {selectedItem.batchCode && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Lô hàng nhập</span>
                      <span className="font-mono font-bold text-emerald-700">{selectedItem.batchCode}</span>
                    </div>
                  )}
                  {selectedItem.unitCost != null && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Đơn giá vốn</span>
                      <span className="font-bold text-slate-900">{formatVND(selectedItem.unitCost)}</span>
                    </div>
                  )}
                  <div>
                    <span className="block text-slate-500">Ghi chú nghiệp vụ</span>
                    <p className="mt-1 rounded-lg bg-slate-50 p-2 text-[11px] font-medium text-slate-700">
                      {selectedItem.note || selectedItem.reason || 'Không có ghi chú bổ sung.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </AdminDetailPanel>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Search,
  RefreshCw,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Printer,
  PackageCheck,
  X,
} from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminPagination from '../../components/admin/AdminPagination';
import { AdminDetailEmptyState, AdminDetailPanel } from '../../components/admin/AdminDetailPanel';
import {
  AdminBatchesService,
  type BatchItem,
  type BatchTraceabilityResponse,
  type SupplierClaimResponse,
} from '../../services/admin/adminBatchesService';
import toast from 'react-hot-toast';

const formatVND = (value?: number) =>
  value != null ? value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '—';

export default function AdminBatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'batches';
  const [activeTab, setActiveTab] = useState<'batches' | 'traceability' | 'claim'>(
    activeTabParam === 'traceability' ? 'traceability' : activeTabParam === 'claim' ? 'claim' : 'batches'
  );

  // TAB 1: Danh sách Lô hàng
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [batchSearch, setBatchSearch] = useState(() => searchParams.get('search') || '');
  const [debouncedBatchSearch, setDebouncedBatchSearch] = useState(batchSearch);
  const [isQuarantinedFilter, setIsQuarantinedFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Quarantine Modal State
  const [isQuarantineModalOpen, setIsQuarantineModalOpen] = useState(false);
  const [quarantineTargetBatch, setQuarantineTargetBatch] = useState<BatchItem | null>(null);
  const [quarantineReason, setQuarantineReason] = useState('');
  const [quarantining, setQuarantining] = useState(false);

  // TAB 2: Truy xuất Nguồn gốc (Traceability)
  const [traceQuery, setTraceQuery] = useState(() => searchParams.get('traceQuery') || '');
  const [traceData, setTraceData] = useState<BatchTraceabilityResponse | null>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);

  // TAB 3: Hồ sơ Khiếu nại NCC (Supplier Claim)
  const [claimData, setClaimData] = useState<SupplierClaimResponse | null>(null);

  // Sync tab with URL
  const handleTabChange = (tab: 'batches' | 'traceability' | 'claim') => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tab);
    setSearchParams(nextParams, { replace: true });
  };

  // Debounce search in Tab 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBatchSearch(batchSearch);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [batchSearch]);

  // Fetch batches
  const fetchBatches = useCallback(async () => {
    try {
      setLoadingBatches(true);
      const isQuarantined =
        isQuarantinedFilter === 'QUARANTINED' ? true : isQuarantinedFilter === 'ACTIVE' ? false : undefined;
      const res = await AdminBatchesService.getBatches({
        search: debouncedBatchSearch.trim() || undefined,
        isQuarantined,
        page,
        size: pageSize,
      });
      const items = res.items ?? [];
      setBatches(items);
      setTotalPages(Math.max(1, res.totalPages ?? 1));
      setTotalElements(res.totalElements ?? 0);
      setSelectedBatch((prev) => {
        if (!items.length) return null;
        if (!prev) return items[0];
        const found = items.find((b) => b.id === prev.id);
        return found ?? items[0];
      });
    } catch {
      toast.error('Không thể tải danh sách lô hàng.');
      setBatches([]);
      setTotalElements(0);
    } finally {
      setLoadingBatches(false);
    }
  }, [debouncedBatchSearch, isQuarantinedFilter, page, pageSize]);

  useEffect(() => {
    if (activeTab === 'batches') {
      void fetchBatches();
    }
  }, [activeTab, fetchBatches]);

  // Handle Quarantine Toggle
  const handleOpenQuarantineModal = (batch: BatchItem) => {
    setQuarantineTargetBatch(batch);
    setQuarantineReason(batch.quarantineReason || '');
    setIsQuarantineModalOpen(true);
  };

  const handleConfirmQuarantine = async () => {
    if (!quarantineTargetBatch) return;
    try {
      setQuarantining(true);
      const willQuarantine = !quarantineTargetBatch.isQuarantined;
      const updated = await AdminBatchesService.toggleQuarantine(quarantineTargetBatch.id, {
        quarantine: willQuarantine,
        reason: willQuarantine ? quarantineReason.trim() : undefined,
      });
      toast.success(
        willQuarantine
          ? `Đã phong tỏa lô hàng ${updated.batchCode}. Tồn kho lô này sẽ không được xuất FIFO.`
          : `Đã dỡ phong tỏa lô hàng ${updated.batchCode}.`
      );
      setIsQuarantineModalOpen(false);
      void fetchBatches();
    } catch {
      toast.error('Không thể cập nhật trạng thái phong tỏa lô hàng.');
    } finally {
      setQuarantining(false);
    }
  };

  // Handle Traceability Search
  const handleExecuteTrace = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) {
      toast.error('Vui lòng nhập Mã lô hàng, Mã đơn hàng hoặc Mã RMA để truy xuất.');
      return;
    }
    try {
      setLoadingTrace(true);
      const res = await AdminBatchesService.traceBatch(queryToSearch.trim());
      setTraceData(res);
      toast.success('Truy xuất nguồn gốc chuỗi cung ứng thành công.');
    } catch {
      toast.error('Không tìm thấy thông tin phả hệ cho từ khóa này.');
      setTraceData(null);
    } finally {
      setLoadingTrace(false);
    }
  };

  // Handle Load Supplier Claim
  const handleLoadClaim = async (batchId: number) => {
    handleTabChange('claim');
    try {
      const res = await AdminBatchesService.getSupplierClaim(batchId);
      setClaimData(res);
    } catch {
      toast.error('Không thể tạo hồ sơ khiếu nại cho lô hàng này.');
      setClaimData(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Quản lý Lô hàng & Truy xuất nguồn gốc"
        description="Quản trị chứng từ lô nhập (PO/Hóa đơn), giá vốn FIFO, truy xuất phả hệ hàng lỗi từ RMA khách hàng, phong tỏa tồn kho lỗi và lập hồ sơ khiếu nại bồi hoàn nhà cung cấp."
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-xs">
        <button
          type="button"
          onClick={() => handleTabChange('batches')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'batches'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" /> Danh sách Lô hàng Nhập ({totalElements})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('traceability')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'traceability'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-500" /> Truy xuất Nguồn gốc & Phong tỏa (Traceability)
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('claim')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'claim'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-600" /> Hồ sơ Khiếu nại Nhà cung cấp (Supplier Claim)
        </button>
      </div>

      {/* TAB 1: DANH SÁCH LÔ HÀNG */}
      {activeTab === 'batches' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Bảng danh sách lô (Cột trái) */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px] sm:max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã lô, PO, hóa đơn, nhà cung cấp..."
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  className="w-full h-9 pl-8 pr-7 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-slate-400 outline-none transition"
                />
                {batchSearch && (
                  <button
                    type="button"
                    onClick={() => setBatchSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={isQuarantinedFilter}
                  onChange={(e) => {
                    setIsQuarantinedFilter(e.target.value);
                    setPage(0);
                  }}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động (FIFO)</option>
                  <option value="QUARANTINED">Bị phong tỏa (Khóa xuất)</option>
                </select>

                <button
                  type="button"
                  onClick={() => void fetchBatches()}
                  disabled={loadingBatches}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Làm mới"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBatches ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 pl-4 pr-2">Mã Lô / PO</th>
                    <th className="px-2 py-2.5">Sản phẩm & SKU</th>
                    <th className="px-2 py-2.5">Nhà cung cấp</th>
                    <th className="px-2 py-2.5 text-center">Tồn kho / Nhập</th>
                    <th className="px-2 py-2.5 text-right">Giá vốn</th>
                    <th className="px-2 py-2.5 text-center">Trạng thái</th>
                    <th className="py-2.5 pl-2 pr-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loadingBatches ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                        <p className="text-xs font-semibold">Đang tải danh sách lô hàng...</p>
                      </td>
                    </tr>
                  ) : batches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Boxes className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold">Không tìm thấy lô hàng nào phù hợp</p>
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch) => {
                      const isSelected = selectedBatch?.id === batch.id;
                      const isQuarantined = Boolean(batch.isQuarantined);
                      const isDepleted = batch.quantityRemaining === 0;

                      return (
                        <tr
                          key={batch.id}
                          onClick={() => setSelectedBatch(batch)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-slate-100/90 font-semibold' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-2.5 pl-4 pr-2 whitespace-nowrap">
                            <span className="font-mono font-bold text-blue-600">{batch.batchCode}</span>
                            {batch.poNumber && (
                              <div className="text-[10px] text-slate-400 font-mono">PO: {batch.poNumber}</div>
                            )}
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="font-bold text-slate-900 max-w-[160px] truncate" title={batch.productName}>
                              {batch.productName}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {batch.variantSku} {batch.variantSize ? `· Size ${batch.variantSize}` : ''}
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">{batch.supplierName}</span>
                            {batch.invoiceNumber && (
                              <div className="text-[10px] text-slate-400">HĐ: {batch.invoiceNumber}</div>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <span
                              className={`font-black ${
                                isQuarantined
                                  ? 'text-rose-600'
                                  : isDepleted
                                  ? 'text-slate-400'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {batch.quantityRemaining}
                            </span>{' '}
                            <span className="text-[10px] text-slate-400">/ {batch.quantityImported}</span>
                          </td>
                          <td className="px-2 py-2.5 text-right font-mono font-bold text-slate-800">
                            {formatVND(batch.unitCost)}
                          </td>
                          <td className="px-2 py-2.5 text-center whitespace-nowrap">
                            {isQuarantined ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700">
                                <ShieldAlert className="w-2.5 h-2.5 text-rose-600" /> Bị phong tỏa
                              </span>
                            ) : isDepleted ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                Đã xuất hết
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Hoạt động FIFO
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 pl-2 pr-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenQuarantineModal(batch);
                              }}
                              className={`px-2 py-1 rounded text-[11px] font-bold transition mr-1.5 ${
                                isQuarantined
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              }`}
                              title={isQuarantined ? 'Dỡ bỏ phong tỏa' : 'Phong tỏa lô hàng lỗi'}
                            >
                              {isQuarantined ? 'Dỡ khóa' : 'Phong tỏa'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleLoadClaim(batch.id);
                              }}
                              className="px-2 py-1 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
                              title="Tạo hồ sơ khiếu nại bồi hoàn nhà cung cấp"
                            >
                              Khiếu nại
                            </button>
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
              visibleCount={batches.length}
              itemLabel="lô hàng"
              onPageChange={setPage}
            />
          </div>

          {/* Panel chi tiết Lô hàng (Cột phải) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <AdminDetailPanel ariaLabel="Hồ sơ Lô hàng Nhập">
              {!selectedBatch ? (
                <AdminDetailEmptyState
                  icon={<Boxes className="h-8 w-8 text-blue-500" />}
                  title="Chưa chọn lô hàng"
                  description="Chọn một lô hàng trong bảng bên trái để xem đầy đủ thông tin chứng từ."
                />
              ) : (
                <div className="p-4 space-y-4">
                  {/* Header card */}
                  <div
                    className={`rounded-xl border p-3.5 ${
                      selectedBatch.isQuarantined
                        ? 'border-rose-200 bg-rose-50/60'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Mã Lô: <strong className="text-blue-600 font-mono">{selectedBatch.batchCode}</strong>
                      </span>
                      {selectedBatch.isQuarantined ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800">
                          <ShieldAlert className="w-3 h-3 text-rose-600" /> BỊ PHONG TỎA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> SẴN SÀNG XUẤT FIFO
                        </span>
                      )}
                    </div>
                    <h4 className="mt-2 text-sm font-black text-slate-900">{selectedBatch.productName}</h4>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">
                      SKU: {selectedBatch.variantSku} {selectedBatch.variantSize ? `· Size ${selectedBatch.variantSize}` : ''}
                    </p>
                    {selectedBatch.isQuarantined && selectedBatch.quarantineReason && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-100/70 border border-rose-200 text-xs text-rose-800">
                        <strong>Lý do phong tỏa:</strong> {selectedBatch.quarantineReason}
                      </div>
                    )}
                  </div>

                  {/* Thống kê tiến độ tiêu thụ */}
                  <div className="rounded-xl border border-slate-200 p-3.5 space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Tiêu thụ tồn kho</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-[10px] font-bold text-slate-400">Tổng nhập</p>
                        <p className="mt-1 text-base font-black text-slate-900">{selectedBatch.quantityImported}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-[10px] font-bold text-slate-400">Đã xuất bán</p>
                        <p className="mt-1 text-base font-black text-blue-600">
                          {selectedBatch.quantityImported - selectedBatch.quantityRemaining}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-[10px] font-bold text-slate-400">Còn lại</p>
                        <p
                          className={`mt-1 text-base font-black ${
                            selectedBatch.isQuarantined ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {selectedBatch.quantityRemaining}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chứng từ & Công nợ */}
                  <div className="rounded-xl border border-slate-200 p-3.5 space-y-2.5 text-xs">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Chứng từ mua hàng</p>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Nhà cung cấp</span>
                      <span className="font-bold text-slate-900">{selectedBatch.supplierName}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Mã đơn mua (PO)</span>
                      <span className="font-mono font-bold text-slate-800">{selectedBatch.poNumber || 'Chưa gắn'}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Số hóa đơn VAT</span>
                      <span className="font-mono font-bold text-slate-800">
                        {selectedBatch.invoiceNumber || 'Chưa gắn'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Giá vốn nhập (Unit Cost)</span>
                      <span className="font-mono font-black text-slate-900">{formatVND(selectedBatch.unitCost)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Trạng thái thanh toán</span>
                      <span
                        className={`font-black px-2 py-0.5 rounded text-[10px] ${
                          selectedBatch.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedBatch.paymentStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {selectedBatch.paymentStatus === 'PAID'
                          ? 'Đã trả tiền NCC'
                          : selectedBatch.paymentStatus === 'PENDING'
                          ? 'Chưa thanh toán (Công nợ)'
                          : selectedBatch.paymentStatus || 'Chưa xác định'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500">Ngày nhập kho</span>
                      <span className="font-semibold text-slate-700">
                        {new Date(selectedBatch.receivedDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenQuarantineModal(selectedBatch)}
                      className={`h-9 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        selectedBatch.isQuarantined
                          ? 'bg-slate-800 text-white hover:bg-slate-900'
                          : 'bg-rose-600 text-white hover:bg-rose-700'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {selectedBatch.isQuarantined ? 'Dỡ bỏ phong tỏa' : 'Phong tỏa Lô hàng'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleLoadClaim(selectedBatch.id)}
                      className="h-9 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Lập hồ sơ bồi hoàn
                    </button>
                  </div>
                </div>
              )}
            </AdminDetailPanel>
          </div>
        </div>
      )}

      {/* TAB 2: TRUY XUẤT NGUỒN GỐC (TRACEABILITY) */}
      {activeTab === 'traceability' && (
        <div className="space-y-4">
          {/* Thanh tìm kiếm truy xuất */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              Công cụ Truy xuất Phả hệ Chuỗi cung ứng ngược (Reverse Traceability)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nhập bất kỳ thông tin nào: <strong>Mã Lô hàng</strong> (VD: <code>BATCH-NIKE-...</code>),{' '}
              <strong>Mã Đơn hàng</strong> (VD: <code>PS-2026...</code>), hoặc <strong>Mã khiếu nại RMA</strong>. Hệ thống
              sẽ tự động vẽ phả hệ từ Nhà cung cấp ➔ Lô hàng nhập ➔ Biến thể SKU ➔ Các đơn hàng đã xuất bán ➔ Khách hàng
              gặp lỗi.
            </p>
            <div className="flex gap-2 max-w-xl">
              <input
                type="text"
                placeholder="Nhập mã lô, mã đơn (PS-...), hoặc mã RMA..."
                value={traceQuery}
                onChange={(e) => setTraceQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleExecuteTrace(traceQuery);
                }}
                className="flex-1 h-10 px-3.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-blue-400 outline-none transition"
              />
              <button
                type="button"
                onClick={() => void handleExecuteTrace(traceQuery)}
                disabled={loadingTrace}
                className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                {loadingTrace ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Truy xuất
              </button>
            </div>
          </div>

          {/* Kết quả truy xuất */}
          {traceData ? (
            <div className="space-y-4">
              {/* Thẻ biến thể sản phẩm trung tâm */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-400">
                    {traceData.productImageUrl ? (
                      <img src={traceData.productImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Boxes className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{traceData.productName}</h4>
                    <p className="text-xs font-mono text-slate-500">
                      SKU: <strong>{traceData.variantSku}</strong> {traceData.color ? `· Màu: ${traceData.color}` : ''}{' '}
                      {traceData.size ? `· Size: ${traceData.size}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Đơn hàng bị ảnh hưởng</p>
                    <p className="text-base font-black text-blue-600">{traceData.orders.length} đơn</p>
                  </div>
                  <div className="text-right border-l pl-3 border-slate-200">
                    <p className="text-[11px] text-slate-400">Khiếu nại RMA</p>
                    <p className="text-base font-black text-rose-600">{traceData.returns.length} khiếu nại</p>
                  </div>
                </div>
              </div>

              {/* Sơ đồ phả hệ 3 cột */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cột 1: Lô hàng nhập từ NCC */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                    <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-emerald-600" /> 1. Lô nhập từ NCC ({traceData.batches.length})
                    </span>
                  </div>
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {traceData.batches.map((b) => (
                      <div
                        key={b.batchId}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          b.isQuarantined
                            ? 'border-rose-300 bg-rose-50/60'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-600">{b.batchCode}</span>
                          {b.isQuarantined ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-extrabold text-[10px]">
                              Bị phong tỏa
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Tồn: {b.quantityRemaining}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 font-semibold">{b.supplierName}</p>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>PO: {b.poNumber || '—'}</span>
                          <span>HĐ: {b.invoiceNumber || '—'}</span>
                        </div>
                        <div className="pt-1 border-t border-slate-200/60 flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Giá vốn: {formatVND(b.unitCost)}</span>
                          <button
                            type="button"
                            onClick={() => void handleLoadClaim(b.batchId)}
                            className="text-purple-600 hover:underline font-bold"
                          >
                            Lập hồ sơ →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cột 2: Đơn hàng đã xuất bán */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                    <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4 text-blue-600" /> 2. Đơn hàng đã giao ({traceData.orders.length})
                    </span>
                  </div>
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {traceData.orders.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">Chưa xuất bán đơn hàng nào từ biến thể này.</p>
                    ) : (
                      traceData.orders.map((o) => (
                        <div key={o.orderId} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-blue-600">{o.orderCode}</span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                              SL: {o.quantityOrdered}
                            </span>
                          </div>
                          <p className="text-slate-700 font-semibold">{o.customerName}</p>
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>{o.customerPhone || 'Không có SĐT'}</span>
                            <span>{new Date(o.orderDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Cột 3: Yêu cầu đổi trả RMA từ khách hàng */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                    <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" /> 3. Bằng chứng lỗi / RMA ({traceData.returns.length})
                    </span>
                  </div>
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {traceData.returns.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">Chưa có phản ánh lỗi RMA nào từ khách.</p>
                    ) : (
                      traceData.returns.map((r) => (
                        <div key={r.returnId} className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-700">RMA #{r.returnId}</span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black">
                              Lỗi: {r.quantityReturned} SP
                            </span>
                          </div>
                          <p className="text-slate-800 font-semibold">Lý do: {r.returnReason}</p>
                          {r.customerNotes && (
                            <p className="text-[11px] text-slate-600 bg-white p-1.5 rounded border border-rose-100 italic">
                              "{r.customerNotes}"
                            </p>
                          )}
                          {r.evidenceImages && r.evidenceImages.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1">
                              {r.evidenceImages.slice(0, 3).map((img, idx) => (
                                <a
                                  key={idx}
                                  href={img}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-10 h-10 rounded border border-slate-200 overflow-hidden block"
                                >
                                  <img src={img} alt="Bằng chứng" className="w-full h-full object-cover" />
                                </a>
                              ))}
                              {r.evidenceImages.length > 3 && (
                                <span className="text-[10px] text-slate-500 font-bold">
                                  +{r.evidenceImages.length - 3} ảnh
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400">
              <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <h4 className="text-sm font-bold text-slate-600">Sẵn sàng truy xuất phả hệ</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Nhập mã Lô hàng nhập, mã Đơn hàng của khách hoặc mã RMA để hệ thống đối chiếu cây phả hệ chuỗi cung ứng.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HỒ SƠ KHIẾU NẠI NHÀ CUNG CẤP (SUPPLIER CLAIM) */}
      {activeTab === 'claim' && (
        <div className="space-y-4">
          {!claimData ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <h4 className="text-sm font-bold text-slate-700">Chưa chọn lô hàng để lập hồ sơ khiếu nại</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Vui lòng quay lại tab <strong>Danh sách Lô hàng Nhập</strong> và bấm nút{' '}
                <span className="text-purple-600 font-bold">Khiếu nại</span> tại lô hàng gặp lỗi để sinh hồ sơ hoàn tiền tự động.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange('batches')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                Quay lại danh sách lô hàng
              </button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
              {/* Header Dossier */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                <div>
                  <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-800 font-mono font-black text-xs">
                    {claimData.claimReferenceCode}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-2">
                    BIÊN BẢN KHIẾU NẠI & YÊU CẦU BỒI HOÀN LÔ HÀNG LỖI
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supplier Defect Claim Dossier · Căn cứ tiêu chuẩn GS1 GTS & Luật Thương mại
                  </p>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
                  >
                    <Printer className="w-3.5 h-3.5" /> In biên bản A4
                  </button>
                </div>
              </div>

              {/* Thông tin đối soát hai bên */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Bên yêu cầu khiếu nại (Buyer)</p>
                  <p className="text-sm font-black text-slate-900 mt-1">CÔNG TY TNHH PEAKSNEAKER VIỆT NAM</p>
                  <p className="text-slate-600 mt-0.5">Phòng Quản lý Kho vận & Đảm bảo Chất lượng (QA/QC)</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Nhà cung cấp chịu trách nhiệm (Supplier)</p>
                  <p className="text-sm font-black text-purple-900 mt-1">{claimData.supplierName}</p>
                  <p className="text-slate-600 mt-0.5">Mã PO: {claimData.poNumber || 'Chưa cung cấp'}</p>
                </div>
              </div>

              {/* Chi tiết lô hàng & Biến thể lỗi */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  1. Thông tin Lô hàng & Sản phẩm lỗi
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">Mã Lô hàng</span>
                    <span className="font-mono font-bold text-blue-600 text-sm">{claimData.batchCode}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">Mã SKU Biến thể</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{claimData.variantSku}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">Số hóa đơn VAT</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{claimData.invoiceNumber || '—'}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">Đơn giá vốn</span>
                    <span className="font-mono font-black text-slate-900 text-sm">{formatVND(claimData.unitCost)}</span>
                  </div>
                </div>
              </div>

              {/* Bảng tính toán thiệt hại chi tiết */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  2. Xác định Thiệt hại & Số lượng Yêu cầu Bồi hoàn
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="py-2.5 px-4">Hạng mục thiệt hại</th>
                        <th className="py-2.5 px-4 text-center">Số lượng</th>
                        <th className="py-2.5 px-4 text-right">Đơn giá vốn</th>
                        <th className="py-2.5 px-4 text-right">Thành tiền bồi hoàn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      <tr>
                        <td className="py-2.5 px-4">
                          Hàng lỗi bị khách khiếu nại đổi trả (RMA verified)
                          <div className="text-[10px] text-slate-400">Đã kiểm định bằng chứng bung keo/lệch form</div>
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-rose-600">
                          {claimData.defectiveFromCustomersCount} đôi
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">{formatVND(claimData.unitCost)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatVND(claimData.defectiveFromCustomersCount * claimData.unitCost)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4">
                          Hàng tồn kho đã bị phong tỏa (Quarantined stock)
                          <div className="text-[10px] text-slate-400">Ngừng xuất kho để ngăn chặn tổn thất thêm</div>
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-amber-600">
                          {claimData.quarantinedQuantity} đôi
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">{formatVND(claimData.unitCost)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatVND(claimData.quarantinedQuantity * claimData.unitCost)}
                        </td>
                      </tr>
                      <tr className="bg-purple-50/60 font-black text-purple-900">
                        <td className="py-3 px-4">TỔNG CỘNG YÊU CẦU BỒI HOÀN</td>
                        <td className="py-3 px-4 text-center text-sm">{claimData.totalClaimQuantity} đôi</td>
                        <td className="py-3 px-4 text-right font-mono">—</td>
                        <td className="py-3 px-4 text-right font-mono text-base text-purple-900">
                          {formatVND(claimData.totalClaimAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Phương án xử lý công nợ */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  3. Đề xuất Phương án Thu hồi Công nợ (Debit Note / Refund)
                </h4>
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 text-xs text-purple-900 leading-relaxed font-medium">
                  {claimData.recommendation}
                </div>
              </div>

              {/* Chữ ký xác nhận */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-500 uppercase">ĐẠI DIỆN PEAKSNEAKER</p>
                  <p className="text-[11px] text-slate-400">(Ký, ghi rõ họ tên & đóng dấu)</p>
                  <div className="h-20" />
                  <p className="font-bold text-slate-800">Trần Nhật Trường</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 uppercase">ĐẠI DIỆN NHÀ CUNG CẤP</p>
                  <p className="text-[11px] text-slate-400">(Ký, ghi rõ họ tên & đóng dấu)</p>
                  <div className="h-20" />
                  <p className="font-bold text-slate-800">{claimData.supplierName}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Phong tỏa Lô hàng (Quarantine Modal) */}
      {isQuarantineModalOpen && quarantineTargetBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              {quarantineTargetBatch.isQuarantined ? 'Dỡ bỏ phong tỏa Lô hàng?' : 'Phong tỏa Lô hàng lỗi?'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lô hàng: <strong className="text-blue-600 font-mono">{quarantineTargetBatch.batchCode}</strong>
              <br />
              Sản phẩm: <strong>{quarantineTargetBatch.productName}</strong>
              <br />
              {quarantineTargetBatch.isQuarantined
                ? 'Sau khi dỡ bỏ, số lượng tồn kho còn lại của lô này sẽ tiếp tục được hệ thống tự động xuất theo chuẩn FIFO khi có đơn hàng mới.'
                : 'Khi phong tỏa, toàn bộ số lượng tồn kho còn lại của lô này sẽ bị KHÓA XUẤT FIFO ngay lập tức, ngăn ngừa giao sản phẩm lỗi tới khách hàng mới.'}
            </p>

            {!quarantineTargetBatch.isQuarantined && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Lý do phong tỏa <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={quarantineReason}
                  onChange={(e) => setQuarantineReason(e.target.value)}
                  placeholder="Ví dụ: Phát hiện lỗi bung keo mép đế hàng loạt từ các đơn RMA của khách..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsQuarantineModalOpen(false)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmQuarantine()}
                disabled={quarantining || (!quarantineTargetBatch.isQuarantined && !quarantineReason.trim())}
                className={`h-9 px-4 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 ${
                  quarantineTargetBatch.isQuarantined
                    ? 'bg-slate-800 hover:bg-slate-900'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {quarantining && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {quarantineTargetBatch.isQuarantined ? 'Xác nhận dỡ khóa' : 'Xác nhận phong tỏa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

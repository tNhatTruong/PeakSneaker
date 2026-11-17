import axios from 'axios';
import {
  CalendarDays,
  Check,
  Copy,
  Edit3,
  Layers,
  Loader2,
  PauseCircle,
  Percent,
  Plus,
  Power,
  RefreshCw,
  Search,
  TicketPercent,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import AdminFilterHeader from '../../components/admin/AdminFilterHeader';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminPagination from '../../components/admin/AdminPagination';
import { AdminDetailEmptyState, AdminDetailPanel } from '../../components/admin/AdminDetailPanel';
import {
  VoucherService,
  type DiscountType,
  type VoucherDetailResponse,
  type VoucherParams,
  type VoucherRequest,
  type VoucherResponse,
  type VoucherStatus,
} from '../../services/admin/adminVoucherService';

const PAGE_SIZE = 10;

type FilterDraft = {
  query: string;
  fromDate: string;
  toDate: string;
  status: '' | VoucherStatus;
  discountType: '' | DiscountType;
  applicationScope: '' | 'ALL_PRODUCTS';
  applicationChannel: '' | 'WEB';
};

const EMPTY_FILTERS: FilterDraft = {
  query: '',
  fromDate: '',
  toDate: '',
  status: '',
  discountType: '',
  applicationScope: '',
  applicationChannel: '',
};

const EMPTY_FORM: VoucherRequest = {
  code: '',
  name: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  minOrderAmount: 0,
  maxDiscountAmount: null,
  usageLimit: null,
  perUserLimit: 1,
  startAt: '',
  expireAt: '',
  isActive: true,
  applicationScope: 'ALL_PRODUCTS',
  applicationChannel: 'WEB',
  isCombinable: false,
};

const STATUS_META: Record<VoucherStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Đang hoạt động', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  UPCOMING: { label: 'Sắp bắt đầu', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  EXPIRED: { label: 'Đã hết hạn', className: 'bg-red-50 text-red-700 ring-red-200' },
  PAUSED: { label: 'Tạm ngưng', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
};

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('vi-VN');

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.response?.data?.data?.message || fallback;
  }
  return fallback;
}

function toDateTimeLocal(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(value?: string, withTime = false) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', withTime
    ? { dateStyle: 'short', timeStyle: 'short' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function requestFromVoucher(voucher: VoucherResponse): VoucherRequest {
  return {
    code: voucher.code,
    name: voucher.name,
    description: voucher.description || '',
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    minOrderAmount: voucher.minOrderAmount,
    maxDiscountAmount: voucher.maxDiscountAmount,
    usageLimit: voucher.usageLimit,
    perUserLimit: voucher.perUserLimit,
    startAt: toDateTimeLocal(voucher.startAt),
    expireAt: toDateTimeLocal(voucher.expireAt),
    isActive: voucher.isActive,
    applicationScope: voucher.applicationScope,
    applicationChannel: voucher.applicationChannel,
    isCombinable: voucher.isCombinable,
  };
}

function StatusBadge({ status }: { status: VoucherStatus }) {
  const meta = STATUS_META[status];
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ring-inset ${meta.className}`}>{meta.label}</span>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-bold text-slate-600">{children}</span>;
}

function DetailRow({ label, value, emphasize = false }: { label: string; value: React.ReactNode; emphasize?: boolean }) {
  return <div className="grid grid-cols-[minmax(120px,0.8fr)_minmax(0,1.2fr)] gap-4 border-b border-slate-100 py-2.5 last:border-0"><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className={`text-right text-sm ${emphasize ? 'font-black text-slate-950' : 'font-semibold text-slate-700'}`}>{value}</dd></div>;
}

export default function AdminPromotionsPage() {
  const [items, setItems] = useState<VoucherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [draft, setDraft] = useState<FilterDraft>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<FilterDraft>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState<VoucherParams['sortBy']>('createdAt');
  const [statusCounts, setStatusCounts] = useState<Record<'ALL' | VoucherStatus, number>>({ ALL: 0, ACTIVE: 0, UPCOMING: 0, EXPIRED: 0, PAUSED: 0 });

  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<VoucherDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'conditions' | 'scope' | 'effect'>('info');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherResponse | null>(null);
  const [form, setForm] = useState<VoucherRequest>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const activeFilterCount = useMemo(() => Object.values(applied).filter(Boolean).length, [applied]);

  const buildParams = useCallback((source: FilterDraft, pageIndex: number, size = PAGE_SIZE): VoucherParams => ({
    query: source.query.trim() || undefined,
    status: source.status || undefined,
    discountType: source.discountType || undefined,
    applicationScope: source.applicationScope || undefined,
    applicationChannel: source.applicationChannel || undefined,
    fromDate: source.fromDate ? new Date(`${source.fromDate}T00:00:00`).toISOString() : undefined,
    toDate: source.toDate ? new Date(`${source.toDate}T23:59:59.999`).toISOString() : undefined,
    sortBy,
    sortDirection: 'desc',
    page: pageIndex,
    size,
  }), [sortBy]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await VoucherService.getVouchers(buildParams(applied, page));
      setItems(response.items || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải danh sách khuyến mãi.'));
    } finally {
      setLoading(false);
    }
  }, [applied, buildParams, page]);

  const loadCounts = useCallback(async () => {
    try {
      const statuses: VoucherStatus[] = ['ACTIVE', 'UPCOMING', 'EXPIRED', 'PAUSED'];
      const [all, ...grouped] = await Promise.all([
        VoucherService.getVouchers({ page: 0, size: 1 }),
        ...statuses.map((status) => VoucherService.getVouchers({ page: 0, size: 1, status })),
      ]);
      setStatusCounts({
        ALL: all.totalElements || 0,
        ACTIVE: grouped[0]?.totalElements || 0,
        UPCOMING: grouped[1]?.totalElements || 0,
        EXPIRED: grouped[2]?.totalElements || 0,
        PAUSED: grouped[3]?.totalElements || 0,
      });
    } catch {
      // Danh sách chính vẫn là nguồn dữ liệu bắt buộc; số đếm tab là thông tin hỗ trợ.
    }
  }, []);

  useEffect(() => { void loadList(); }, [loadList]);
  useEffect(() => { void loadCounts(); }, [loadCounts]);

  useEffect(() => {
    if (detailId === null) return;
    setDetailTab('info');
    let active = true;
    setLoadingDetail(true);
    setDetail(null);
    VoucherService.getVoucher(detailId)
      .then((response) => { if (active) setDetail(response); })
      .catch((error) => { if (active) toast.error(getErrorMessage(error, 'Không thể tải chi tiết khuyến mãi.')); })
      .finally(() => { if (active) setLoadingDetail(false); });
    return () => { active = false; };
  }, [detailId]);

  const applyFilters = (event?: FormEvent) => {
    event?.preventDefault();
    setApplied(draft);
    setPage(0);
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(0);
  };

  const selectStatus = (status: '' | VoucherStatus) => {
    const next = { ...draft, status };
    setDraft(next);
    setApplied(next);
    setPage(0);
  };

  const openEditor = (voucher?: VoucherResponse) => {
    setEditingVoucher(voucher || null);
    setForm(voucher ? requestFromVoucher(voucher) : { ...EMPTY_FORM });
    setEditorOpen(true);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Đã sao chép mã ${code}`);
    } catch {
      toast.error('Không thể sao chép mã khuyến mãi.');
    }
  };

  const submitVoucher = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.startAt || !form.expireAt) {
      toast.error('Vui lòng chọn đầy đủ thời gian áp dụng.');
      return;
    }
    if (new Date(form.expireAt) <= new Date(form.startAt)) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: VoucherRequest = {
        ...form,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        startAt: new Date(form.startAt).toISOString(),
        expireAt: new Date(form.expireAt).toISOString(),
        maxDiscountAmount: form.discountType === 'PERCENTAGE' ? form.maxDiscountAmount : null,
      };
      const saved = editingVoucher
        ? await VoucherService.updateVoucher(editingVoucher.id, payload)
        : await VoucherService.createVoucher(payload);
      toast.success(editingVoucher ? 'Đã cập nhật chương trình khuyến mãi.' : 'Đã tạo chương trình khuyến mãi.');
      setEditorOpen(false);
      await Promise.all([loadList(), loadCounts()]);
      if (detailId === saved.id) {
        const refreshed = await VoucherService.getVoucher(saved.id);
        setDetail(refreshed);
      } else if (!editingVoucher) {
        setDetailId(saved.id);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể lưu chương trình khuyến mãi.'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVoucher = async (voucher: VoucherResponse) => {
    try {
      const updated = await VoucherService.updateVoucher(voucher.id, {
        ...requestFromVoucher(voucher),
        isActive: !voucher.isActive,
        startAt: voucher.startAt,
        expireAt: voucher.expireAt,
      });
      toast.success(voucher.isActive ? 'Đã tạm ngưng chương trình.' : 'Đã kích hoạt chương trình.');
      setDetail((current) => (current?.voucher.id === updated.id ? { ...current, voucher: updated } : current));
      await Promise.all([loadList(), loadCounts()]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể thay đổi trạng thái chương trình.'));
    }
  };

  const deleteVoucher = async (voucher: VoucherResponse) => {
    if (!window.confirm(`Xóa chương trình khuyến mãi "${voucher.code}"?`)) return;
    try {
      await VoucherService.deleteVoucher(voucher.id);
      toast.success(`Đã xóa chương trình ${voucher.code}`);
      if (detailId === voucher.id) {
        setDetailId(null);
        setDetail(null);
      }
      await Promise.all([loadList(), loadCounts()]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xóa chương trình khuyến mãi.'));
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Khuyến mãi"
        description="Quản lý mã giảm giá, điều kiện áp dụng và hiệu quả sử dụng."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void loadList();
                void loadCounts();
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
            </button>
            <button
              type="button"
              onClick={() => openEditor()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Tạo khuyến mãi
            </button>
          </div>
        }
      />

      <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:items-start">
      <div className="min-w-0 space-y-3">
      <div className="z-30 -mx-1 bg-slate-50 px-1 pb-2 2xl:sticky 2xl:-top-5">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <AdminFilterHeader isOpen={filtersOpen} onToggle={() => setFiltersOpen((value) => !value)} activeCount={activeFilterCount} onReset={resetFilters} title="Bộ lọc & Tìm kiếm" />
          {filtersOpen && <form onSubmit={applyFilters} className="space-y-3 p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(320px,1.6fr)_minmax(160px,0.6fr)_minmax(160px,0.6fr)]">
              <label><FieldLabel>Tìm kiếm</FieldLabel><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={draft.query} onChange={(event) => setDraft((current) => ({ ...current, query: event.target.value }))} placeholder="Tìm mã, tên chương trình hoặc mô tả..." className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></div></label>
              <label><FieldLabel>Từ ngày</FieldLabel><input type="date" value={draft.fromDate} onChange={(event) => setDraft((current) => ({ ...current, fromDate: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400" /></label>
              <label><FieldLabel>Đến ngày</FieldLabel><input type="date" value={draft.toDate} onChange={(event) => setDraft((current) => ({ ...current, toDate: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400" /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              <label><FieldLabel>Trạng thái</FieldLabel><select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as FilterDraft['status'] }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"><option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="UPCOMING">Sắp bắt đầu</option><option value="EXPIRED">Đã hết hạn</option><option value="PAUSED">Tạm ngưng</option></select></label>
              <label><FieldLabel>Loại khuyến mãi</FieldLabel><select value={draft.discountType} onChange={(event) => setDraft((current) => ({ ...current, discountType: event.target.value as FilterDraft['discountType'] }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"><option value="">Tất cả loại</option><option value="PERCENTAGE">Giảm theo phần trăm</option><option value="FIXED_AMOUNT">Giảm số tiền cố định</option></select></label>
              <label><FieldLabel>Phạm vi áp dụng</FieldLabel><select value={draft.applicationScope} onChange={(event) => setDraft((current) => ({ ...current, applicationScope: event.target.value as FilterDraft['applicationScope'] }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"><option value="">Tất cả phạm vi</option><option value="ALL_PRODUCTS">Toàn bộ sản phẩm</option></select></label>
              <label><FieldLabel>Kênh áp dụng</FieldLabel><select value={draft.applicationChannel} onChange={(event) => setDraft((current) => ({ ...current, applicationChannel: event.target.value as FilterDraft['applicationChannel'] }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"><option value="">Tất cả kênh</option><option value="WEB">Website</option></select></label>
              <button type="submit" className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800"><Search className="h-4 w-4" />Áp dụng</button>
            </div>
          </form>}
        </section>
      </div>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap gap-2">
            {([
              ['', 'Tất cả', statusCounts.ALL],
              ['ACTIVE', 'Đang hoạt động', statusCounts.ACTIVE],
              ['UPCOMING', 'Sắp bắt đầu', statusCounts.UPCOMING],
              ['EXPIRED', 'Đã hết hạn', statusCounts.EXPIRED],
              ['PAUSED', 'Tạm ngưng', statusCounts.PAUSED],
            ] as const).map(([value, label, count]) => <button key={label} type="button" onClick={() => selectStatus(value)} className={`h-9 rounded-lg px-3 text-xs font-bold transition ${applied.status === value ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{label} <span className={`ml-1 rounded-full px-1.5 py-0.5 ${applied.status === value ? 'bg-white/15' : 'bg-slate-100'}`}>{count}</span></button>)}
          </div>
          <div className="flex items-center gap-2 self-end xl:self-auto"><span className="text-xs font-semibold text-slate-500">Sắp xếp</span><select value={sortBy} onChange={(event) => { setSortBy(event.target.value as VoucherParams['sortBy']); setPage(0); }} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"><option value="createdAt">Mới tạo</option><option value="startAt">Ngày bắt đầu</option><option value="expireAt">Ngày kết thúc</option><option value="code">Mã khuyến mãi</option></select></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] table-fixed text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500"><tr><th className="w-[14%] px-4 py-3">Mã khuyến mãi</th><th className="w-[20%] px-4 py-3">Tên chương trình</th><th className="w-[11%] px-4 py-3">Loại</th><th className="w-[10%] px-4 py-3">Giảm giá</th><th className="w-[17%] px-4 py-3">Điều kiện áp dụng</th><th className="w-[14%] px-4 py-3">Thời gian</th><th className="w-[8%] px-4 py-3">Lượt dùng</th><th className="w-[12%] px-4 py-3">Trạng thái</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={8} className="h-56 text-center text-sm font-semibold text-slate-500"><Loader2 className="mr-2 inline h-5 w-5 animate-spin" />Đang tải dữ liệu...</td></tr>
                : items.length === 0 ? <tr><td colSpan={8} className="h-56 text-center"><TicketPercent className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-bold text-slate-700">Không tìm thấy chương trình phù hợp</p><p className="mt-1 text-xs text-slate-400">Thử điều chỉnh điều kiện lọc hoặc tạo chương trình mới.</p></td></tr>
                : items.map((voucher) => {
                  const used = voucher.usedCount || 0;
                  const progress = voucher.usageLimit ? Math.min(100, Math.round((used / voucher.usageLimit) * 100)) : 0;
                  return <tr key={voucher.id} onClick={() => setDetailId(voucher.id)} className={`group cursor-pointer hover:bg-blue-50/40 ${detailId === voucher.id ? 'bg-blue-50/60' : ''}`}>
                    <td className="px-4 py-3"><button type="button" onClick={() => setDetailId(voucher.id)} className="font-black text-blue-600 hover:underline">{voucher.code}</button><p className="mt-1 text-[11px] text-slate-400">Tạo {formatDate(voucher.createdAt)}</p></td>
                    <td className="px-4 py-3"><p className="line-clamp-2 font-bold leading-5 text-slate-900">{voucher.name}</p><p className="mt-1 line-clamp-1 text-xs text-slate-500">{voucher.description || 'Chưa có mô tả'}</p></td>
                    <td className="px-4 py-3"><span className={`rounded-md px-2 py-1 text-[11px] font-black ${voucher.discountType === 'PERCENTAGE' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-700'}`}>{voucher.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định'}</span></td>
                    <td className="px-4 py-3 font-black text-slate-900">{voucher.discountType === 'PERCENTAGE' ? `${voucher.discountValue}%` : money.format(voucher.discountValue)}</td>
                    <td className="px-4 py-3"><p className="text-xs font-semibold text-slate-700">Đơn từ {money.format(voucher.minOrderAmount || 0)}</p><p className="mt-1 text-[11px] text-slate-500">{voucher.applicationScope === 'ALL_PRODUCTS' ? 'Toàn bộ sản phẩm' : voucher.applicationScope}</p></td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600"><p>{formatDate(voucher.startAt)}</p><p className="my-0.5 text-slate-300">→</p><p>{formatDate(voucher.expireAt)}</p></td>
                    <td className="px-4 py-3"><p className="text-xs font-black text-slate-800">{number.format(used)} / {voucher.usageLimit ? number.format(voucher.usageLimit) : '∞'}</p>{voucher.usageLimit && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} /></div>}</td>
                    <td className="px-4 py-3"><StatusBadge status={voucher.status} /></td>
                  </tr>;
                })}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={PAGE_SIZE}
          visibleCount={items.length}
          itemLabel="chương trình"
          disabled={loading}
          onPageChange={setPage}
        />
      </section>
      </div>
      {detailId !== null ? <AdminDetailPanel ariaLabel="Chi tiết khuyến mãi" className="flex flex-col">
        <section aria-labelledby="voucher-detail-title" className="flex min-h-0 flex-1 flex-col">
          <header className="flex h-11 items-center justify-between border-b border-slate-200 px-4"><h2 id="voucher-detail-title" className="text-sm font-black text-slate-950">Chi tiết khuyến mãi</h2><button type="button" onClick={() => setDetailId(null)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button></header>
          {loadingDetail || !detail ? <div className="grid min-h-80 place-items-center"><p className="text-sm font-semibold text-slate-500"><Loader2 className="mr-2 inline h-5 w-5 animate-spin" />Đang tải chi tiết...</p></div> : <>
            <div className="overflow-y-auto">
              <div className="p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600"><Percent className="h-6 w-6" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-base font-black text-slate-950">{detail.voucher.code}</p>
                      <button
                        type="button"
                        onClick={() => void copyCode(detail.voucher.code)}
                        title="Sao chép mã khuyến mãi"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <StatusBadge status={detail.voucher.status} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{detail.voucher.description || 'Chưa có mô tả chương trình.'}</p>
                  </div>
                </div>
              </div>
              <nav className="grid grid-cols-4 border-y border-slate-200 bg-slate-50/60 px-2">{([['info', 'Thông tin'], ['conditions', 'Điều kiện'], ['scope', 'Phạm vi'], ['effect', 'Hiệu quả']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setDetailTab(value)} className={`border-b-2 px-1 py-2.5 text-[10px] font-bold ${detailTab === value ? 'border-slate-950 text-slate-950' : 'border-transparent text-slate-500'}`}>{label}</button>)}</nav>
              <div className="p-4">

              {detailTab === 'info' && (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-black text-slate-950"><TicketPercent className="h-4 w-4 text-blue-600" />Thông tin cơ bản</h3>
                  <dl className="mt-2">
                    <DetailRow label="Mã khuyến mãi" value={detail.voucher.code} />
                    <DetailRow label="Tên chương trình" value={detail.voucher.name} />
                    <DetailRow label="Loại" value={detail.voucher.discountType === 'PERCENTAGE' ? 'Giảm theo phần trăm' : 'Giảm số tiền cố định'} />
                    <DetailRow label="Giá trị giảm" value={detail.voucher.discountType === 'PERCENTAGE' ? `${detail.voucher.discountValue}%` : money.format(detail.voucher.discountValue)} emphasize />
                    <DetailRow label="Trạng thái kích hoạt" value={detail.voucher.isActive ? 'Đang bật' : 'Tạm ngưng'} />
                    <DetailRow label="Đã sử dụng" value={`${number.format(detail.voucher.usedCount || 0)} / ${detail.voucher.usageLimit ? number.format(detail.voucher.usageLimit) : '∞'}`} />
                  </dl>
                </section>
              )}

              {detailTab === 'scope' && (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-black text-slate-950"><Layers className="h-4 w-4 text-blue-600" />Phạm vi & Quy tắc áp dụng</h3>
                  <dl className="mt-2">
                    <DetailRow label="Phạm vi sản phẩm" value="Toàn bộ sản phẩm (ALL_PRODUCTS)" />
                    <DetailRow label="Kênh áp dụng" value="Website (WEB)" />
                    <DetailRow label="Cộng dồn voucher" value={detail.voucher.isCombinable ? 'Cho phép' : 'Không cộng dồn (1 mã/đơn)'} />
                    <DetailRow label="Hoàn trả RMA" value="Khấu trừ theo tỷ lệ mặt hàng hoàn" />
                    <DetailRow label="Hoàn lượt khi hủy đơn" value="Tự động hoàn lượt khi hủy / giao thất bại" />
                  </dl>
                </section>
              )}

              {detailTab === 'conditions' && <section><h3 className="flex items-center gap-2 text-xs font-black text-slate-950"><CalendarDays className="h-4 w-4 text-blue-600" />Điều kiện & thời gian</h3><dl className="mt-2"><DetailRow label="Đơn tối thiểu" value={money.format(detail.voucher.minOrderAmount || 0)} /><DetailRow label="Giảm tối đa" value={detail.voucher.maxDiscountAmount ? money.format(detail.voucher.maxDiscountAmount) : 'Không giới hạn'} /><DetailRow label="Mỗi khách hàng" value={`${number.format(detail.voucher.perUserLimit)} lượt`} /><DetailRow label="Tổng lượt dùng" value={detail.voucher.usageLimit ? number.format(detail.voucher.usageLimit) : 'Không giới hạn'} /><DetailRow label="Bắt đầu" value={formatDate(detail.voucher.startAt, true)} /><DetailRow label="Kết thúc" value={formatDate(detail.voucher.expireAt, true)} /></dl></section>}

              {detailTab === 'effect' && <section><h3 className="flex items-center gap-2 text-xs font-black text-slate-950"><TrendingUp className="h-4 w-4 text-blue-600" />Hiệu quả chương trình</h3><div className="mt-3 grid gap-2"><div className="rounded-lg bg-emerald-50 p-3"><p className="text-[10px] font-bold text-emerald-700">Lượt sử dụng</p><p className="mt-1 text-lg font-black text-emerald-950">{number.format(detail.usageCount)}</p></div><div className="rounded-lg bg-amber-50 p-3"><p className="text-[10px] font-bold text-amber-700">Tổng giá trị giảm</p><p className="mt-1 text-lg font-black text-amber-950">{money.format(detail.totalDiscountAmount)}</p></div><div className="rounded-lg bg-blue-50 p-3"><p className="text-[10px] font-bold text-blue-700">Doanh thu tạo ra</p><p className="mt-1 text-lg font-black text-blue-950">{money.format(detail.generatedRevenue)}</p></div></div></section>}

              <p className="mt-4 text-right text-[11px] text-slate-400">Tạo lúc {formatDate(detail.voucher.createdAt, true)} · Cập nhật {formatDate(detail.voucher.updatedAt, true)}</p>
              </div>
            </div>
            <footer className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 p-3">
              <button type="button" onClick={() => void toggleVoucher(detail.voucher)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100">
                {detail.voucher.isActive ? <PauseCircle className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                {detail.voucher.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
              </button>
              <button type="button" onClick={() => openEditor(detail.voucher)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white hover:bg-slate-800">
                <Edit3 className="h-4 w-4" />Chỉnh sửa
              </button>
              <button
                type="button"
                disabled={(detail.usageCount || detail.voucher.usedCount || 0) > 0}
                onClick={() => void deleteVoucher(detail.voucher)}
                title={(detail.usageCount || detail.voucher.usedCount || 0) > 0 ? 'Không thể xóa chương trình đã có lượt sử dụng' : 'Xóa chương trình'}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </footer>
          </>}
        </section>
      </AdminDetailPanel> : <AdminDetailPanel ariaLabel="Chưa chọn chương trình"><AdminDetailEmptyState icon={<TicketPercent className="h-9 w-9" />} title="Chưa chọn chương trình" description="Chọn một chương trình trong danh sách để xem điều kiện, phạm vi và hiệu quả sử dụng." items={["Thông tin và điều kiện áp dụng", "Thời gian và giới hạn sử dụng", "Hiệu quả chương trình"]} /></AdminDetailPanel>}
      </div>

      {editorOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setEditorOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="voucher-editor-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><p className="text-xs font-black uppercase tracking-wide text-blue-600">Khuyến mãi</p><h2 id="voucher-editor-title" className="mt-1 text-lg font-black text-slate-950">{editingVoucher ? 'Chỉnh sửa chương trình' : 'Tạo chương trình mới'}</h2></div><button type="button" disabled={submitting} onClick={() => setEditorOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></header>
            <form id="voucher-editor-form" onSubmit={submitVoucher} className="overflow-y-auto p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2"><label><FieldLabel>Mã khuyến mãi *</FieldLabel><input required maxLength={50} value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase().replace(/\s+/g, '') }))} placeholder="SNEAKER10" className="h-10 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm font-bold outline-none focus:border-blue-400" /></label><label><FieldLabel>Tên chương trình *</FieldLabel><input required maxLength={160} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Giảm 10% toàn bộ đơn hàng" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400" /></label></div>
              <label className="mt-4 block"><FieldLabel>Mô tả</FieldLabel><textarea rows={3} value={form.description || ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Mô tả ngắn gọn điều kiện và mục tiêu chương trình..." className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" /></label>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label><FieldLabel>Loại khuyến mãi *</FieldLabel><select value={form.discountType} onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value as DiscountType }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold"><option value="PERCENTAGE">Giảm theo phần trăm</option><option value="FIXED_AMOUNT">Giảm số tiền cố định</option></select></label><label><FieldLabel>Giá trị giảm *</FieldLabel><input required type="number" min="0.01" max={form.discountType === 'PERCENTAGE' ? 100 : undefined} step="0.01" value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: Number(event.target.value) }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none focus:border-blue-400" /></label><label><FieldLabel>Giảm tối đa</FieldLabel><input type="number" min="1" disabled={form.discountType !== 'PERCENTAGE'} value={form.maxDiscountAmount ?? ''} onChange={(event) => setForm((current) => ({ ...current, maxDiscountAmount: event.target.value ? Number(event.target.value) : null }))} placeholder="Không giới hạn" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400" /></label></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label><FieldLabel>Đơn hàng tối thiểu</FieldLabel><input type="number" min="0" value={form.minOrderAmount} onChange={(event) => setForm((current) => ({ ...current, minOrderAmount: Number(event.target.value) }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" /></label><label><FieldLabel>Tổng lượt sử dụng</FieldLabel><input type="number" min="1" value={form.usageLimit ?? ''} onChange={(event) => setForm((current) => ({ ...current, usageLimit: event.target.value ? Number(event.target.value) : null }))} placeholder="Không giới hạn" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" /></label><label><FieldLabel>Lượt dùng mỗi khách *</FieldLabel><input required type="number" min="1" value={form.perUserLimit} onChange={(event) => setForm((current) => ({ ...current, perUserLimit: Number(event.target.value) }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" /></label></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><label><FieldLabel>Thời gian bắt đầu *</FieldLabel><input required type="datetime-local" value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" /></label><label><FieldLabel>Thời gian kết thúc *</FieldLabel><input required type="datetime-local" value={form.expireAt} onChange={(event) => setForm((current) => ({ ...current, expireAt: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" /></label></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3"><label><FieldLabel>Phạm vi áp dụng</FieldLabel><select value={form.applicationScope} disabled className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600"><option value="ALL_PRODUCTS">Toàn bộ sản phẩm</option></select></label><label><FieldLabel>Kênh áp dụng</FieldLabel><select value={form.applicationChannel} disabled className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600"><option value="WEB">Website</option></select></label><label><FieldLabel>Trạng thái vận hành</FieldLabel><select value={form.isActive ? 'true' : 'false'} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === 'true' }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold"><option value="true">Kích hoạt</option><option value="false">Tạm ngưng</option></select></label></div>
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800"><Check className="mt-0.5 h-4 w-4 shrink-0" /><p>Checkout hiện hỗ trợ một mã cho mỗi đơn hàng. Chương trình áp dụng trên website cho toàn bộ sản phẩm và không cộng dồn với voucher khác.</p></div>
            </form>
            <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end"><button type="button" disabled={submitting} onClick={() => setEditorOpen(false)} className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700">Hủy</button><button type="submit" form="voucher-editor-form" disabled={submitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}{editingVoucher ? 'Lưu thay đổi' : 'Tạo chương trình'}</button></footer>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}

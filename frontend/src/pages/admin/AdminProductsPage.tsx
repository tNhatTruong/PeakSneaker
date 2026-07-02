import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Upload, ImageIcon,
  Loader2, ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { AdminProductService, type CreateProductPayload, type UpdateProductPayload } from '../../services/admin/adminProductService';
import { SilhouetteService, type SilhouetteResponse } from '../../services/silhouetteService';
import { CategoryService, type CategoryResponse } from '../../services/categoryService';
import { ProductService, type ProductResponse, type ProductDetailResponse } from '../../services/productService';

// ──────────── Constants ────────────
const GENDER_OPTIONS = [
  { value: 'UNISEX', label: 'Unisex' },
  { value: 'MEN', label: 'Nam' },
  { value: 'WOMEN', label: 'Nữ' },
] as const;

const TYPE_OPTIONS = [
  { value: 'SNEAKER', label: 'Giày Sneaker' },
  { value: 'ACCESSORY', label: 'Phụ kiện' },
] as const;

type FormMode = 'create' | 'edit';

interface FormState {
  name: string;
  description: string;
  basePrice: number;
  discountPercent: number;
  price: number;
  silhouetteId: number;
  categoryId: number | undefined;
  gender: 'MEN' | 'WOMEN' | 'UNISEX';
  productType: 'SNEAKER' | 'ACCESSORY';
  isFeatured: boolean;
}

const defaultForm: FormState = {
  name: '',
  description: '',
  basePrice: 0,
  discountPercent: 0,
  price: 0,
  silhouetteId: 0,
  categoryId: undefined,
  gender: 'UNISEX',
  productType: 'SNEAKER',
  isFeatured: false,
};

// ──────────── Helpers ────────────
const formatPrice = (price?: number | null) =>
  price != null ? price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '—';

// ──────────── Sub-components ────────────
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </label>
  );
}

function SegmentButtons<T extends string>({
  options, value, onChange,
}: { options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors
            ${value === opt.value
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ──────────── Delete Confirm Dialog ────────────
function DeleteDialog({
  product, onConfirm, onCancel, loading,
}: { product: ProductResponse; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">Xác nhận xóa sản phẩm</h3>
            <p className="text-sm text-zinc-500 mt-0.5">Sản phẩm sẽ bị ẩn khỏi gian hàng</p>
          </div>
        </div>
        <p className="text-sm text-zinc-700 mb-5">
          Bạn có chắc muốn xóa sản phẩm <span className="font-medium">&quot;{product.name}&quot;</span>?
          Sản phẩm vẫn được lưu trữ trong hệ thống dưới dạng ẩn (xóa mềm).
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Xóa sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────── Product Form Modal ────────────
interface ProductModalProps {
  mode: FormMode;
  initial?: ProductDetailResponse | null;
  silhouettes: SilhouetteResponse[];
  categories: CategoryResponse[];
  onSuccess: () => void;
  onClose: () => void;
}

function ProductModal({ mode, initial, silhouettes, categories, onSuccess, onClose }: ProductModalProps) {
  const [form, setForm] = useState<FormState>(() => {
    if (mode === 'edit' && initial) {
      const basePrice = initial.basePrice ?? 0;
      const discountPercent = initial.discountPercent ?? 0;
      const price = initial.price ?? (basePrice - (basePrice * discountPercent / 100));
      return {
        name: initial.name ?? '',
        description: initial.description ?? '',
        basePrice,
        discountPercent,
        price,
        silhouetteId: initial.silhouette?.id ?? 0,
        categoryId: initial.category?.id,
        gender: (initial.gender as FormState['gender']) ?? 'UNISEX',
        productType: (initial.productType as FormState['productType']) ?? 'SNEAKER',
        isFeatured: !!initial.isFeatured,
      };
    }
    return {
      ...defaultForm,
      price: 0,
    };
  });

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState(initial?.images ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBasePriceChange = (val: number) => {
    const basePrice = Math.max(0, val);
    const price = basePrice - (basePrice * (form.discountPercent ?? 0) / 100);
    setForm((prev) => ({
      ...prev,
      basePrice,
      price: Math.max(0, Number(price.toFixed(2))),
    }));
  };

  const handleDiscountPercentChange = (val: number) => {
    const discountPercent = Math.min(100, Math.max(0, val));
    const price = form.basePrice - (form.basePrice * discountPercent / 100);
    setForm((prev) => ({
      ...prev,
      discountPercent,
      price: Math.max(0, Number(price.toFixed(2))),
    }));
  };

  const handlePriceChange = (val: number) => {
    let price = Math.max(0, val);
    if (price > form.basePrice) {
      price = form.basePrice;
    }
    let discountPercent = 0;
    if (form.basePrice > 0) {
      discountPercent = ((form.basePrice - price) / form.basePrice) * 100;
    }
    setForm((prev) => ({
      ...prev,
      price,
      discountPercent: Number(discountPercent.toFixed(2)),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeNewImage = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.silhouetteId) { setError('Vui lòng chọn dòng sản phẩm.'); return; }
    if (!form.basePrice || form.basePrice <= 0) { setError('Giá sản phẩm gốc phải lớn hơn 0.'); return; }
    if (form.price > form.basePrice) { setError('Giá bán thực tế không được lớn hơn giá bán gốc.'); return; }

    setSubmitting(true);
    try {
      const cleanDiscountPercent = form.discountPercent ? Number(Number(form.discountPercent).toFixed(2)) : 0;
      if (mode === 'create') {
        const payload: CreateProductPayload = {
          ...form,
          discountPercent: cleanDiscountPercent,
        };
        await AdminProductService.createProduct(payload, images);
      } else {
        const payload: UpdateProductPayload = {
          ...form,
          discountPercent: cleanDiscountPercent,
        };
        await AdminProductService.updateProduct(initial!.id, payload, images);
      }
      previews.forEach(URL.revokeObjectURL);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">
            {mode === 'create' ? 'Thêm Sản Phẩm Mới' : 'Chỉnh Sửa Sản Phẩm'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              <X className="w-4 h-4 mt-0.5 shrink-0" />{error}
            </div>
          )}

          {/* Tên sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ví dụ: Nike Air Jordan 1 Retro High OG"
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Mô tả sản phẩm</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả chi tiết hoặc thông số sản phẩm..."
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none"
            />
          </div>

          {/* Giá gốc, Giảm giá & Giá thực tế */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Giá gốc (VND) <span className="text-red-500">*</span>
              </label>
              <input
                type="number" required min={0}
                value={form.basePrice || ''}
                onChange={(e) => handleBasePriceChange(Number(e.target.value))}
                placeholder="Ví dụ: 3990000"
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Giảm giá (%)
              </label>
              <input
                type="number" min={0} max={100} step="any"
                value={form.discountPercent ?? 0}
                onChange={(e) => handleDiscountPercentChange(Number(e.target.value))}
                placeholder="Từ 0 đến 100"
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">Giới hạn tối đa: 100%</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Giá bán thực tế (VND)
              </label>
              <input
                type="number" min={0}
                value={form.price || ''}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                placeholder="Tính tự động hoặc nhập"
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">Không được lớn hơn giá gốc</span>
            </div>
          </div>

          {/* Dòng SP & Danh mục */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Dòng sản phẩm <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.silhouetteId || ''}
                onChange={(e) => setForm({ ...form, silhouetteId: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
              >
                <option value="">-- Chọn dòng sản phẩm --</option>
                {silhouettes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Danh mục</label>
              <select
                value={form.categoryId ?? ''}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
              >
                <option value="">-- Không chọn --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Giới tính & Loại SP */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Giới tính hướng đến</label>
              <SegmentButtons options={GENDER_OPTIONS} value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Phân loại hàng hóa</label>
              <SegmentButtons options={TYPE_OPTIONS} value={form.productType} onChange={(v) => setForm({ ...form, productType: v })} />
            </div>
          </div>

          {/* Nổi bật */}
          <div className="flex items-center gap-3">
            <ToggleSwitch checked={form.isFeatured} onChange={(v) => setForm({ ...form, isFeatured: v })} />
            <span className="text-sm text-zinc-700 font-medium">Đánh dấu là sản phẩm nổi bật trên trang chủ</span>
          </div>

          {/* Upload ảnh */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Hình ảnh sản phẩm {mode === 'edit' ? '(Thêm ảnh mới nếu cần)' : ''}
            </label>

            {/* Ảnh hiện tại (edit mode) */}
            {mode === 'edit' && existingImages.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-zinc-400 mb-2">Ảnh hiện tại đang sử dụng:</p>
                <div className="grid grid-cols-5 gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative aspect-square border border-zinc-200 rounded-md overflow-hidden bg-zinc-50">
                      <img src={img.imageUrl} className="w-full h-full object-cover" />
                      {img.isPrimary && (
                        <span className="absolute bottom-1 left-1 bg-zinc-900 text-white text-[9px] px-1 py-0.5 rounded shadow">Ảnh chính</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-200 rounded-lg p-5 text-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition"
            >
              <Upload className="w-7 h-7 mx-auto text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500 font-medium">Nhấp vào đây để chọn tệp hình ảnh</p>
              <p className="text-xs text-zinc-400 mt-1">Định dạng hỗ trợ: JPG, PNG, WEBP. Ảnh đầu tiên tải lên sẽ làm ảnh đại diện sản phẩm.</p>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            {/* Preview ảnh mới */}
            {previews.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-zinc-400 mb-2">Hình ảnh chuẩn bị tải lên:</p>
                <div className="grid grid-cols-5 gap-2">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative group aspect-square border border-zinc-200 rounded-md overflow-hidden bg-zinc-50">
                      <img src={src} className="w-full h-full object-cover" />
                      {mode === 'create' && idx === 0 && existingImages.length === 0 && (
                        <span className="absolute bottom-1 left-1 bg-zinc-900 text-white text-[9px] px-1 py-0.5 rounded shadow">Ảnh chính</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute top-1 right-1 bg-white/95 rounded-full p-1 shadow hover:bg-red-50 transition duration-150"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100">
            <button
              type="button" onClick={onClose} disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Đang lưu sản phẩm...' : mode === 'create' ? 'Tạo sản phẩm' : 'Lưu các thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ──────────── Main Page ────────────
export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal / dialog state
  const [modalMode, setModalMode] = useState<FormMode>('create');
  const [showModal, setShowModal] = useState(false);
  const [editDetail, setEditDetail] = useState<ProductDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Lookup data
  const [silhouettes, setSilhouettes] = useState<SilhouetteResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  useEffect(() => {
    SilhouetteService.getAllSilhouettes().then(setSilhouettes).catch(() => { });
    CategoryService.getAllCategories().then(setCategories).catch(() => { });
  }, []);

  const fetchProducts = useCallback(async (searchTerm: string, pageNum: number) => {
    setLoading(true);
    try {
      const result = await AdminProductService.getAdminProducts({ search: searchTerm || undefined, page: pageNum, size: 10 });
      setProducts(result.items);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(search, page); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchProducts(search, 0);
  };

  // Open create modal
  const openCreate = () => {
    setEditDetail(null);
    setModalMode('create');
    setShowModal(true);
  };

  // Open edit modal — fetch detail first
  const openEdit = async (p: ProductResponse) => {
    setLoadingDetail(true);
    try {
      const detail = await ProductService.getProductById(p.id);
      setEditDetail(detail);
      setModalMode('edit');
      setShowModal(true);
    } catch {
      alert('Không thể tải thông tin chi tiết sản phẩm này.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setEditDetail(null);
    fetchProducts(search, page);
  };

  // Soft delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await AdminProductService.deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      fetchProducts(search, page);
    } catch {
      alert('Có lỗi xảy ra khi thực hiện xóa sản phẩm.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Quản lý Sản phẩm</h1>
          <p className="text-sm text-zinc-500 mt-1">Tổng cộng {totalElements} sản phẩm</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Thêm sản phẩm
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-zinc-200">
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-80">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text" value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm sản phẩm theo tên..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
            </div>
            <button type="submit" className="px-3 py-2 text-sm font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition">
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Sản phẩm</th>
                <th className="px-5 py-3 font-medium">Thương hiệu</th>
                <th className="px-5 py-3 font-medium">Giá gốc</th>
                <th className="px-5 py-3 font-medium">Giá bán</th>
                <th className="px-5 py-3 font-medium">Tồn kho</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Đang tải dữ liệu...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    Không tìm thấy sản phẩm nào phù hợp.
                  </td>
                </tr>
              ) : products.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-zinc-50 transition-colors ${p.isDeleted ? 'opacity-50 bg-zinc-50/50' : ''}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {p.defaultImageUrl ? (
                        <img src={p.defaultImageUrl} alt={p.name}
                          className="w-10 h-10 rounded-md object-cover bg-zinc-100 border border-zinc-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-zinc-100 flex items-center justify-center border border-zinc-100">
                          <ImageIcon className="w-4 h-4 text-zinc-300" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-zinc-900 line-clamp-1 max-w-[180px]">{p.name}</div>
                        <div className="text-xs text-zinc-400">#{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-zinc-600">{p.brand?.name ?? '—'}</td>
                  <td className="px-5 py-4 text-zinc-500 line-through text-xs">{formatPrice(p.basePrice)}</td>
                  <td className="px-5 py-4 font-medium text-zinc-800">{formatPrice(p.price ?? p.basePrice)}</td>
                  <td className="px-5 py-4">
                    <span className={`font-medium ${(p.totalStock ?? 0) === 0 ? 'text-red-500' : 'text-zinc-800'}`}>
                      {p.totalStock ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {p.isDeleted ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Đã xóa
                      </span>
                    ) : (p.totalStock ?? 0) === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        Hết hàng
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Đang bán
                      </span>
                    )}
                    {p.isFeatured && !p.isDeleted && (
                      <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Nổi bật
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {!p.isDeleted && (
                      <>
                        <button
                          onClick={() => openEdit(p)}
                          disabled={loadingDetail}
                          className="p-2 text-zinc-400 hover:text-blue-600 transition-colors mr-1 disabled:opacity-40"
                          title="Chỉnh sửa"
                        >
                          {loadingDetail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {p.isDeleted && (
                      <span className="text-xs text-zinc-300 italic">Đã xóa</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-sm text-zinc-500">Trang {page + 1} / {totalPages}</span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <ProductModal
          mode={modalMode}
          initial={editDetail}
          silhouettes={silhouettes}
          categories={categories}
          onSuccess={handleModalSuccess}
          onClose={() => { setShowModal(false); setEditDetail(null); }}
        />
      )}

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <DeleteDialog
          product={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
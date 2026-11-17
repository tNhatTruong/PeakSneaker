import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Plus, Search, Edit2, X, Upload, ImageIcon,
  Loader2, AlertTriangle, Eye, EyeOff,
  ExternalLink, MoreHorizontal, Package, Download, RefreshCw,
} from 'lucide-react';
import {
  AdminProductService,
  type AdminProductFilterOption,
  type AdminProductStatus,
  type AdminProductStockStatus,
  type CreateProductPayload,
} from '../../services/admin/adminProductService';
import { AdminBrandService, type BrandResponse as AdminBrandResponse } from '../../services/admin/adminBrandService';
import { AdminCategoryService } from '../../services/admin/adminCategoryService';
import { SilhouetteService, type SilhouetteResponse } from '../../services/silhouetteService';
import { type CategoryResponse } from '../../services/categoryService';
import { ProductService, type ProductResponse, type ProductDetailResponse } from '../../services/productService';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminFilterHeader from '../../components/admin/AdminFilterHeader';
import { AdminDetailEmptyState, AdminDetailPanel } from '../../components/admin/AdminDetailPanel';

// ──────────── Constants ────────────
const GENDER_OPTIONS = [
  { value: 'UNISEX', label: 'Unisex' },
  { value: 'MEN', label: 'Nam' },
  { value: 'WOMEN', label: 'Nữ' },
  { value: 'KIDS', label: 'Trẻ em' },
] as const;

const TYPE_OPTIONS = [
  { value: 'SNEAKER', label: 'Giày Sneaker' },
  { value: 'ACCESSORY', label: 'Phụ kiện' },
  { value: 'SHOE_CARE', label: 'Chăm sóc giày' },
] as const;

type FormMode = 'create' | 'edit';

interface ProductFilters {
  status: '' | AdminProductStatus;
  brandId: string;
  categoryId: string;
  silhouetteId: string;
  stockStatus: '' | AdminProductStockStatus;
  minPrice: string;
  maxPrice: string;
}

const EMPTY_FILTERS: ProductFilters = {
  status: '',
  brandId: '',
  categoryId: '',
  silhouetteId: '',
  stockStatus: '',
  minPrice: '',
  maxPrice: '',
};

const normalizeDependentFilters = (
  filters: ProductFilters,
  options: AdminProductFilterOption[],
): ProductFilters => {
  if (options.length === 0) return filters;

  const brandId = filters.brandId ? Number(filters.brandId) : null;
  const brandOptions = brandId == null
    ? options
    : options.filter((option) => option.brandId === brandId);
  const categoryIds = [...new Set(brandOptions.map((option) => option.categoryId))];
  const selectedCategoryId = filters.categoryId ? Number(filters.categoryId) : null;
  const categoryId = selectedCategoryId != null && categoryIds.includes(selectedCategoryId)
    ? filters.categoryId
    : brandId != null && categoryIds.length === 1
      ? String(categoryIds[0])
      : '';
  const compatibleOptions = brandOptions.filter((option) => (
    !categoryId || option.categoryId === Number(categoryId)
  ));
  const silhouetteIds = new Set(compatibleOptions
    .map((option) => option.silhouetteId)
    .filter((silhouetteId): silhouetteId is number => silhouetteId != null));
  const silhouetteId = filters.silhouetteId && silhouetteIds.has(Number(filters.silhouetteId))
    ? filters.silhouetteId
    : '';

  return { ...filters, categoryId, silhouetteId };
};

interface FormState {
  name: string;
  description: string;
  shortDescription: string;
  material: string;
  sole: string;
  design: string;
  usage: string;
  careInstructions: string;
  returnPolicy: string;
  basePrice: number;
  discountPercent: number;
  price: number;
  silhouetteId: number;
  categoryId: number | undefined;
  gender: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS';
  productType: 'SNEAKER' | 'ACCESSORY' | 'SHOE_CARE';
  isFeatured: boolean;
}

const DEFAULT_CARE_INSTRUCTIONS =
  "Vệ sinh định kỳ bằng bọt làm sạch chuyên dụng (Jason Markk, Crep Protect). Không giặt máy hoặc ngâm trực tiếp trong nước xà phòng có chất tẩy mạnh. Phơi giày ở nơi khô thoáng, tránh ánh nắng mặt trời trực tiếp hoặc sấy nhiệt độ cao.";

const DEFAULT_RETURN_POLICY =
  "Hỗ trợ đổi size miễn phí trong vòng 30 ngày kể từ ngày nhận hàng thành công. Sản phẩm đổi trả phải còn nguyên tem mác, hóa đơn và hộp giày gốc không móp méo.";

const formatGenderVi = (gender?: string | null) => {
  if (!gender) return "Mọi đối tượng";
  switch (gender.toUpperCase()) {
    case "MEN":
      return "Nam";
    case "WOMEN":
      return "Nữ";
    case "UNISEX":
      return "Unisex";
    case "KIDS":
      return "Trẻ em";
    default:
      return gender;
  }
};

const defaultForm: FormState = {
  name: '',
  description: '',
  shortDescription: '',
  material: '',
  sole: '',
  design: '',
  usage: '',
  careInstructions: DEFAULT_CARE_INSTRUCTIONS,
  returnPolicy: DEFAULT_RETURN_POLICY,
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

const getProductStatus = (product: Pick<ProductResponse, 'isDeleted' | 'totalStock'>) => {
  if (product.isDeleted) return { label: 'Ngừng kinh doanh', className: 'border-red-200 bg-red-50 text-red-700' };
  if ((product.totalStock ?? 0) === 0) return { label: 'Hết hàng', className: 'border-amber-200 bg-amber-50 text-amber-700' };
  return { label: 'Đang kinh doanh', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  return 'Có lỗi xảy ra, vui lòng thử lại.';
};

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
            <h3 className="font-semibold text-zinc-900">Xác nhận ẩn sản phẩm</h3>
            <p className="text-sm text-zinc-500 mt-0.5">Sản phẩm sẽ bị ẩn khỏi gian hàng</p>
          </div>
        </div>
        <p className="text-sm text-zinc-700 mb-5">
          Bạn có chắc muốn ẩn sản phẩm <span className="font-medium">&quot;{product.name}&quot;</span>?
          Sản phẩm sẽ không còn xuất hiện trên cửa hàng và có thể hiển thị lại bất kỳ lúc nào.
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
            Ẩn sản phẩm
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
      const basePrice = Number(initial.basePrice) || 0;
      const discountPercent = Number(initial.discountPercent) || 0;
      const price = Number(initial.price) || (basePrice - (basePrice * discountPercent / 100));
      let parsedAttrs: Record<string, string> = {};
      if (initial.attributes) {
        try {
          parsedAttrs = JSON.parse(initial.attributes);
        } catch {
          // ignore
        }
      }
      const brandName = initial.brand?.name || "cao cấp";
      const genderVi = formatGenderVi(initial.gender);
      const defaultShortDesc = `${initial.name || "Sản phẩm"} là mẫu sneaker ${brandName} thiết kế dành riêng cho ${genderVi}, phù hợp sử dụng hàng ngày. Sản phẩm có nhiều lựa chọn kích cỡ và được PeakSneaker kiểm tra thông tin trước khi đóng bán.`;

      return {
        name: initial.name ?? '',
        description: initial.description ?? '',
        shortDescription: parsedAttrs.short_description || defaultShortDesc,
        material: parsedAttrs.material ?? '',
        sole: parsedAttrs.sole ?? '',
        design: parsedAttrs.design ?? '',
        usage: parsedAttrs.usage ?? '',
        careInstructions: parsedAttrs.care_instructions || DEFAULT_CARE_INSTRUCTIONS,
        returnPolicy: parsedAttrs.return_policy || DEFAULT_RETURN_POLICY,
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
  const [existingImages] = useState(initial?.images ?? []);
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
      
      const attributesObj: Record<string, string> = {};
      if (form.shortDescription.trim()) attributesObj.short_description = form.shortDescription.trim();
      if (form.material.trim()) attributesObj.material = form.material.trim();
      if (form.sole.trim()) attributesObj.sole = form.sole.trim();
      if (form.design.trim()) attributesObj.design = form.design.trim();
      if (form.usage.trim()) attributesObj.usage = form.usage.trim();
      if (form.careInstructions.trim()) attributesObj.care_instructions = form.careInstructions.trim();
      if (form.returnPolicy.trim()) attributesObj.return_policy = form.returnPolicy.trim();

      const attributesPayload = Object.keys(attributesObj).length > 0 ? JSON.stringify(attributesObj) : undefined;

      const payload: CreateProductPayload = {
        name: form.name,
        description: form.description || undefined,
        attributes: attributesPayload,
        basePrice: form.basePrice,
        discountPercent: cleanDiscountPercent,
        silhouetteId: form.silhouetteId,
        categoryId: form.categoryId || undefined,
        gender: form.gender,
        productType: form.productType,
        isFeatured: form.isFeatured,
      };

      if (mode === 'create') {
        await AdminProductService.createProduct(payload, images);
      } else {
        await AdminProductService.updateProduct(initial!.id, payload, images);
      }
      previews.forEach(URL.revokeObjectURL);
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
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

          {/* Mô tả chi tiết sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Mô tả chi tiết sản phẩm <span className="text-xs font-normal text-zinc-500">(Hiển thị tại Tab Mô tả ở trang chi tiết)</span>
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả chi tiết câu chuyện, di sản, phối màu hoặc công nghệ của sản phẩm..."
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none"
            />
          </div>

          {/* Mô tả ngắn gọn (Hiển thị ngay dưới giá bán) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-zinc-700">
                Mô tả ngắn gọn <span className="text-xs font-normal text-zinc-500">(Hiển thị ngay dưới giá bán ở trang chi tiết)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const selSilhouette = silhouettes.find((s) => s.id === form.silhouetteId);
                  const brandOrSilName = initial?.brand?.name || selSilhouette?.name || "cao cấp";
                  const genderVi = formatGenderVi(form.gender);
                  setForm((prev) => ({
                    ...prev,
                    shortDescription: `${prev.name || "Sản phẩm"} là mẫu sneaker ${brandOrSilName} thiết kế dành riêng cho ${genderVi}, phù hợp sử dụng hàng ngày. Sản phẩm có nhiều lựa chọn kích cỡ và được PeakSneaker kiểm tra thông tin trước khi đóng bán.`
                  }));
                }}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 underline"
              >
                Tạo mô tả đề xuất
              </button>
            </div>
            <textarea
              rows={2}
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              placeholder="Nhập tóm tắt nổi bật xuất hiện ngay dưới giá bán (hoặc nhấn Tạo mô tả đề xuất)..."
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Đoạn văn này xuất hiện trực tiếp dưới mức giá tại trang chi tiết sản phẩm. Nếu để trống, hệ thống sẽ tự động hiển thị câu giới thiệu chuẩn.
            </p>
          </div>

          {/* Thông số chi tiết & Đặc điểm nổi bật */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                Thông số chi tiết & Đặc điểm nổi bật
              </h3>
              <span className="text-[11px] text-zinc-500">Lưu vào DB & hiển thị ở Storefront</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Chất liệu (Material)</label>
                <input
                  type="text"
                  value={form.material}
                  onChange={(e) => setForm({ ...form, material: e.target.value })}
                  placeholder="Ví dụ: Canvas cao cấp dệt mật độ cao..."
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Đế giày (Sole)</label>
                <input
                  type="text"
                  value={form.sole}
                  onChange={(e) => setForm({ ...form, sole: e.target.value })}
                  placeholder="Ví dụ: Cao su lưu hóa bền bỉ..."
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Thiết kế (Design / Style)</label>
                <input
                  type="text"
                  value={form.design}
                  onChange={(e) => setForm({ ...form, design: e.target.value })}
                  placeholder="Ví dụ: Cổ cao cổ điển, inspired by..."
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Phù hợp (Usage)</label>
                <input
                  type="text"
                  value={form.usage}
                  onChange={(e) => setForm({ ...form, usage: e.target.value })}
                  placeholder="Ví dụ: Đi học, đi chơi, dạo phố..."
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-zinc-200/80">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-700">Hướng dẫn bảo quản</label>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, careInstructions: DEFAULT_CARE_INSTRUCTIONS }))}
                    className="text-[10px] text-zinc-500 hover:text-zinc-900 underline"
                  >
                    Dùng văn bản mặc định
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={form.careInstructions}
                  onChange={(e) => setForm({ ...form, careInstructions: e.target.value })}
                  placeholder="Nhập hướng dẫn bảo quản cho sản phẩm..."
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none leading-relaxed"
                />
                <p className="mt-1 text-[11px] text-zinc-500">Đã điền sẵn văn bản đề xuất chuẩn. Có thể chỉnh sửa nếu cần.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-700">Chính sách đổi trả</label>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, returnPolicy: DEFAULT_RETURN_POLICY }))}
                    className="text-[10px] text-zinc-500 hover:text-zinc-900 underline"
                  >
                    Dùng văn bản mặc định
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={form.returnPolicy}
                  onChange={(e) => setForm({ ...form, returnPolicy: e.target.value })}
                  placeholder="Nhập chính sách đổi trả cho sản phẩm..."
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none leading-relaxed"
                />
                <p className="mt-1 text-[11px] text-zinc-500">Đã điền sẵn văn bản đề xuất chuẩn. Có thể chỉnh sửa nếu cần.</p>
              </div>
            </div>
          </div>

          {/* Giá gốc, Giảm giá & Giá thực tế */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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

interface ProductDetailPanelProps {
  product: ProductDetailResponse;
  onClose: () => void;
  onEdit: (product: ProductDetailResponse) => void;
  onToggleVisibility: () => void;
}

type ProductDetailTab = 'overview' | 'variants' | 'images';

function ProductDetailPanel({ product, onClose, onEdit, onToggleVisibility }: ProductDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<ProductDetailTab>('overview');
  const [activeImage, setActiveImage] = useState(product.images.find((image) => image.isPrimary)?.imageUrl ?? product.images[0]?.imageUrl ?? '');
  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
  const outOfStockVariants = product.variants.filter((variant) => variant.stock === 0).length;
  const lowStockVariants = product.variants.filter((variant) => variant.stock > 0 && variant.stock < 10).length;
  const status = getProductStatus({ isDeleted: product.isDeleted, totalStock });

  const parsedAttrs = useMemo(() => {
    if (!product.attributes) return null;
    try {
      return JSON.parse(product.attributes) as Record<string, string>;
    } catch {
      return null;
    }
  }, [product.attributes]);

  useEffect(() => {
    setActiveTab('overview');
    setActiveImage(product.images.find((image) => image.isPrimary)?.imageUrl ?? product.images[0]?.imageUrl ?? '');
  }, [product]);

  const tabs: Array<{ value: ProductDetailTab; label: string }> = [
    { value: 'overview', label: 'Tổng quan' },
    { value: 'variants', label: `Biến thể (${product.variants.length})` },
    { value: 'images', label: 'Hình ảnh' },
  ];

  return (
    <AdminDetailPanel ariaLabel={`Chi tiết sản phẩm ${product.name}`} className="flex flex-col">
      <section aria-labelledby="product-detail-title" className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <h2 id="product-detail-title" className="text-sm font-black text-slate-950">Chi tiết sản phẩm</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800" aria-label="Đóng chi tiết"><X className="h-4 w-4" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_52px] gap-2">
              <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-100">
                {activeImage ? <img src={activeImage} alt={product.name} className="h-full w-full object-contain p-3" /> : <ImageIcon className="h-9 w-9 text-slate-300" />}
              </div>
              <div className="space-y-2 overflow-y-auto">
                {product.images.slice(0, 4).map((image) => <button key={image.id} type="button" onClick={() => setActiveImage(image.imageUrl)} className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-white p-1 ${activeImage === image.imageUrl ? 'border-blue-500 ring-1 ring-blue-200' : 'border-slate-200'}`}><img src={image.imageUrl} alt="" className="h-full w-full object-contain" /></button>)}
              </div>
            </div>
            <h3 className="mt-3 text-base font-black leading-5 text-slate-950">{product.name}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.className}`}>{status.label}</span><span className="text-xs font-bold text-slate-500">{product.brand?.name ?? 'Chưa xác định'}</span></div>
          </div>

          <nav className="grid grid-cols-3 border-y border-slate-200 bg-slate-50/60 px-2" aria-label="Nội dung chi tiết sản phẩm">
            {tabs.map((tab) => <button key={tab.value} type="button" onClick={() => setActiveTab(tab.value)} className={`border-b-2 px-1 py-2.5 text-[10px] font-bold transition ${activeTab === tab.value ? 'border-slate-950 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{tab.label}</button>)}
          </nav>

          <div className="p-4">
            {activeTab === 'overview' && <div className="space-y-5">
              <section><div className="mb-2 flex items-center justify-between"><h4 className="text-xs font-black text-slate-950">Thông tin cơ bản</h4><button type="button" onClick={() => onEdit(product)} className="text-[11px] font-bold text-blue-600">Chỉnh sửa</button></div><dl className="space-y-2">{[['Tên sản phẩm', product.name], ['Mã sản phẩm', `#${product.id}`], ['Thương hiệu', product.brand?.name ?? 'Chưa xác định'], ['Dòng sản phẩm', product.silhouette?.name ?? 'Không áp dụng'], ['Danh mục', product.category?.name ?? 'Chưa phân loại'], ['Mô tả ngắn', product.description || 'Chưa có mô tả']].map(([label, value]) => <div key={label} className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 text-xs"><dt className="text-slate-500">{label}</dt><dd className="line-clamp-3 font-semibold text-slate-800">{value}</dd></div>)}</dl></section>
              <section className="border-t border-slate-100 pt-4"><h4 className="mb-2 text-xs font-black text-slate-950">Giá bán</h4><DetailLine label="Giá gốc" value={formatPrice(product.basePrice)} /><DetailLine label="Giảm giá" value={`${product.discountPercent ?? 0}%`} /><DetailLine label="Giá hiện tại" value={formatPrice(product.price ?? product.basePrice)} strong /></section>
              <section className="border-t border-slate-100 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-950">Thông số chi tiết</h4>
                  <button type="button" onClick={() => onEdit(product)} className="text-[11px] font-bold text-blue-600">
                    Chỉnh sửa
                  </button>
                </div>
                <dl className="space-y-2 text-xs">
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
                    <dt className="text-slate-500">Chất liệu</dt>
                    <dd className="font-semibold text-slate-800">{parsedAttrs?.material || 'Chưa thiết lập'}</dd>
                  </div>
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
                    <dt className="text-slate-500">Đế giày</dt>
                    <dd className="font-semibold text-slate-800">{parsedAttrs?.sole || 'Chưa thiết lập'}</dd>
                  </div>
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
                    <dt className="text-slate-500">Thiết kế</dt>
                    <dd className="font-semibold text-slate-800">{parsedAttrs?.design || 'Chưa thiết lập'}</dd>
                  </div>
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
                    <dt className="text-slate-500">Phù hợp</dt>
                    <dd className="font-semibold text-slate-800">{parsedAttrs?.usage || 'Chưa thiết lập'}</dd>
                  </div>
                </dl>
              </section>
              <section className="border-t border-slate-100 pt-4"><h4 className="mb-2 text-xs font-black text-slate-950">Tồn kho</h4><DetailLine label="Tổng biến thể" value={String(product.variants.length)} /><DetailLine label="Tổng tồn kho" value={String(totalStock)} /><DetailLine label="Biến thể hết hàng" value={String(outOfStockVariants)} danger={outOfStockVariants > 0} /><DetailLine label="Biến thể sắp hết" value={String(lowStockVariants)} danger={lowStockVariants > 0} /></section>
            </div>}

            {activeTab === 'variants' && <div className="space-y-2">{product.variants.map((variant) => <article key={variant.id} className="rounded-lg border border-slate-200 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-mono text-[11px] font-bold text-blue-600">{variant.sku}</p><p className="mt-1 text-xs font-bold text-slate-900">{variant.color} / {variant.size}</p></div><span className={`text-xs font-black ${variant.stock === 0 ? 'text-red-600' : variant.stock < 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{variant.stock} tồn</span></div><p className="mt-2 text-xs text-slate-500">{formatPrice(variant.finalPrice)}</p></article>)}{product.variants.length === 0 && <p className="py-8 text-center text-xs text-slate-400">Sản phẩm chưa có biến thể.</p>}</div>}

            {activeTab === 'images' && <div className="grid grid-cols-2 gap-2">{product.images.map((image) => <button key={image.id} type="button" onClick={() => setActiveImage(image.imageUrl)} className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2"><img src={image.imageUrl} alt="" className="h-full w-full object-contain" /></button>)}{product.images.length === 0 && <p className="col-span-2 py-8 text-center text-xs text-slate-400">Chưa có hình ảnh.</p>}</div>}
          </div>
        </div>

        <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 bg-white p-3">
          <a href={`/products/${product.id}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Xem website <ExternalLink className="h-3.5 w-3.5" /></a>
          {!product.isDeleted && <button type="button" onClick={() => onEdit(product)} className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-950 px-2 text-xs font-bold text-white hover:bg-slate-800"><Edit2 className="h-3.5 w-3.5" />Chỉnh sửa</button>}
          <button type="button" onClick={onToggleVisibility} className={`col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-bold ${product.isDeleted ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-red-200 text-red-700 hover:bg-red-50'}`}>
            {product.isDeleted ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{product.isDeleted ? 'Kích hoạt lại sản phẩm' : 'Ngừng kinh doanh'}
          </button>
        </footer>
      </section>
    </AdminDetailPanel>
  );
}

function DetailLine({ label, value, strong = false, danger = false }: { label: string; value: string; strong?: boolean; danger?: boolean }) {
  return <div className="flex items-start justify-between gap-3 py-1.5 text-xs"><span className="text-slate-500">{label}</span><span className={`${strong ? 'font-black' : 'font-semibold'} ${danger ? 'text-red-600' : 'text-slate-900'}`}>{value}</span></div>;
}

// ──────────── Main Page ────────────
export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [draftFilters, setDraftFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filterError, setFilterError] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState('createdAt-desc');
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal / dialog state
  const [modalMode, setModalMode] = useState<FormMode>('create');
  const [showModal, setShowModal] = useState(false);
  const [editDetail, setEditDetail] = useState<ProductDetailResponse | null>(null);
  const [viewDetail, setViewDetail] = useState<ProductDetailResponse | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Lookup data
  const [silhouettes, setSilhouettes] = useState<SilhouetteResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<AdminBrandResponse[]>([]);
  const [filterOptions, setFilterOptions] = useState<AdminProductFilterOption[]>([]);

  useEffect(() => {
    SilhouetteService.getAllSilhouettes().then(setSilhouettes).catch(() => { });
    AdminCategoryService.getCategories().then(setCategories).catch(() => { });
    AdminBrandService.getBrands().then(setBrands).catch(() => { });
    AdminProductService.getFilterOptions().then(setFilterOptions).catch(() => { });

  }, []);

  useEffect(() => {
    if (filterOptions.length === 0) return;
    setDraftFilters((current) => normalizeDependentFilters(current, filterOptions));
    setAppliedFilters((current) => normalizeDependentFilters(current, filterOptions));
  }, [filterOptions]);

  const fetchProducts = useCallback(async (
    searchTerm: string,
    pageNum: number,
    requestedPageSize: number,
    requestedSort: string,
    filters: ProductFilters,
  ) => {
    setLoading(true);
    try {
      const [sortBy, sortDirection] = requestedSort.split('-');
      const result = await AdminProductService.getAdminProducts({
        search: searchTerm || undefined,
        status: filters.status || undefined,
        brandId: filters.brandId ? Number(filters.brandId) : undefined,
        categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
        silhouetteId: filters.silhouetteId ? Number(filters.silhouetteId) : undefined,
        stockStatus: filters.stockStatus || undefined,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        page: pageNum,
        size: requestedPageSize,
        sortBy,
        sortDirection,
      });
      setProducts(result.items);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(appliedSearch, page, pageSize, sort, appliedFilters);
  }, [appliedFilters, appliedSearch, fetchProducts, page, pageSize, sort]);

  const exportProductsCsv = useCallback(async () => {
    try {
      const [sortBy, sortDirection] = sort.split('-');
      const result = await AdminProductService.getAdminProducts({
        search: appliedSearch || undefined,
        status: appliedFilters.status || undefined,
        brandId: appliedFilters.brandId ? Number(appliedFilters.brandId) : undefined,
        categoryId: appliedFilters.categoryId ? Number(appliedFilters.categoryId) : undefined,
        silhouetteId: appliedFilters.silhouetteId ? Number(appliedFilters.silhouetteId) : undefined,
        stockStatus: appliedFilters.stockStatus || undefined,
        minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
        maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
        page: 0,
        size: Math.min(Math.max(totalElements, 100), 1000),
        sortBy,
        sortDirection,
      });
      const rows = [
        ['Mã SP', 'Tên sản phẩm', 'Thương hiệu', 'Giá gốc (VND)', 'Giảm giá (%)', 'Giá bán (VND)', 'Tổng tồn kho', 'Nổi bật', 'Trạng thái'],
        ...result.items.map((item) => [
          `#${item.id}`,
          item.name,
          item.brand?.name ?? 'Chưa xác định',
          item.basePrice ?? 0,
          item.discountPercent ?? 0,
          item.price ?? item.basePrice ?? 0,
          item.totalStock ?? 0,
          item.isFeatured ? 'Có' : 'Không',
          getProductStatus(item).label,
        ]),
      ];
      const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')}`;
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `peaksneaker-products-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Không thể xuất danh sách sản phẩm.');
    }
  }, [appliedFilters, appliedSearch, sort, totalElements]);

  useEffect(() => {
    const handleExport = () => { void exportProductsCsv(); };
    window.addEventListener('admin:export', handleExport);
    return () => window.removeEventListener('admin:export', handleExport);
  }, [exportProductsCsv]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const minPrice = draftFilters.minPrice ? Number(draftFilters.minPrice) : undefined;
    const maxPrice = draftFilters.maxPrice ? Number(draftFilters.maxPrice) : undefined;
    if (minPrice !== undefined && minPrice < 0) {
      setFilterError('Giá tối thiểu không được nhỏ hơn 0.');
      return;
    }
    if (maxPrice !== undefined && maxPrice < 0) {
      setFilterError('Giá tối đa không được nhỏ hơn 0.');
      return;
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      setFilterError('Giá tối thiểu không được lớn hơn giá tối đa.');
      return;
    }
    setFilterError('');
    setPage(0);
    setAppliedSearch(search.trim());
    const normalizedFilters = normalizeDependentFilters(draftFilters, filterOptions);
    setDraftFilters(normalizedFilters);
    setAppliedFilters(normalizedFilters);
  };

  const clearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setFilterError('');
    setPage(0);
  };

  // Open create modal
  const openCreate = () => {
    setEditDetail(null);
    setModalMode('create');
    setShowModal(true);
  };

  // Open edit modal — fetch detail first
  const openEdit = async (p: ProductResponse) => {
    setLoadingDetailId(p.id);
    try {
      const detail = await ProductService.getProductById(p.id);
      setEditDetail(detail);
      setModalMode('edit');
      setShowModal(true);
    } catch {
      alert('Không thể tải thông tin chi tiết sản phẩm này.');
    } finally {
      setLoadingDetailId(null);
    }
  };

  const openDetail = async (product: ProductResponse) => {
    setLoadingDetailId(product.id);
    try {
      setViewDetail(await ProductService.getProductById(product.id));
    } catch {
      alert('Không thể tải thông tin chi tiết sản phẩm này.');
    } finally {
      setLoadingDetailId(null);
    }
  };

  const editFromDetail = (product: ProductDetailResponse) => {
    setViewDetail(null);
    setEditDetail(product);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setEditDetail(null);
    fetchProducts(appliedSearch, page, pageSize, sort, appliedFilters);
  };

  // Soft delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await AdminProductService.updateVisibility(deleteTarget.id, false);
      setViewDetail((current) => current?.id === deleteTarget.id ? { ...current, isDeleted: true } : current);
      setDeleteTarget(null);
      fetchProducts(appliedSearch, page, pageSize, sort, appliedFilters);
    } catch {
      alert('Có lỗi xảy ra khi thực hiện xóa sản phẩm.');
    } finally {
      setDeleting(false);
    }
  };

  const restoreProduct = async (product: ProductResponse) => {
    try {
      await AdminProductService.updateVisibility(product.id, true);
      setViewDetail((current) => current?.id === product.id ? { ...current, isDeleted: false } : current);
      fetchProducts(appliedSearch, page, pageSize, sort, appliedFilters);
    } catch {
      alert('Không thể hiển thị lại sản phẩm.');
    }
  };

  const availableCategories = filterOptions.length > 0 && draftFilters.brandId
    ? categories.filter((category) => filterOptions.some((option) => (
      option.brandId === Number(draftFilters.brandId) && option.categoryId === category.id
    )))
    : categories;
  const availableBrands = filterOptions.length > 0 && draftFilters.categoryId
    ? brands.filter((brand) => filterOptions.some((option) => (
      option.categoryId === Number(draftFilters.categoryId) && option.brandId === brand.id
    )))
    : brands;
  const compatibleSilhouetteIds = new Set(filterOptions
    .filter((option) => !draftFilters.brandId || option.brandId === Number(draftFilters.brandId))
    .filter((option) => !draftFilters.categoryId || option.categoryId === Number(draftFilters.categoryId))
    .map((option) => option.silhouetteId)
    .filter((silhouetteId): silhouetteId is number => silhouetteId != null));
  const filterSilhouettes = filterOptions.length > 0
    ? silhouettes.filter((silhouette) => compatibleSilhouetteIds.has(silhouette.id))
    : brands
      .filter((brand) => !draftFilters.brandId || brand.id === Number(draftFilters.brandId))
      .flatMap((brand) => brand.silhouettes ?? []);

  const updateBrandFilter = (brandId: string) => {
    setDraftFilters((current) => normalizeDependentFilters({
      ...current,
      brandId,
      silhouetteId: '',
    }, filterOptions));
  };

  const updateCategoryFilter = (categoryId: string) => {
    setDraftFilters((current) => {
      const selectedBrandIsCompatible = !current.brandId || !categoryId || filterOptions.some((option) => (
        option.brandId === Number(current.brandId) && option.categoryId === Number(categoryId)
      ));
      return normalizeDependentFilters({
        ...current,
        brandId: selectedBrandIsCompatible ? current.brandId : '',
        categoryId,
        silhouetteId: '',
      }, filterOptions);
    });
  };
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length + (appliedSearch ? 1 : 0);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Sản phẩm"
        description="Quản lý danh sách sản phẩm, giá bán, tồn kho và trạng thái hiển thị."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void exportProductsCsv()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Download className="h-4 w-4" /> Xuất CSV
            </button>
            <button
              type="button"
              onClick={() => void fetchProducts(appliedSearch, page, pageSize, sort, appliedFilters)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Thêm sản phẩm
            </button>
          </div>
        )}
      />

      <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:items-start">
      <div className="min-w-0 space-y-3">
      <div className="z-30 -mx-1 bg-slate-50 px-1 pb-2 2xl:sticky 2xl:-top-5">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <AdminFilterHeader
            isOpen={filtersOpen}
            onToggle={() => setFiltersOpen((open) => !open)}
            activeCount={activeFilterCount}
            onReset={clearFilters}
          />

          {filtersOpen && (
            <form onSubmit={handleSearch} className="space-y-4 p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm sản phẩm, SKU..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700" aria-label="Xóa từ khóa">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex">
                <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 sm:w-auto">
                  <Search className="h-4 w-4" /> Áp dụng
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12">
              <label className="space-y-1.5 xl:col-span-2">
                <span className="text-xs font-bold text-slate-500">Trạng thái</span>
                <select value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value as ProductFilters['status'] }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400">
                  <option value="">Tất cả</option>
                  <option value="ACTIVE">Đang kinh doanh</option>
                  <option value="HIDDEN">Ngừng kinh doanh</option>
                </select>
              </label>
              <label className="space-y-1.5 xl:col-span-2">
                <span className="text-xs font-bold text-slate-500">Thương hiệu</span>
                <select
                  value={draftFilters.brandId}
                  onChange={(event) => updateBrandFilter(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="">Tất cả</option>
                  {availableBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 xl:col-span-2">
                <span className="text-xs font-bold text-slate-500">Danh mục</span>
                <select value={draftFilters.categoryId} onChange={(event) => updateCategoryFilter(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400">
                  <option value="">Tất cả</option>
                  {availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 xl:col-span-2">
                <span className="text-xs font-bold text-slate-500">Dòng sản phẩm</span>
                <select disabled={filterSilhouettes.length === 0} value={draftFilters.silhouetteId} onChange={(event) => setDraftFilters((current) => ({ ...current, silhouetteId: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400">
                  <option value="">{filterSilhouettes.length === 0 ? 'Không áp dụng' : 'Tất cả'}</option>
                  {filterSilhouettes.map((silhouette) => <option key={silhouette.id} value={silhouette.id}>{silhouette.name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 xl:col-span-2">
                <span className="text-xs font-bold text-slate-500">Kho</span>
                <select value={draftFilters.stockStatus} onChange={(event) => setDraftFilters((current) => ({ ...current, stockStatus: event.target.value as ProductFilters['stockStatus'] }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400">
                  <option value="">Tất cả</option>
                  <option value="IN_STOCK">Còn hàng</option>
                  <option value="LOW_STOCK">Sắp hết hàng</option>
                  <option value="OUT_OF_STOCK">Hết hàng</option>
                </select>
              </label>
              <fieldset className="xl:col-span-2">
                <legend className="mb-1.5 text-xs font-bold text-slate-500">Khoảng giá</legend>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="0" value={draftFilters.minPrice} onChange={(event) => setDraftFilters((current) => ({ ...current, minPrice: event.target.value }))} placeholder="Từ" className="h-10 min-w-0 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" />
                  <input type="number" min="0" value={draftFilters.maxPrice} onChange={(event) => setDraftFilters((current) => ({ ...current, maxPrice: event.target.value }))} placeholder="Đến" className="h-10 min-w-0 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" />
                </div>
              </fieldset>
            </div>

            {filterError && <p className="text-sm font-semibold text-red-600">{filterError}</p>}
            </form>
          )}
        </section>
      </div>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-950">Danh sách sản phẩm</h2>
              <p className="mt-0.5 text-xs text-slate-500">{totalElements.toLocaleString('vi-VN')} sản phẩm trong hệ thống</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select
              value={sort}
              onChange={(event) => { setSort(event.target.value); setPage(0); }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-400"
              aria-label="Sắp xếp sản phẩm"
            >
              <option value="createdAt-desc">Mới nhất</option>
              <option value="createdAt-asc">Cũ nhất</option>
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
              <option value="basePrice-desc">Giá cao nhất</option>
              <option value="basePrice-asc">Giá thấp nhất</option>
            </select>
            <select
              value={pageSize}
              onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-400"
              aria-label="Số sản phẩm mỗi trang"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </header>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[720px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[38%]" />
              <col className="w-[17%]" />
              <col className="w-[18%]" />
              <col className="w-[10%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-3 py-3">Thương hiệu</th>
                <th className="px-3 py-3">Giá bán</th>
                <th className="px-3 py-3">Tồn kho</th>
                <th className="px-3 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                    <Loader2 className="mr-2 inline h-5 w-5 animate-spin" /> Đang tải dữ liệu...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                    Không tìm thấy sản phẩm nào phù hợp.
                  </td>
                </tr>
              ) : products.map((product) => {
                const status = getProductStatus(product);
                return (
                  <tr key={product.id} onClick={() => openDetail(product)} className={`cursor-pointer transition-colors hover:bg-blue-50/40 ${viewDetail?.id === product.id ? 'bg-blue-50/60' : product.isDeleted ? 'bg-slate-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <button type="button" onClick={(event) => { event.stopPropagation(); openDetail(product); }} className="flex w-full min-w-0 items-center gap-2.5 text-left">
                        {product.defaultImageUrl ? (
                          <img src={product.defaultImageUrl} alt={product.name} className="h-12 w-14 shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-contain p-1" />
                        ) : (
                          <span className="flex h-12 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                            <ImageIcon className="h-5 w-5 text-slate-300" />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-slate-950">{product.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-400">ID #{product.id}{product.isFeatured ? ' · Nổi bật' : ''}</span>
                        </span>
                      </button>
                    </td>
                    <td className="truncate px-3 py-3 font-semibold text-slate-600">{product.brand?.name ?? 'Chưa xác định'}</td>
                    <td className="px-3 py-3">
                      <p className="font-black text-slate-950">{formatPrice(product.price ?? product.basePrice)}</p>
                      {(product.discountPercent ?? 0) > 0 && (
                        <p className="mt-0.5 text-xs text-slate-400"><span className="line-through">{formatPrice(product.basePrice)}</span> · -{product.discountPercent}%</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`font-black ${(product.totalStock ?? 0) === 0 ? 'text-red-600' : (product.totalStock ?? 0) < 10 ? 'text-amber-600' : 'text-slate-900'}`}>
                        {product.totalStock ?? 0}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 lg:hidden">
          {loading ? (
            <div className="px-4 py-14 text-center text-sm text-slate-400"><Loader2 className="mr-2 inline h-5 w-5 animate-spin" /> Đang tải dữ liệu...</div>
          ) : products.length === 0 ? (
            <div className="px-4 py-14 text-center text-sm text-slate-400">Không tìm thấy sản phẩm nào phù hợp.</div>
          ) : products.map((product) => {
            const status = getProductStatus(product);
            return (
              <article key={product.id} className="p-4">
                <div className="flex gap-3">
                  {product.defaultImageUrl ? (
                    <img src={product.defaultImageUrl} alt={product.name} className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 bg-slate-50 object-contain p-1" />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50"><ImageIcon className="h-6 w-6 text-slate-300" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-black text-slate-950">{product.name}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">{product.brand?.name ?? 'Chưa xác định'} · ID #{product.id}</p>
                      </div>
                      <button type="button" onClick={() => openDetail(product)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label={`Xem ${product.name}`}>
                        {loadingDetailId === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-black text-slate-950">{formatPrice(product.price ?? product.basePrice)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold ${status.className}`}>{status.label}</span>
                      <span className="text-xs font-bold text-slate-600">{product.totalStock ?? 0} tồn kho</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => openDetail(product)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700"><Eye className="h-3.5 w-3.5" /> Xem</button>
                  {!product.isDeleted ? (
                    <>
                      <button type="button" onClick={() => openEdit(product)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700"><Edit2 className="h-3.5 w-3.5" /> Sửa</button>
                      <button type="button" onClick={() => setDeleteTarget(product)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 text-xs font-bold text-red-700"><EyeOff className="h-3.5 w-3.5" /> Ẩn</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => restoreProduct(product)} className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 text-xs font-bold text-emerald-700"><Eye className="h-3.5 w-3.5" /> Kích hoạt lại</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          visibleCount={products.length}
          itemLabel="sản phẩm"
          disabled={loading}
          onPageChange={setPage}
        />
      </section>
      </div>
      {viewDetail ? (
        <ProductDetailPanel
          product={viewDetail}
          onClose={() => setViewDetail(null)}
          onEdit={editFromDetail}
          onToggleVisibility={() => {
            const summary = products.find((product) => product.id === viewDetail.id);
            if (!summary) return;
            if (viewDetail.isDeleted) void restoreProduct(summary);
            else setDeleteTarget(summary);
          }}
        />
      ) : (
        <AdminDetailPanel ariaLabel="Chưa chọn sản phẩm">
          <AdminDetailEmptyState
            icon={<Package className="h-9 w-9" />}
            title="Chưa chọn sản phẩm"
            description="Chọn một sản phẩm trong danh sách để xem thông tin và thao tác quản lý bên cạnh."
            items={["Thông tin cơ bản và giá bán", "Biến thể và tồn kho", "Nội dung và hình ảnh sản phẩm"]}
          />
        </AdminDetailPanel>
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

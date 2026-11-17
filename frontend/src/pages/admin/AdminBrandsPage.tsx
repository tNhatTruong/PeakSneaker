import {
  Plus, Search, Edit2, Trash2, X, AlertTriangle, ChevronDown, ChevronRight,
  Upload, ImageIcon, Loader2, RefreshCw, Layers, Eye, EyeOff,
} from "lucide-react";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { AdminBrandService, type BrandResponse } from "../../services/admin/adminBrandService";
import { AdminSilhouetteService, type SilhouetteResponse } from "../../services/admin/adminSilhouetteService";

type BrandVisibilityFilter = "ALL" | "VISIBLE" | "HIDDEN";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== "object" || error === null || !("response" in error)) return fallback;
  const response = (error as { response?: { data?: { message?: unknown } } }).response;
  return typeof response?.data?.message === "string" ? response.data.message : fallback;
};

function FileUploadArea({
  preview,
  onFileChange,
  fileRef,
  label,
}: {
  preview: string | null;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  fileRef: RefObject<HTMLInputElement | null>;
  label: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</label>
      <div
        onClick={() => fileRef.current?.click()}
        className="group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 transition-all hover:border-zinc-400 hover:bg-zinc-50"
      >
        {preview ? (
          <div className="flex items-center justify-center p-4">
            <img src={preview} alt="Preview" className="max-h-32 max-w-full rounded-lg object-contain" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white">Đổi ảnh</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
            <Upload className="mb-2 h-8 w-8" />
            <span className="text-xs font-medium">Kéo thả hoặc click để chọn ảnh</span>
            <span className="mt-1 text-[10px] text-zinc-300">PNG, JPG, SVG • Tối đa 5MB</span>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<BrandVisibilityFilter>("ALL");

  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isEditBrandOpen, setIsEditBrandOpen] = useState(false);
  const [isDeleteBrandOpen, setIsDeleteBrandOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<number | null>(null);

  const [brandForm, setBrandForm] = useState({ name: "", description: "" });
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);
  const brandFileRef = useRef<HTMLInputElement>(null);

  const [expandedBrandId, setExpandedBrandId] = useState<number | null>(null);
  const [silhouettes, setSilhouettes] = useState<SilhouetteResponse[]>([]);
  const [loadingSilhouettes, setLoadingSilhouettes] = useState(false);

  const [isAddSilOpen, setIsAddSilOpen] = useState(false);
  const [isEditSilOpen, setIsEditSilOpen] = useState(false);
  const [isDeleteSilOpen, setIsDeleteSilOpen] = useState(false);
  const [selectedSil, setSelectedSil] = useState<SilhouetteResponse | null>(null);
  const [silForm, setSilForm] = useState({ name: "" });
  const [silImageFile, setSilImageFile] = useState<File | null>(null);
  const [silImagePreview, setSilImagePreview] = useState<string | null>(null);
  const [submittingSil, setSubmittingSil] = useState(false);
  const silFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AdminBrandService.getBrands(debouncedQuery || undefined);
      setBrands(data);
    } catch {
      toast.error("Không thể tải danh sách thương hiệu.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    void fetchBrands();
  }, [fetchBrands]);

  const counts = useMemo(() => ({
    ALL: brands.length,
    VISIBLE: brands.filter((brand) => brand.isVisible).length,
    HIDDEN: brands.filter((brand) => !brand.isVisible).length,
  }), [brands]);

  const filteredBrands = useMemo(() => {
    if (visibilityFilter === "VISIBLE") return brands.filter((brand) => brand.isVisible);
    if (visibilityFilter === "HIDDEN") return brands.filter((brand) => !brand.isVisible);
    return brands;
  }, [brands, visibilityFilter]);

  const fetchSilhouettes = async (brandId: number) => {
    setLoadingSilhouettes(true);
    try {
      const data = await AdminSilhouetteService.getByBrand(brandId);
      setSilhouettes(data);
    } catch {
      toast.error("Không thể tải dòng sản phẩm.");
    } finally {
      setLoadingSilhouettes(false);
    }
  };

  const toggleExpand = (brandId: number) => {
    if (expandedBrandId === brandId) {
      setExpandedBrandId(null);
      setSilhouettes([]);
    } else {
      setExpandedBrandId(brandId);
      void fetchSilhouettes(brandId);
    }
  };

  const resetBrandForm = () => {
    setBrandForm({ name: "", description: "" });
    setBrandLogoFile(null);
    setBrandLogoPreview(null);
  };

  const handleBrandLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBrandLogoFile(file);
      setBrandLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleAddBrand = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await AdminBrandService.createBrand(brandForm.name, brandForm.description, brandLogoFile || undefined);
      toast.success("Thêm thương hiệu thành công!");
      setIsAddBrandOpen(false);
      resetBrandForm();
      await fetchBrands();
    } catch (error) {
      toast.error(getErrorMessage(error, "Lỗi khi thêm thương hiệu."));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditBrand = (brand: BrandResponse) => {
    setSelectedBrand(brand);
    setBrandForm({ name: brand.name, description: brand.description || "" });
    setBrandLogoPreview(brand.logoUrl);
    setBrandLogoFile(null);
    setIsEditBrandOpen(true);
  };

  const handleEditBrand = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;
    setSubmitting(true);
    try {
      await AdminBrandService.updateBrand(selectedBrand.id, brandForm.name, brandForm.description, brandLogoFile || undefined);
      toast.success("Cập nhật thương hiệu thành công!");
      setIsEditBrandOpen(false);
      resetBrandForm();
      await fetchBrands();
    } catch (error) {
      toast.error(getErrorMessage(error, "Lỗi khi cập nhật."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!selectedBrand) return;
    setSubmitting(true);
    try {
      await AdminBrandService.deleteBrand(selectedBrand.id);
      toast.success(`Đã xóa thương hiệu ${selectedBrand.name}`);
      setIsDeleteBrandOpen(false);
      if (expandedBrandId === selectedBrand.id) {
        setExpandedBrandId(null);
        setSilhouettes([]);
      }
      await fetchBrands();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể xóa thương hiệu."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVisibilityChange = async (brand: BrandResponse) => {
    setUpdatingVisibilityId(brand.id);
    try {
      const updatedBrand = await AdminBrandService.updateVisibility(brand.id, !brand.isActive);
      setBrands((currentBrands) => currentBrands.map((item) => (
        item.id === updatedBrand.id ? updatedBrand : item
      )));
      toast.success(updatedBrand.isActive
        ? `Đã bật thương hiệu ${updatedBrand.name}`
        : `Đã ẩn thương hiệu ${updatedBrand.name}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật trạng thái hiển thị."));
    } finally {
      setUpdatingVisibilityId(null);
    }
  };

  const resetSilForm = () => {
    setSilForm({ name: "" });
    setSilImageFile(null);
    setSilImagePreview(null);
  };

  const handleSilImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSilImageFile(file);
      setSilImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddSil = async (e: FormEvent) => {
    e.preventDefault();
    if (!expandedBrandId) return;
    setSubmittingSil(true);
    try {
      await AdminSilhouetteService.create(silForm.name, expandedBrandId, silImageFile || undefined);
      toast.success("Thêm dòng sản phẩm thành công!");
      setIsAddSilOpen(false);
      resetSilForm();
      await Promise.all([fetchSilhouettes(expandedBrandId), fetchBrands()]);
    } catch (error) {
      toast.error(getErrorMessage(error, "Lỗi khi thêm dòng sản phẩm."));
    } finally {
      setSubmittingSil(false);
    }
  };

  const openEditSil = (sil: SilhouetteResponse) => {
    setSelectedSil(sil);
    setSilForm({ name: sil.name });
    setSilImagePreview(sil.imageUrl);
    setSilImageFile(null);
    setIsEditSilOpen(true);
  };

  const handleEditSil = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSil || !expandedBrandId) return;
    setSubmittingSil(true);
    try {
      await AdminSilhouetteService.update(selectedSil.id, silForm.name, expandedBrandId, silImageFile || undefined);
      toast.success("Cập nhật dòng sản phẩm thành công!");
      setIsEditSilOpen(false);
      resetSilForm();
      await fetchSilhouettes(expandedBrandId);
    } catch (error) {
      toast.error(getErrorMessage(error, "Lỗi khi cập nhật."));
    } finally {
      setSubmittingSil(false);
    }
  };

  const handleDeleteSil = async () => {
    if (!selectedSil || !expandedBrandId) return;
    setSubmittingSil(true);
    try {
      await AdminSilhouetteService.delete(selectedSil.id);
      toast.success("Đã xóa dòng sản phẩm!");
      setIsDeleteSilOpen(false);
      await Promise.all([fetchSilhouettes(expandedBrandId), fetchBrands()]);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể xóa dòng sản phẩm."));
    } finally {
      setSubmittingSil(false);
    }
  };

  const canDeleteBrand = (brand: BrandResponse) =>
    brand.activeProductCount === 0 && (brand.silhouettes?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Thương hiệu & Dòng sản phẩm"
        description="Quản lý thương hiệu, dòng sản phẩm (Silhouette) và trạng thái hiển thị trên cửa hàng."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchBrands()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
            </button>
            <button
              type="button"
              onClick={() => { resetBrandForm(); setIsAddBrandOpen(true); }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Thêm thương hiệu
            </button>
          </div>
        }
      />

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thương hiệu..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-8 text-sm placeholder-zinc-400 outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 transition-colors hover:text-zinc-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {([
              ["ALL", "Tất cả", counts.ALL],
              ["VISIBLE", "Đang hiển thị", counts.VISIBLE],
              ["HIDDEN", "Đang ẩn", counts.HIDDEN],
            ] as const).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => setVisibilityFilter(value)}
                className={`h-9 rounded-lg px-3 text-xs font-bold transition ${
                  visibilityFilter === value
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {label}{" "}
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                  visibilityFilter === value ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500"
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-zinc-500">
              <tr>
                <th className="w-12 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider"></th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Logo</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Tên Hãng</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Mô tả</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Dòng sản phẩm</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Hiển thị</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-400" />
                    <p className="mt-2 text-sm text-zinc-400">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Layers className="mx-auto mb-3 h-10 w-10 text-zinc-200" />
                    <p className="text-sm font-medium text-zinc-500">Không tìm thấy thương hiệu phù hợp</p>
                    <p className="mt-1 text-xs text-zinc-400">Thử thay đổi từ khóa hoặc bộ lọc hiển thị.</p>
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand) => {
                  const deletable = canDeleteBrand(brand);
                  return (
                    <Fragment key={brand.id}>
                      <tr className="group transition-colors hover:bg-zinc-50/50">
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => toggleExpand(brand.id)}
                            aria-label={`Mở rộng dòng sản phẩm của ${brand.name}`}
                            className="rounded p-1 text-zinc-400 transition-colors hover:text-zinc-600"
                          >
                            {expandedBrandId === brand.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
                            {brand.logoUrl ? (
                              <img src={brand.logoUrl} alt={brand.name} className="max-h-full max-w-full object-contain p-1.5" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-zinc-300" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-zinc-900">{brand.name}</span>
                          <p className="mt-0.5 font-mono text-[11px] text-zinc-400">{brand.slug}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="line-clamp-2 max-w-xs text-xs text-zinc-500">
                            {brand.description || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => toggleExpand(brand.id)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
                          >
                            <Layers className="h-3 w-3" />
                            {brand.silhouettes?.length ?? 0} dòng
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex min-w-40 items-center gap-3">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={brand.isActive}
                              aria-label={`${brand.isActive ? "Ẩn" : "Hiện"} thương hiệu ${brand.name}`}
                              disabled={updatingVisibilityId === brand.id}
                              onClick={() => void handleVisibilityChange(brand)}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 ${
                                brand.isActive ? "bg-zinc-900" : "bg-zinc-300"
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                brand.isActive ? "translate-x-6" : "translate-x-1"
                              }`} />
                            </button>
                            <div>
                              <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                                brand.isVisible ? "text-emerald-700" : "text-zinc-500"
                              }`}>
                                {brand.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                {brand.isVisible ? "Đang hiển thị" : "Đang ẩn"}
                              </div>
                              <p className="mt-0.5 text-[11px] text-zinc-400">
                                {!brand.isActive
                                  ? "Tắt thủ công"
                                  : brand.activeProductCount === 0
                                    ? "Tự ẩn vì chưa có sản phẩm"
                                    : `${brand.activeProductCount} sản phẩm đang bán`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity xl:opacity-0 xl:group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => openEditBrand(brand)}
                              className="rounded-lg p-2 text-zinc-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                              title="Sửa thương hiệu"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={!deletable}
                              onClick={() => { setSelectedBrand(brand); setIsDeleteBrandOpen(true); }}
                              className="rounded-lg p-2 text-zinc-400 transition-all hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                              title={deletable
                                ? "Xóa thương hiệu"
                                : "Không thể xóa thương hiệu đang có sản phẩm hoặc dòng sản phẩm (hãy dùng công tắc Hiển thị)"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedBrandId === brand.id && (
                        <tr key={`sil-${brand.id}`}>
                          <td colSpan={7} className="p-0">
                            <div className="border-t border-zinc-100 bg-zinc-50/70 px-8 py-5">
                              <div className="mb-4 flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                  <Layers className="h-3.5 w-3.5" />
                                  Dòng sản phẩm của {brand.name}
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => { resetSilForm(); setIsAddSilOpen(true); }}
                                  className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
                                >
                                  <Plus className="h-3 w-3" />
                                  Thêm dòng sản phẩm
                                </button>
                              </div>

                              {loadingSilhouettes ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                                </div>
                              ) : silhouettes.length === 0 ? (
                                <div className="py-8 text-center">
                                  <p className="text-sm text-zinc-400">Chưa có dòng sản phẩm nào cho thương hiệu này.</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                  {silhouettes.map((sil) => (
                                    <div
                                      key={sil.id}
                                      className="group/card rounded-xl border border-zinc-100 bg-white p-3 transition-all hover:border-zinc-200 hover:shadow-md"
                                    >
                                      <div className="mb-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-zinc-50">
                                        {sil.imageUrl ? (
                                          <img src={sil.imageUrl} alt={sil.name} className="h-full w-full object-cover" />
                                        ) : (
                                          <ImageIcon className="h-8 w-8 text-zinc-200" />
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-sm font-medium text-zinc-800">{sil.name}</span>
                                        <div className="flex items-center gap-0.5 opacity-100 transition-opacity xl:opacity-0 xl:group-hover/card:opacity-100">
                                          <button
                                            type="button"
                                            onClick={() => openEditSil(sil)}
                                            className="rounded-md p-1.5 text-zinc-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                                            title="Sửa dòng sản phẩm"
                                          >
                                            <Edit2 className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => { setSelectedSil(sil); setIsDeleteSilOpen(true); }}
                                            className="rounded-md p-1.5 text-zinc-400 transition-all hover:bg-red-50 hover:text-red-600"
                                            title="Xóa dòng sản phẩm"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddBrandOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-5">
              <h3 className="text-lg font-bold text-zinc-900">Thêm Thương Hiệu Mới</h3>
              <button type="button" onClick={() => setIsAddBrandOpen(false)} className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddBrand} className="space-y-5 p-5">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Tên Thương Hiệu <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  placeholder="Ví dụ: ASICS"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100"
                />
              </div>

              <FileUploadArea
                preview={brandLogoPreview}
                onFileChange={handleBrandLogoChange}
                fileRef={brandFileRef}
                label="Logo thương hiệu"
              />

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Mô tả (Tùy chọn)
                </label>
                <textarea
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  rows={3}
                  placeholder="Nhập mô tả hoặc câu chuyện thương hiệu..."
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-100 pt-3">
                <button type="button" onClick={() => setIsAddBrandOpen(false)} className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Lưu Thương Hiệu
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {isEditBrandOpen && selectedBrand && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-5">
              <h3 className="text-lg font-bold text-zinc-900">Sửa Thương Hiệu</h3>
              <button type="button" onClick={() => setIsEditBrandOpen(false)} className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditBrand} className="space-y-5 p-5">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Tên Thương Hiệu <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100"
                />
              </div>

              <FileUploadArea
                preview={brandLogoPreview}
                onFileChange={handleBrandLogoChange}
                fileRef={brandFileRef}
                label="Logo thương hiệu"
              />

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Mô tả (Tùy chọn)
                </label>
                <textarea
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-100 pt-3">
                <button type="button" onClick={() => setIsEditBrandOpen(false)} className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {isDeleteBrandOpen && selectedBrand && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-zinc-900">Xóa Thương Hiệu</h3>
              <p className="mb-6 text-sm text-zinc-500">
                Bạn có chắc chắn muốn xóa vĩnh viễn thương hiệu <span className="font-semibold text-zinc-800">{selectedBrand.name}</span>?
                <br />
                <span className="mt-1 inline-block text-xs text-zinc-400">Chỉ các thương hiệu chưa gắn với sản phẩm hoặc dòng sản phẩm nào mới có thể xóa.</span>
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteBrandOpen(false)}
                  className="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteBrand()}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Xóa thương hiệu
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {isAddSilOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-5">
              <h3 className="text-lg font-bold text-zinc-900">Thêm Dòng Sản Phẩm</h3>
              <button type="button" onClick={() => setIsAddSilOpen(false)} className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddSil} className="space-y-5 p-5">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Tên dòng sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={silForm.name}
                  onChange={(e) => setSilForm({ ...silForm, name: e.target.value })}
                  placeholder="Ví dụ: Air Max, Ultraboost..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100"
                />
              </div>

              <FileUploadArea
                preview={silImagePreview}
                onFileChange={handleSilImageChange}
                fileRef={silFileRef}
                label="Hình ảnh minh họa"
              />

              <div className="flex justify-end gap-3 border-t border-zinc-100 pt-3">
                <button type="button" onClick={() => setIsAddSilOpen(false)} className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submittingSil} className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50">
                  {submittingSil && <Loader2 className="h-4 w-4 animate-spin" />}
                  Lưu Dòng Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {isEditSilOpen && selectedSil && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-5">
              <h3 className="text-lg font-bold text-zinc-900">Sửa Dòng Sản Phẩm</h3>
              <button type="button" onClick={() => setIsEditSilOpen(false)} className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSil} className="space-y-5 p-5">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Tên dòng sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={silForm.name}
                  onChange={(e) => setSilForm({ ...silForm, name: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100"
                />
              </div>

              <FileUploadArea
                preview={silImagePreview}
                onFileChange={handleSilImageChange}
                fileRef={silFileRef}
                label="Hình ảnh minh họa"
              />

              <div className="flex justify-end gap-3 border-t border-zinc-100 pt-3">
                <button type="button" onClick={() => setIsEditSilOpen(false)} className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submittingSil} className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50">
                  {submittingSil && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {isDeleteSilOpen && selectedSil && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-zinc-900">Xóa Dòng Sản Phẩm</h3>
              <p className="mb-6 text-sm text-zinc-500">
                Bạn có chắc chắn muốn xóa dòng sản phẩm <span className="font-semibold text-zinc-800">{selectedSil.name}</span>?
                <br />
                <span className="mt-1 inline-block text-xs text-zinc-400">Nếu dòng sản phẩm đang gắn với sản phẩm trong cửa hàng, hệ thống sẽ từ chối xóa để bảo toàn dữ liệu.</span>
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteSilOpen(false)}
                  className="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteSil()}
                  disabled={submittingSil}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {submittingSil && <Loader2 className="h-4 w-4 animate-spin" />}
                  Xóa dòng sản phẩm
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

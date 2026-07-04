import {
  Plus, Search, Edit2, Trash2, X, AlertTriangle, ChevronDown, ChevronRight,
  Upload, ImageIcon, Loader2, RefreshCw, Layers
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AdminBrandService, type BrandResponse } from "../../services/admin/adminBrandService";
import { AdminSilhouetteService, type SilhouetteResponse } from "../../services/admin/adminSilhouetteService";
import toast from "react-hot-toast";

export default function AdminBrandsPage() {
  // Data
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Brand Modals
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isEditBrandOpen, setIsEditBrandOpen] = useState(false);
  const [isDeleteBrandOpen, setIsDeleteBrandOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Brand form
  const [brandForm, setBrandForm] = useState({ name: "", description: "" });
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);
  const brandFileRef = useRef<HTMLInputElement>(null);

  // Silhouette expand
  const [expandedBrandId, setExpandedBrandId] = useState<number | null>(null);
  const [silhouettes, setSilhouettes] = useState<SilhouetteResponse[]>([]);
  const [loadingSilhouettes, setLoadingSilhouettes] = useState(false);

  // Silhouette Modals
  const [isAddSilOpen, setIsAddSilOpen] = useState(false);
  const [isEditSilOpen, setIsEditSilOpen] = useState(false);
  const [isDeleteSilOpen, setIsDeleteSilOpen] = useState(false);
  const [selectedSil, setSelectedSil] = useState<SilhouetteResponse | null>(null);
  const [silForm, setSilForm] = useState({ name: "" });
  const [silImageFile, setSilImageFile] = useState<File | null>(null);
  const [silImagePreview, setSilImagePreview] = useState<string | null>(null);
  const [submittingSil, setSubmittingSil] = useState(false);
  const silFileRef = useRef<HTMLInputElement>(null);

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch brands
  const fetchBrands = async () => {
    setLoading(true);
    try {
      const data = await AdminBrandService.getBrands(debouncedQuery || undefined);
      setBrands(data);
    } catch (err) {
      toast.error("Không thể tải danh sách thương hiệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [debouncedQuery]);

  // Fetch silhouettes when brand row is expanded
  const fetchSilhouettes = async (brandId: number) => {
    setLoadingSilhouettes(true);
    try {
      const data = await AdminSilhouetteService.getByBrand(brandId);
      setSilhouettes(data);
    } catch {
      toast.error("Không thể tải dòng giày.");
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
      fetchSilhouettes(brandId);
    }
  };

  // --- Brand handlers ---
  const resetBrandForm = () => {
    setBrandForm({ name: "", description: "" });
    setBrandLogoFile(null);
    setBrandLogoPreview(null);
  };

  const handleBrandLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBrandLogoFile(file);
      setBrandLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await AdminBrandService.createBrand(brandForm.name, brandForm.description, brandLogoFile || undefined);
      toast.success("Thêm thương hiệu thành công!");
      setIsAddBrandOpen(false);
      resetBrandForm();
      fetchBrands();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi thêm thương hiệu.");
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

  const handleEditBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;
    setSubmitting(true);
    try {
      await AdminBrandService.updateBrand(selectedBrand.id, brandForm.name, brandForm.description, brandLogoFile || undefined);
      toast.success("Cập nhật thương hiệu thành công!");
      setIsEditBrandOpen(false);
      resetBrandForm();
      fetchBrands();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật.");
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
      fetchBrands();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi xóa.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Silhouette handlers ---
  const resetSilForm = () => {
    setSilForm({ name: "" });
    setSilImageFile(null);
    setSilImagePreview(null);
  };

  const handleSilImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSilImageFile(file);
      setSilImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddSil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedBrandId) return;
    setSubmittingSil(true);
    try {
      await AdminSilhouetteService.create(silForm.name, expandedBrandId, silImageFile || undefined);
      toast.success("Thêm dòng giày thành công!");
      setIsAddSilOpen(false);
      resetSilForm();
      fetchSilhouettes(expandedBrandId);
      fetchBrands(); // refresh count
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi thêm dòng giày.");
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

  const handleEditSil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSil || !expandedBrandId) return;
    setSubmittingSil(true);
    try {
      await AdminSilhouetteService.update(selectedSil.id, silForm.name, expandedBrandId, silImageFile || undefined);
      toast.success("Cập nhật dòng giày thành công!");
      setIsEditSilOpen(false);
      resetSilForm();
      fetchSilhouettes(expandedBrandId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật.");
    } finally {
      setSubmittingSil(false);
    }
  };

  const handleDeleteSil = async () => {
    if (!selectedSil || !expandedBrandId) return;
    setSubmittingSil(true);
    try {
      await AdminSilhouetteService.delete(selectedSil.id);
      toast.success("Đã xóa dòng giày!");
      setIsDeleteSilOpen(false);
      fetchSilhouettes(expandedBrandId);
      fetchBrands(); // refresh count
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi xóa.");
    } finally {
      setSubmittingSil(false);
    }
  };

  // --- File upload UI component ---
  const FileUploadArea = ({
    preview,
    onFileChange,
    fileRef,
    label,
  }: {
    preview: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileRef: React.RefObject<HTMLInputElement | null>;
    label: string;
  }) => (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">{label}</label>
      <div
        onClick={() => fileRef.current?.click()}
        className="relative group cursor-pointer border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl bg-zinc-50/50 hover:bg-zinc-50 transition-all overflow-hidden"
      >
        {preview ? (
          <div className="flex items-center justify-center p-4">
            <img src={preview} alt="Preview" className="max-h-32 max-w-full object-contain rounded-lg" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium bg-black/60 px-3 py-1.5 rounded-full">Đổi ảnh</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
            <Upload className="w-8 h-8 mb-2" />
            <span className="text-xs font-medium">Kéo thả hoặc click để chọn ảnh</span>
            <span className="text-[10px] text-zinc-300 mt-1">PNG, JPG, SVG • Tối đa 5MB</span>
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

  // --- RENDER ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Thương Hiệu & Dòng Giày</h1>
          <p className="text-sm text-zinc-500 mt-1">Quản lý thương hiệu và các dòng sản phẩm (Silhouette)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchBrands}
            className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { resetBrandForm(); setIsAddBrandOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm Thương Hiệu
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm">
        <div className="p-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thương hiệu..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all placeholder-zinc-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/80 text-zinc-500 border-y border-zinc-100">
              <tr>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider w-12"></th>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider">Logo</th>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider">Tên Hãng</th>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider">Mô tả</th>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider">Dòng giày</th>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-zinc-400" />
                    <p className="text-sm text-zinc-400 mt-2">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Layers className="w-10 h-10 mx-auto text-zinc-200 mb-3" />
                    <p className="text-sm text-zinc-500 font-medium">Chưa có thương hiệu nào</p>
                    <p className="text-xs text-zinc-400 mt-1">Hãy thêm thương hiệu đầu tiên của bạn!</p>
                  </td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <>
                    {/* Brand Row */}
                    <tr key={`brand-${brand.id}`} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleExpand(brand.id)}
                          className="p-1 text-zinc-400 hover:text-zinc-600 rounded transition-colors"
                        >
                          {expandedBrandId === brand.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 flex items-center justify-center bg-zinc-50 border border-zinc-100 rounded-xl overflow-hidden">
                          {brand.logoUrl ? (
                            <img src={brand.logoUrl} alt={brand.name} className="max-w-full max-h-full object-contain p-1.5" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-zinc-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-zinc-900 text-sm">{brand.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-zinc-500 text-xs line-clamp-2 max-w-xs">
                          {brand.description || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleExpand(brand.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-full transition-colors"
                        >
                          <Layers className="w-3 h-3" />
                          {brand.silhouettes?.length ?? 0} dòng
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditBrand(brand)}
                            className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Sửa thương hiệu"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setSelectedBrand(brand); setIsDeleteBrandOpen(true); }}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Xóa thương hiệu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Silhouette Section */}
                    {expandedBrandId === brand.id && (
                      <tr key={`sil-${brand.id}`}>
                        <td colSpan={6} className="p-0">
                          <div className="bg-zinc-50/70 border-t border-zinc-100 px-8 py-5">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5" />
                                Dòng giày của {brand.name}
                              </h3>
                              <button
                                onClick={() => { resetSilForm(); setIsAddSilOpen(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                Thêm dòng giày
                              </button>
                            </div>

                            {loadingSilhouettes ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                              </div>
                            ) : silhouettes.length === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-sm text-zinc-400">Chưa có dòng giày nào cho thương hiệu này.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {silhouettes.map((sil) => (
                                  <div
                                    key={sil.id}
                                    className="group/card bg-white border border-zinc-100 rounded-xl p-3 hover:shadow-md hover:border-zinc-200 transition-all"
                                  >
                                    <div className="aspect-[4/3] bg-zinc-50 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                                      {sil.imageUrl ? (
                                        <img src={sil.imageUrl} alt={sil.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <ImageIcon className="w-8 h-8 text-zinc-200" />
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-zinc-800 truncate">{sil.name}</span>
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => openEditSil(sil)}
                                          className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                          title="Sửa"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => { setSelectedSil(sil); setIsDeleteSilOpen(true); }}
                                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                          title="Xóa"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
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
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================== */}
      {/* MODALS                          */}
      {/* ============================== */}

      {/* --- Add Brand Modal --- */}
      {isAddBrandOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900">Thêm Thương Hiệu Mới</h3>
              <button onClick={() => setIsAddBrandOpen(false)} className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBrand} className="p-5 space-y-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Tên Thương Hiệu <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  placeholder="Ví dụ: ASICS"
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                />
              </div>

              <FileUploadArea
                preview={brandLogoPreview}
                onFileChange={handleBrandLogoChange}
                fileRef={brandFileRef}
                label="Logo thương hiệu"
              />

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Mô tả (Tùy chọn)
                </label>
                <textarea
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  rows={3}
                  placeholder="Nhập mô tả hoặc câu chuyện thương hiệu..."
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddBrandOpen(false)} className="px-4 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu Thương Hiệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Edit Brand Modal --- */}
      {isEditBrandOpen && selectedBrand && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900">Sửa Thương Hiệu</h3>
              <button onClick={() => setIsEditBrandOpen(false)} className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditBrand} className="p-5 space-y-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Tên Thương Hiệu <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                />
              </div>

              <FileUploadArea
                preview={brandLogoPreview}
                onFileChange={handleBrandLogoChange}
                fileRef={brandFileRef}
                label="Logo thương hiệu"
              />

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Mô tả (Tùy chọn)
                </label>
                <textarea
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditBrandOpen(false)} className="px-4 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Brand Modal --- */}
      {isDeleteBrandOpen && selectedBrand && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-4">
                <AlertTriangle className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Xóa Thương Hiệu</h3>
              <p className="text-sm text-zinc-500 mb-6">
                Bạn có chắc chắn muốn xóa thương hiệu <span className="font-semibold text-zinc-800">{selectedBrand.name}</span>?
                <br />
                <span className="text-xs text-zinc-400 mt-1 inline-block">Các dòng giày của thương hiệu này cũng sẽ bị ẩn.</span>
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsDeleteBrandOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDeleteBrand}
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xóa vĩnh viễn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Add Silhouette Modal --- */}
      {isAddSilOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900">Thêm Dòng Giày</h3>
              <button onClick={() => setIsAddSilOpen(false)} className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSil} className="p-5 space-y-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Tên dòng giày <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={silForm.name}
                  onChange={(e) => setSilForm({ ...silForm, name: e.target.value })}
                  placeholder="Ví dụ: Air Max, Ultraboost..."
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                />
              </div>

              <FileUploadArea
                preview={silImagePreview}
                onFileChange={handleSilImageChange}
                fileRef={silFileRef}
                label="Hình ảnh minh họa"
              />

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddSilOpen(false)} className="px-4 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submittingSil} className="px-5 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                  {submittingSil && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu Dòng Giày
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Edit Silhouette Modal --- */}
      {isEditSilOpen && selectedSil && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900">Sửa Dòng Giày</h3>
              <button onClick={() => setIsEditSilOpen(false)} className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSil} className="p-5 space-y-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Tên dòng giày <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={silForm.name}
                  onChange={(e) => setSilForm({ ...silForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                />
              </div>

              <FileUploadArea
                preview={silImagePreview}
                onFileChange={handleSilImageChange}
                fileRef={silFileRef}
                label="Hình ảnh minh họa"
              />

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditSilOpen(false)} className="px-4 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submittingSil} className="px-5 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                  {submittingSil && <Loader2 className="w-4 h-4 animate-spin" />}
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Silhouette Modal --- */}
      {isDeleteSilOpen && selectedSil && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-4">
                <AlertTriangle className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Xóa Dòng Giày</h3>
              <p className="text-sm text-zinc-500 mb-6">
                Bạn có chắc chắn muốn xóa dòng giày <span className="font-semibold text-zinc-800">{selectedSil.name}</span>?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsDeleteSilOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDeleteSil}
                  disabled={submittingSil}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingSil && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xóa vĩnh viễn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

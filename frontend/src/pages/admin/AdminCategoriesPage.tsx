import {
  Plus, Search, Edit2, Trash2, X, AlertTriangle, Loader2, RefreshCw, Layers
} from "lucide-react";
import { useState, useEffect } from "react";
import { AdminCategoryService, type AdminCategoryResponse } from "../../services/admin/adminCategoryService";
import { CategoryService } from "../../services/categoryService";
import toast from "react-hot-toast";

export default function AdminCategoriesPage() {
  // Data
  const [categories, setCategories] = useState<AdminCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategoryResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [form, setForm] = useState({ name: "", description: "", parentId: "" });

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Use existing public get categories or admin specific if needed.
      // CategoryService.getAllCategories() returns all.
      const data = await CategoryService.getAllCategories();
      setCategories(data);
    } catch (err) {
      toast.error("Không thể tải danh sách danh mục.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories by search
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
    c.slug.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  // --- Handlers ---
  const resetForm = () => {
    setForm({ name: "", description: "", parentId: "" });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await AdminCategoryService.createCategory({
        name: form.name,
        description: form.description,
        parentId: form.parentId ? Number(form.parentId) : null
      });
      toast.success("Thêm danh mục thành công!");
      setIsAddOpen(false);
      resetForm();
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi thêm danh mục.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (category: AdminCategoryResponse) => {
    setSelectedCategory(category);
    setForm({ 
      name: category.name, 
      description: category.description || "",
      parentId: category.parentId ? String(category.parentId) : "" 
    });
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      await AdminCategoryService.updateCategory(selectedCategory.id, {
        name: form.name,
        description: form.description,
        parentId: form.parentId ? Number(form.parentId) : null
      });
      toast.success("Cập nhật danh mục thành công!");
      setIsEditOpen(false);
      resetForm();
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      await AdminCategoryService.deleteCategory(selectedCategory.id);
      toast.success(`Đã xóa danh mục ${selectedCategory.name}`);
      setIsDeleteOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi xóa. (Có thể danh mục đang có danh mục con)");
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Danh Mục Sản Phẩm</h1>
          <p className="text-sm text-zinc-500 mt-1">Quản lý danh mục và phân cấp danh mục</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { resetForm(); setIsAddOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm Danh Mục
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
              placeholder="Tìm kiếm danh mục..."
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
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider w-16">ID</th>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider">Tên Danh Mục</th>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider">Danh Mục Cha</th>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider">Mô tả</th>
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
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Layers className="w-10 h-10 mx-auto text-zinc-200 mb-3" />
                    <p className="text-sm text-zinc-500 font-medium">Chưa có danh mục nào</p>
                    <p className="text-xs text-zinc-400 mt-1">Hãy thêm danh mục đầu tiên của bạn!</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={`cat-${category.id}`} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-zinc-500 text-xs font-mono">#{category.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-zinc-900 text-sm">{category.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-500 text-xs bg-zinc-100 px-2 py-1 rounded-md">{category.slug}</span>
                    </td>
                    <td className="px-6 py-4">
                      {category.parentName ? (
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                          {category.parentName}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-500 text-xs line-clamp-2 max-w-xs">
                        {category.description || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(category)}
                          className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Sửa danh mục"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedCategory(category); setIsDeleteOpen(true); }}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================== */}
      {/* MODALS                          */}
      {/* ============================== */}

      {/* --- Add / Edit Modal (Combined for simplicity) --- */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900">
                {isAddOpen ? "Thêm Danh Mục Mới" : "Sửa Danh Mục"}
              </h3>
              <button 
                onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} 
                className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={isAddOpen ? handleAdd : handleEdit} className="p-5 space-y-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Tên Danh Mục <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ví dụ: Giày Thể Thao"
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Danh Mục Cha
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                >
                  <option value="">-- Không có danh mục cha (Root) --</option>
                  {categories
                    // Không cho phép chọn chính nó làm cha
                    .filter(c => !isEditOpen || c.id !== selectedCategory?.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Mô tả (Tùy chọn)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Nhập mô tả danh mục..."
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} 
                  className="px-4 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="px-5 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isAddOpen ? "Lưu Danh Mục" : "Cập Nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {isDeleteOpen && selectedCategory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-4">
                <AlertTriangle className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Xóa Danh Mục</h3>
              <p className="text-sm text-zinc-500 mb-6">
                Bạn có chắc chắn muốn xóa danh mục <span className="font-semibold text-zinc-800">{selectedCategory.name}</span>?
                <br />
                <span className="text-xs text-zinc-400 mt-1 inline-block">Nếu danh mục này có danh mục con, hệ thống sẽ báo lỗi.</span>
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

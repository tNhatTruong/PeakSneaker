import {
  Plus, Search, Edit2, Trash2, X, AlertTriangle, Loader2, RefreshCw, Layers, Eye, EyeOff, Package,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { AdminCategoryService, type AdminCategoryResponse } from "../../services/admin/adminCategoryService";

type CategoryVisibilityFilter = "ALL" | "ACTIVE" | "HIDDEN";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== "object" || error === null || !("response" in error)) return fallback;
  const response = (error as { response?: { data?: { message?: unknown } } }).response;
  return typeof response?.data?.message === "string" ? response.data.message : fallback;
};

const getDescendantCategoryIds = (
  rootId: number,
  categories: AdminCategoryResponse[],
): Set<number> => {
  const descendants = new Set<number>();
  const queue: number[] = [rootId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const cat of categories) {
      if (cat.parentId === currentId && !descendants.has(cat.id)) {
        descendants.add(cat.id);
        queue.push(cat.id);
      }
    }
  }
  return descendants;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<CategoryVisibilityFilter>("ALL");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategoryResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<number | null>(null);

  const [form, setForm] = useState({ name: "", description: "", parentId: "" });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AdminCategoryService.getCategories();
      setCategories(data);
    } catch {
      toast.error("Không thể tải danh sách danh mục.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const counts = useMemo(() => ({
    ALL: categories.length,
    ACTIVE: categories.filter((c) => c.isActive).length,
    HIDDEN: categories.filter((c) => !c.isActive).length,
  }), [categories]);

  const childrenCountMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const cat of categories) {
      if (cat.parentId) {
        map[cat.parentId] = (map[cat.parentId] ?? 0) + 1;
      }
    }
    return map;
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    return categories.filter((c) => {
      if (visibilityFilter === "ACTIVE" && !c.isActive) return false;
      if (visibilityFilter === "HIDDEN" && c.isActive) return false;
      if (!query) return true;
      return (
        c.name.toLowerCase().includes(query) ||
        c.slug.toLowerCase().includes(query) ||
        (c.parentName?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [categories, debouncedQuery, visibilityFilter]);

  const forbiddenParentIds = useMemo(() => {
    if (!isEditOpen || !selectedCategory) return new Set<number>();
    const set = getDescendantCategoryIds(selectedCategory.id, categories);
    set.add(selectedCategory.id);
    return set;
  }, [categories, isEditOpen, selectedCategory]);

  const resetForm = () => {
    setForm({ name: "", description: "", parentId: "" });
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await AdminCategoryService.createCategory({
        name: form.name.trim(),
        description: form.description.trim(),
        parentId: form.parentId ? Number(form.parentId) : null,
      });
      toast.success("Thêm danh mục thành công!");
      setIsAddOpen(false);
      resetForm();
      await fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error, "Lỗi khi thêm danh mục."));
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (category: AdminCategoryResponse) => {
    setSelectedCategory(category);
    setForm({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId ? String(category.parentId) : "",
    });
    setIsEditOpen(true);
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      await AdminCategoryService.updateCategory(selectedCategory.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        parentId: form.parentId ? Number(form.parentId) : null,
      });
      toast.success("Cập nhật danh mục thành công!");
      setIsEditOpen(false);
      resetForm();
      await fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error, "Lỗi khi cập nhật."));
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
      await fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể xóa danh mục."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVisibility = async (category: AdminCategoryResponse) => {
    setUpdatingVisibilityId(category.id);
    try {
      const updated = await AdminCategoryService.updateVisibility(category.id, !category.isActive);
      setCategories((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(updated.isActive ? `Đã hiển thị danh mục ${updated.name}` : `Đã ẩn danh mục ${updated.name}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật trạng thái danh mục."));
    } finally {
      setUpdatingVisibilityId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Danh mục sản phẩm"
        description="Quản lý phân cấp danh mục, thống kê số lượng sản phẩm và trạng thái hiển thị."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchCategories()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); setIsAddOpen(true); }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Thêm danh mục
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
              placeholder="Tìm tên, slug hoặc danh mục cha..."
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
              ["ACTIVE", "Đang hiển thị", counts.ACTIVE],
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
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-zinc-500">
              <tr>
                <th className="w-16 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Tên Danh Mục</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Danh Mục Cha</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Sản phẩm</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Mô tả</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Hiển thị</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-400" />
                    <p className="mt-2 text-sm text-zinc-400">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Layers className="mx-auto mb-3 h-10 w-10 text-zinc-200" />
                    <p className="text-sm font-medium text-zinc-500">Không tìm thấy danh mục phù hợp</p>
                    <p className="mt-1 text-xs text-zinc-400">Thử thay đổi từ khóa hoặc bộ lọc trạng thái.</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => {
                  const productCount = category.productCount ?? 0;
                  const childCount = childrenCountMap[category.id] ?? 0;
                  const canDelete = productCount === 0 && childCount === 0;
                  return (
                    <tr key={`cat-${category.id}`} className={`group transition-colors hover:bg-zinc-50/50 ${category.isActive ? "" : "bg-zinc-50/70"}`}>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-zinc-500">#{category.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-zinc-900">{category.name}</span>
                        {childCount > 0 && (
                          <p className="mt-0.5 text-[11px] text-zinc-400">{childCount} danh mục con</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-500">{category.slug}</span>
                      </td>
                      <td className="px-6 py-4">
                        {category.parentName ? (
                          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                            {category.parentName}
                          </span>
                        ) : (
                          <span className="text-xs italic text-zinc-400">Gốc (Root)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                          <Package className="h-3.5 w-3.5 text-zinc-500" />
                          {productCount} SP
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="line-clamp-2 max-w-xs text-xs text-zinc-500">
                          {category.description || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={category.isActive}
                            aria-label={`${category.isActive ? "Ẩn" : "Hiện"} danh mục ${category.name}`}
                            disabled={updatingVisibilityId === category.id}
                            onClick={() => void handleVisibility(category)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 ${
                              category.isActive ? "bg-zinc-900" : "bg-zinc-300"
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                              category.isActive ? "translate-x-6" : "translate-x-1"
                            }`} />
                          </button>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            category.isActive ? "text-emerald-700" : "text-zinc-500"
                          }`}>
                            {category.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            {category.isActive ? "Đang hiện" : "Đang ẩn"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(category)}
                            className="rounded-lg p-2 text-zinc-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                            title="Sửa danh mục"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={!canDelete}
                            onClick={() => { setSelectedCategory(category); setIsDeleteOpen(true); }}
                            className="rounded-lg p-2 text-zinc-400 transition-all hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                            title={canDelete
                              ? "Xóa danh mục"
                              : `Không thể xóa danh mục đang có ${productCount} sản phẩm hoặc ${childCount} danh mục con (hãy dùng công tắc Hiển thị)`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(isAddOpen || isEditOpen) && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-5">
              <h3 className="text-lg font-bold text-zinc-900">
                {isAddOpen ? "Thêm Danh Mục Mới" : "Sửa Danh Mục"}
              </h3>
              <button
                type="button"
                onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={isAddOpen ? handleAdd : handleEdit} className="space-y-5 p-5">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Tên Danh Mục <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ví dụ: Giày Thể Thao"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Danh Mục Cha
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100"
                >
                  <option value="">-- Không có danh mục cha (Root) --</option>
                  {categories
                    .filter((c) => !forbiddenParentIds.has(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Mô tả (Tùy chọn)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Nhập mô tả danh mục..."
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
                  className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isAddOpen ? "Lưu Danh Mục" : "Cập Nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {isDeleteOpen && selectedCategory && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-zinc-900">Xóa Danh Mục</h3>
              <p className="mb-6 text-sm text-zinc-500">
                Bạn có chắc chắn muốn xóa danh mục <span className="font-semibold text-zinc-800">{selectedCategory.name}</span>?
                <br />
                <span className="mt-1 inline-block text-xs text-zinc-400">Chỉ các danh mục chưa có danh mục con và chưa gắn với sản phẩm nào mới có thể xóa.</span>
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Xóa
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

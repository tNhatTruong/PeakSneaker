import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ExternalLink,
  History,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminFilterHeader from '../../components/admin/AdminFilterHeader';
import { AdminDetailEmptyState, AdminDetailPanel } from '../../components/admin/AdminDetailPanel';
import { AdminBrandService, type BrandResponse as AdminBrandResponse } from '../../services/admin/adminBrandService';
import { AdminCategoryService } from '../../services/admin/adminCategoryService';
import { AdminBatchesService, type BatchItem } from '../../services/admin/adminBatchesService';
import {
  AdminInventoryService,
  type InventoryStockStatus,
  type InventoryTransactionResponse,
  type InventoryVariantResponse,
  type InventoryVariantSummaryResponse,
} from '../../services/admin/adminInventoryService';
import {
  AdminProductService,
  type AdminProductFilterOption,
} from '../../services/admin/adminProductService';
import type { CategoryResponse } from '../../services/categoryService';
import { ProductService, type ProductDetailResponse, type ProductResponse } from '../../services/productService';
import { SilhouetteService, type SilhouetteResponse } from '../../services/silhouetteService';

type TransactionType = 'IMPORT' | 'EXPORT';

interface InventoryFilters {
  brandId: string;
  categoryId: string;
  silhouetteId: string;
  stockStatus: '' | InventoryStockStatus;
}

const EMPTY_FILTERS: InventoryFilters = {
  brandId: '',
  categoryId: '',
  silhouetteId: '',
  stockStatus: '',
};

const EMPTY_SUMMARY: InventoryVariantSummaryResponse = {
  total: 0,
  inStock: 0,
  lowStock: 0,
  outOfStock: 0,
  inactive: 0,
};

const STANDARD_EU_SHOE_SIZES = Array.from({ length: 12 }, (_, index) => String(index + 35));
const NON_SHOE_SIZES = ['ONE SIZE', 'S', 'M', 'L', 'XL'];

const formatPrice = (price?: number | null) => (
  price != null ? price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '—'
);

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const getVariantStatus = (variant: InventoryVariantResponse) => {
  if (variant.productInactive) {
    return { label: 'Ngừng kinh doanh', className: 'border-violet-200 bg-violet-50 text-violet-700' };
  }
  if (variant.stock === 0) {
    return { label: 'Hết hàng', className: 'border-red-200 bg-red-50 text-red-700' };
  }
  if (variant.stock <= variant.safetyStockThreshold) {
    return { label: 'Sắp hết hàng', className: 'border-amber-200 bg-amber-50 text-amber-700' };
  }
  return { label: 'Còn nhiều', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
};

const normalizeFilters = (
  filters: InventoryFilters,
  options: AdminProductFilterOption[],
): InventoryFilters => {
  if (options.length === 0) return filters;
  const brandId = filters.brandId ? Number(filters.brandId) : null;
  const brandOptions = brandId == null ? options : options.filter((option) => option.brandId === brandId);
  const categoryIds = new Set(brandOptions.map((option) => option.categoryId));
  const categoryId = filters.categoryId && categoryIds.has(Number(filters.categoryId))
    ? filters.categoryId
    : brandId != null && categoryIds.size === 1
      ? String([...categoryIds][0])
      : '';
  const silhouetteIds = new Set(brandOptions
    .filter((option) => !categoryId || option.categoryId === Number(categoryId))
    .map((option) => option.silhouetteId)
    .filter((id): id is number => id != null));
  return {
    ...filters,
    categoryId,
    silhouetteId: filters.silhouetteId && silhouetteIds.has(Number(filters.silhouetteId))
      ? filters.silhouetteId
      : '',
  };
};

export default function AdminInventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedProductId = Number(searchParams.get('productId'));
  const requestedVariantId = Number(searchParams.get('variantId'));
  const [scopedProductId, setScopedProductId] = useState<number | undefined>(
    Number.isInteger(requestedProductId) && requestedProductId > 0 ? requestedProductId : undefined,
  );

  const [variants, setVariants] = useState<InventoryVariantResponse[]>([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [draftFilters, setDraftFilters] = useState<InventoryFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<InventoryFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState('createdAt-desc');
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [brands, setBrands] = useState<AdminBrandResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [silhouettes, setSilhouettes] = useState<SilhouetteResponse[]>([]);
  const [filterOptions, setFilterOptions] = useState<AdminProductFilterOption[]>([]);

  const [detailVariant, setDetailVariant] = useState<InventoryVariantResponse | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'stock' | 'batches' | 'history'>('info');
  const [detailTransactions, setDetailTransactions] = useState<InventoryTransactionResponse[]>([]);
  const [loadingDetailTransactions, setLoadingDetailTransactions] = useState(false);
  const [detailBatches, setDetailBatches] = useState<BatchItem[]>([]);
  const [loadingDetailBatches, setLoadingDetailBatches] = useState(false);
  const [thresholdInput, setThresholdInput] = useState<number>(5);
  const [savingThreshold, setSavingThreshold] = useState(false);

  const [showVariantModal, setShowVariantModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productList, setProductList] = useState<ProductResponse[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedProduct, setSelectedProduct] = useState<ProductDetailResponse | null>(null);
  const [variantForm, setVariantForm] = useState({ color: '', size: '', sku: '', priceAdjustment: 0 });
  const [variantError, setVariantError] = useState('');
  const [submittingVariant, setSubmittingVariant] = useState(false);

  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('IMPORT');
  const [transactionTarget, setTransactionTarget] = useState<InventoryVariantResponse | null>(null);
  const [txForm, setTxForm] = useState({
    quantity: 1,
    note: '',
    batchCode: '',
    supplierName: '',
    unitCost: 0,
  });
  const [txError, setTxError] = useState('');
  const [submittingTx, setSubmittingTx] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const hasOpenModal = Boolean(showVariantModal || showTxModal);
    if (!hasOpenModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (showTxModal) {
        setShowTxModal(false);
        setTransactionTarget(null);
        return;
      }
      if (showVariantModal) {
        setShowVariantModal(false);
        return;
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showTxModal, showVariantModal]);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await AdminInventoryService.getVariantSummary());
    } catch {
      setSummary(EMPTY_SUMMARY);
    }
  }, []);

  const loadVariants = useCallback(async () => {
    setLoading(true);
    try {
      const [sortBy, sortDirection] = sort.split('-');
      const result = await AdminInventoryService.getVariants({
        search: appliedSearch || undefined,
        productId: scopedProductId,
        brandId: appliedFilters.brandId ? Number(appliedFilters.brandId) : undefined,
        categoryId: appliedFilters.categoryId ? Number(appliedFilters.categoryId) : undefined,
        silhouetteId: appliedFilters.silhouetteId ? Number(appliedFilters.silhouetteId) : undefined,
        stockStatus: appliedFilters.stockStatus || undefined,
        page,
        size: pageSize,
        sortBy,
        sortDirection,
      });
      setVariants(result.items ?? []);
      setTotalPages(Math.max(result.totalPages ?? 1, 1));
      setTotalElements(result.totalElements ?? 0);
    } catch (error) {
      setVariants([]);
      showToast(getErrorMessage(error, 'Không thể tải danh sách biến thể kho.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, appliedSearch, page, pageSize, scopedProductId, showToast, sort]);

  useEffect(() => {
    Promise.all([
      AdminBrandService.getBrands(),
      AdminCategoryService.getCategories(),
      SilhouetteService.getAllSilhouettes(),
      AdminProductService.getFilterOptions(),
    ]).then(([brandData, categoryData, silhouetteData, optionData]) => {
      setBrands(brandData);
      setCategories(categoryData);
      setSilhouettes(silhouetteData);
      setFilterOptions(optionData);
    }).catch(() => showToast('Không thể tải metadata bộ lọc kho.', 'error'));
    loadSummary();
  }, [loadSummary, showToast]);

  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  useEffect(() => {
    if (filterOptions.length === 0) return;
    setDraftFilters((current) => normalizeFilters(current, filterOptions));
    setAppliedFilters((current) => normalizeFilters(current, filterOptions));
  }, [filterOptions]);

  useEffect(() => {
    if (!Number.isInteger(requestedVariantId) || requestedVariantId <= 0 || loading) return;
    const requested = variants.find((variant) => variant.id === requestedVariantId);
    if (requested) {
      setDetailVariant(requested);
      const requestedAction = searchParams.get('action');
      const suggestedQty = Number(searchParams.get('suggestedQty'));
      if (requestedAction === 'import' && !requested.productInactive) {
        const defaultSupplier = requested.brandName
          ? `${requested.brandName} Official Distribution`
          : 'Nhà phân phối chính hãng';
        const defaultCost = Math.max(1000, Math.round((requested.finalPrice * 0.65) / 1000) * 1000);
        setTransactionTarget(requested);
        setTxType('IMPORT');
        setTxForm({
          quantity: Number.isInteger(suggestedQty) && suggestedQty > 0 ? suggestedQty : Math.max(5, requested.safetyStockThreshold),
          note: 'Nhập bổ sung theo cảnh báo Dự báo tồn kho',
          batchCode: '',
          supplierName: defaultSupplier,
          unitCost: defaultCost,
        });
        setTxError('');
        setShowTxModal(true);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('action');
        nextParams.delete('suggestedQty');
        setSearchParams(nextParams, { replace: true });
      }
    }
  }, [loading, requestedVariantId, searchParams, setSearchParams, variants]);

  const loadDetailTransactions = useCallback((variantId: number) => {
    setLoadingDetailTransactions(true);
    return AdminInventoryService.getTransactions({ variantId, page: 0, size: 8 })
      .then((result) => setDetailTransactions(result.items ?? []))
      .catch(() => setDetailTransactions([]))
      .finally(() => setLoadingDetailTransactions(false));
  }, []);

  const loadDetailBatches = useCallback((variantId: number) => {
    setLoadingDetailBatches(true);
    return AdminBatchesService.getBatches({ variantId, page: 0, size: 10 })
      .then((result) => setDetailBatches(result.items ?? []))
      .catch(() => setDetailBatches([]))
      .finally(() => setLoadingDetailBatches(false));
  }, []);

  const detailVariantId = detailVariant?.id;
  const detailVariantThreshold = detailVariant?.safetyStockThreshold;

  useEffect(() => {
    if (!detailVariantId) {
      setDetailTransactions([]);
      setDetailBatches([]);
      return;
    }
    setDetailTab('info');
    void loadDetailTransactions(detailVariantId);
    void loadDetailBatches(detailVariantId);
  }, [detailVariantId, loadDetailBatches, loadDetailTransactions]);

  useEffect(() => {
    if (detailVariantThreshold != null) {
      setThresholdInput(detailVariantThreshold);
    }
  }, [detailVariantId, detailVariantThreshold]);

  useEffect(() => {
    if (!showVariantModal) return;
    const timer = window.setTimeout(() => {
      setLoadingProducts(true);
      AdminProductService.getAdminProducts({ search: productSearch.trim() || undefined, size: 100 })
        .then((result) => setProductList((result.items ?? []).filter((product) => !product.isDeleted)))
        .catch(() => setProductList([]))
        .finally(() => setLoadingProducts(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [productSearch, showVariantModal]);

  useEffect(() => {
    if (!selectedProductId) {
      setSelectedProduct(null);
      return;
    }
    ProductService.getProductById(Number(selectedProductId))
      .then(setSelectedProduct)
      .catch(() => setSelectedProduct(null));
  }, [selectedProductId]);

  const availableCategories = draftFilters.brandId
    ? categories.filter((category) => filterOptions.some((option) => (
      option.brandId === Number(draftFilters.brandId) && option.categoryId === category.id
    )))
    : categories;
  const availableBrands = draftFilters.categoryId
    ? brands.filter((brand) => filterOptions.some((option) => (
      option.categoryId === Number(draftFilters.categoryId) && option.brandId === brand.id
    )))
    : brands;
  const compatibleSilhouetteIds = new Set(filterOptions
    .filter((option) => !draftFilters.brandId || option.brandId === Number(draftFilters.brandId))
    .filter((option) => !draftFilters.categoryId || option.categoryId === Number(draftFilters.categoryId))
    .map((option) => option.silhouetteId)
    .filter((id): id is number => id != null));
  const availableSilhouettes = silhouettes.filter((silhouette) => compatibleSilhouetteIds.has(silhouette.id));
  const variantSizeOptions = selectedProduct?.productType === 'SNEAKER'
    ? STANDARD_EU_SHOE_SIZES
    : NON_SHOE_SIZES;

  const statusTabs = useMemo(() => [
    { value: '', label: 'Tất cả', count: summary.total },
    { value: 'IN_STOCK', label: 'Còn nhiều', count: summary.inStock },
    { value: 'LOW_STOCK', label: 'Sắp hết hàng', count: summary.lowStock },
    { value: 'OUT_OF_STOCK', label: 'Hết hàng', count: summary.outOfStock },
    { value: 'INACTIVE', label: 'Ngừng kinh doanh', count: summary.inactive },
  ] as const, [summary]);

  const recentMovement = useMemo(() => detailTransactions.reduce(
    (totals, transaction) => ({
      imported: totals.imported + (transaction.type === 'IMPORT' ? transaction.quantity : 0),
      exported: totals.exported + (transaction.type === 'EXPORT' ? transaction.quantity : 0),
    }),
    { imported: 0, exported: 0 },
  ), [detailTransactions]);

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length
    + (appliedSearch ? 1 : 0)
    + (scopedProductId ? 1 : 0);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeFilters(draftFilters, filterOptions);
    setDraftFilters(normalized);
    setAppliedFilters(normalized);
    setAppliedSearch(search.trim());
    setPage(0);
  };

  const clearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setScopedProductId(undefined);
    setPage(0);
    setSearchParams(new URLSearchParams());
  };

  const updateBrand = (brandId: string) => {
    setDraftFilters((current) => normalizeFilters({ ...current, brandId, silhouetteId: '' }, filterOptions));
  };

  const updateCategory = (categoryId: string) => {
    setDraftFilters((current) => {
      const compatible = !current.brandId || !categoryId || filterOptions.some((option) => (
        option.brandId === Number(current.brandId) && option.categoryId === Number(categoryId)
      ));
      return normalizeFilters({
        ...current,
        brandId: compatible ? current.brandId : '',
        categoryId,
        silhouetteId: '',
      }, filterOptions);
    });
  };

  const selectStatus = (stockStatus: '' | InventoryStockStatus) => {
    setDraftFilters((current) => ({ ...current, stockStatus }));
    setAppliedFilters((current) => ({ ...current, stockStatus }));
    setPage(0);
  };

  const generateSuggestedBatchCode = (variant: InventoryVariantResponse) => {
    const skuClean = variant.sku.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = String(Math.floor(10 + Math.random() * 89));
    return `BATCH-${skuClean}-${today}-${suffix}`;
  };

  const openTransaction = (type: TransactionType, variant: InventoryVariantResponse, suggestedQuantity?: number) => {
    const latestBatch = detailVariant?.id === variant.id && detailBatches.length > 0 ? detailBatches[0] : null;
    const defaultSupplier = latestBatch?.supplierName
      || (variant.brandName ? `${variant.brandName} Official Distribution` : 'Nhà phân phối chính hãng');
    const defaultCost = latestBatch?.unitCost
      || Math.max(1000, Math.round((variant.finalPrice * 0.65) / 1000) * 1000);
    setTransactionTarget(variant);
    setTxType(type);
    setTxForm({
      quantity: suggestedQuantity && suggestedQuantity > 0 ? suggestedQuantity : (type === 'IMPORT' ? Math.max(5, variant.safetyStockThreshold) : 1),
      note: '',
      batchCode: '',
      supplierName: defaultSupplier,
      unitCost: defaultCost,
    });
    setTxError('');
    setShowTxModal(true);
  };

  const handleCreateTransaction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!transactionTarget) return;
    if (txForm.quantity <= 0) {
      setTxError('Số lượng giao dịch phải lớn hơn 0.');
      return;
    }
    if (txType === 'EXPORT' && transactionTarget.stock < txForm.quantity) {
      setTxError(`Không đủ tồn kho để xuất. Tồn kho hiện tại: ${transactionTarget.stock}.`);
      return;
    }
    setSubmittingTx(true);
    try {
      await AdminInventoryService.createTransaction({
        variantId: transactionTarget.id,
        quantity: txForm.quantity,
        type: txType,
        note: txForm.note.trim() || undefined,
        batchCode: txType === 'IMPORT' && txForm.batchCode.trim() ? txForm.batchCode.trim() : undefined,
        supplierName: txType === 'IMPORT' && txForm.supplierName.trim() ? txForm.supplierName.trim() : undefined,
        unitCost: txType === 'IMPORT' && txForm.unitCost > 0 ? txForm.unitCost : undefined,
      });
      const delta = txType === 'IMPORT' ? txForm.quantity : -txForm.quantity;
      setDetailVariant((current) => (
        current && current.id === transactionTarget.id
          ? { ...current, stock: Math.max(0, current.stock + delta) }
          : current
      ));
      setShowTxModal(false);
      showToast(`${txType === 'IMPORT' ? 'Nhập lô hàng vào' : 'Xuất'} kho thành công.`, 'success');
      await Promise.all([
        loadVariants(),
        loadSummary(),
        detailVariant?.id === transactionTarget.id
          ? Promise.all([loadDetailTransactions(transactionTarget.id), loadDetailBatches(transactionTarget.id)])
          : Promise.resolve(),
      ]);
    } catch (error) {
      setTxError(getErrorMessage(error, 'Không thể thực hiện giao dịch kho.'));
    } finally {
      setSubmittingTx(false);
    }
  };

  const handleUpdateThreshold = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detailVariant) return;
    const normalized = Math.max(0, Math.floor(Number(thresholdInput)));
    if (normalized === detailVariant.safetyStockThreshold) return;
    setSavingThreshold(true);
    try {
      const updated = await AdminInventoryService.updateSafetyStockThreshold(detailVariant.id, normalized);
      setDetailVariant(updated);
      setVariants((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      showToast('Đã cập nhật ngưỡng tồn kho an toàn.', 'success');
      await loadSummary();
    } catch (error) {
      showToast(getErrorMessage(error, 'Không thể cập nhật ngưỡng an toàn.'), 'error');
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleCreateVariant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProductId) {
      setVariantError('Vui lòng chọn sản phẩm.');
      return;
    }
    if (!variantForm.sku.trim() || !variantForm.color.trim() || !variantForm.size) {
      setVariantError('Vui lòng nhập đầy đủ SKU, màu sắc và kích thước.');
      return;
    }
    setSubmittingVariant(true);
    setVariantError('');
    try {
      await AdminInventoryService.createVariant(Number(selectedProductId), {
        sku: variantForm.sku.trim(),
        color: variantForm.color.trim(),
        size: variantForm.size,
        priceAdjustment: variantForm.priceAdjustment,
      });
      setShowVariantModal(false);
      setVariantForm({ color: '', size: '', sku: '', priceAdjustment: 0 });
      setSelectedProductId('');
      setSelectedProduct(null);
      showToast('Tạo biến thể mới thành công.', 'success');
      await Promise.all([loadVariants(), loadSummary()]);
    } catch (error) {
      setVariantError(getErrorMessage(error, 'Không thể tạo biến thể mới.'));
    } finally {
      setSubmittingVariant(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      {toast && (
        <div className={`fixed right-4 top-4 z-[70] flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <AdminPageHeader
        title="Tồn kho & Biến thể"
        description="Quản lý hiện trạng tồn kho 3 tầng theo SKU (On-hand, Reserved, Available), hạn mức an toàn và phiếu điều chỉnh kho."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void loadVariants();
                void loadSummary();
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
            </button>
            <button
              type="button"
              onClick={() => {
                setVariantError('');
                setShowVariantModal(true);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Thêm biến thể
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
            <form onSubmit={applyFilters} className="space-y-3 p-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Tìm biến thể</span>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm SKU, tên sản phẩm hoặc thương hiệu..." className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100" />
                </label>
                <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800">
                  <Search className="h-4 w-4" /> Áp dụng
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">Thương hiệu</span>
                  <select value={draftFilters.brandId} onChange={(event) => updateBrand(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400">
                    <option value="">Tất cả</option>
                    {availableBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">Danh mục</span>
                  <select value={draftFilters.categoryId} onChange={(event) => updateCategory(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400">
                    <option value="">Tất cả</option>
                    {availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">Dòng sản phẩm</span>
                  <select disabled={availableSilhouettes.length === 0} value={draftFilters.silhouetteId} onChange={(event) => setDraftFilters((current) => ({ ...current, silhouetteId: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400">
                    <option value="">{availableSilhouettes.length === 0 ? 'Không áp dụng' : 'Tất cả'}</option>
                    {availableSilhouettes.map((silhouette) => <option key={silhouette.id} value={silhouette.id}>{silhouette.name}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">Tình trạng kho</span>
                  <select value={draftFilters.stockStatus} onChange={(event) => setDraftFilters((current) => ({ ...current, stockStatus: event.target.value as InventoryFilters['stockStatus'] }))} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400">
                    <option value="">Tất cả</option>
                    <option value="IN_STOCK">Còn nhiều</option>
                    <option value="LOW_STOCK">Sắp hết hàng</option>
                    <option value="OUT_OF_STOCK">Hết hàng</option>
                    <option value="INACTIVE">Ngừng kinh doanh</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500">Sắp xếp</span>
                  <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(0); }} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400">
                    <option value="createdAt-desc">Mới nhất</option>
                    <option value="stockQuantity-asc">Tồn kho tăng dần</option>
                    <option value="stockQuantity-desc">Tồn kho giảm dần</option>
                    <option value="sku-asc">SKU A–Z</option>
                  </select>
                </label>
              </div>
            </form>
          )}
        </section>
      </div>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto border-b border-slate-200 px-4 pb-1 pt-3 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-slate-100">
          <div className="flex min-w-max gap-1">
            {statusTabs.map((tab) => (
              <button key={tab.value || 'all'} type="button" onClick={() => selectStatus(tab.value)} className={`rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-black transition ${appliedFilters.stockStatus === tab.value ? 'border-slate-950 bg-slate-950 text-white' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                {tab.label} <span className={`ml-1 ${appliedFilters.stockStatus === tab.value ? 'text-slate-300' : 'text-slate-400'}`}>({tab.count.toLocaleString('vi-VN')})</span>
              </button>
            ))}
          </div>
        </div>

        <header className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <div>
              <h2 className="text-sm font-black text-slate-950">Danh sách biến thể</h2>
              <p className="mt-0.5 text-xs text-slate-500">{totalElements.toLocaleString('vi-VN')} SKU phù hợp bộ lọc</p>
            </div>
            {scopedProductId && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                Đang lọc theo Sản phẩm #{scopedProductId}
                <button
                  type="button"
                  onClick={() => {
                    setScopedProductId(undefined);
                    setPage(0);
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.delete('productId');
                    nextParams.delete('variantId');
                    setSearchParams(nextParams, { replace: true });
                  }}
                  className="rounded-full p-0.5 text-blue-600 hover:bg-blue-100 hover:text-blue-900"
                  aria-label="Bỏ lọc theo sản phẩm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
          </div>
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none">
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </header>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[820px] table-fixed text-left text-xs">
            <colgroup>
              <col className="w-[14%]" /><col className="w-[23%]" /><col className="w-[9%]" />
              <col className="w-[10%]" /><col className="w-[11%]" /><col className="w-[11%]" />
              <col className="w-[8%]" /><col className="w-[14%]" />
            </colgroup>
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">SKU</th><th className="px-3 py-3">Sản phẩm</th><th className="px-3 py-3">Thương hiệu</th>
                <th className="px-3 py-3">Danh mục</th><th className="px-3 py-3">Dòng sản phẩm</th><th className="px-3 py-3">Thuộc tính</th>
                <th className="px-3 py-3 text-right">Tồn kho</th><th className="px-3 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-3 py-16 text-center text-sm text-slate-500"><Loader2 className="mr-2 inline h-5 w-5 animate-spin" />Đang tải biến thể...</td></tr>
              ) : variants.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-16 text-center"><Search className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-bold text-slate-700">Không tìm thấy biến thể phù hợp</p><p className="mt-1 text-xs text-slate-400">Hãy điều chỉnh từ khóa hoặc đặt lại bộ lọc.</p></td></tr>
              ) : variants.map((variant) => {
                const status = getVariantStatus(variant);
                return (
                  <tr key={variant.id} onClick={() => setDetailVariant(variant)} className={`cursor-pointer transition hover:bg-blue-50/40 ${detailVariant?.id === variant.id ? 'bg-blue-50/60' : ''}`}>
                    <td className="px-3 py-3 font-mono text-xs font-bold text-blue-600">{variant.sku}</td>
                    <td className="px-3 py-3"><div className="flex min-w-0 items-center gap-2.5"><div className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">{variant.productImageUrl ? <img src={variant.productImageUrl} alt="" className="h-full w-full object-contain p-1" /> : <ImageIcon className="h-5 w-5 text-slate-300" />}</div><div className="min-w-0"><p className="truncate font-bold text-slate-900">{variant.productName}</p><p className="truncate text-xs text-slate-400">#{variant.productId}</p></div></div></td>
                    <td className="truncate px-3 py-3 text-slate-600">{variant.brandName ?? '—'}</td>
                    <td className="truncate px-3 py-3 text-slate-600">{variant.categoryName ?? '—'}</td>
                    <td className="truncate px-3 py-3 text-slate-600">{variant.silhouetteName ?? 'Không áp dụng'}</td>
                    <td className="px-3 py-3 text-slate-700"><span className="font-semibold">{variant.color}</span><span className="text-slate-400"> / {variant.size}</span></td>
                    <td className={`px-3 py-3 text-right font-black ${variant.stock === 0 ? 'text-red-600' : variant.stock <= variant.safetyStockThreshold ? 'text-amber-600' : 'text-emerald-600'}`}>{variant.stock}</td>
                    <td className="px-3 py-3"><span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-black ${status.className}`}>{status.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 lg:hidden">
          {loading ? <div className="py-14 text-center text-sm text-slate-500"><Loader2 className="mr-2 inline h-5 w-5 animate-spin" />Đang tải biến thể...</div> : variants.map((variant) => {
            const status = getVariantStatus(variant);
            return (
              <button key={variant.id} type="button" onClick={() => setDetailVariant(variant)} className="flex w-full gap-3 p-4 text-left hover:bg-slate-50">
                <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">{variant.productImageUrl ? <img src={variant.productImageUrl} alt="" className="h-full w-full object-contain p-1" /> : <ImageIcon className="h-5 w-5 text-slate-300" />}</div>
                <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-bold text-slate-900">{variant.productName}</p><p className="mt-1 font-mono text-xs font-bold text-blue-600">{variant.sku}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${status.className}`}>{status.label}</span></div><p className="mt-2 text-xs text-slate-500">{variant.color} / {variant.size} · {variant.brandName ?? '—'}</p><p className="mt-1 text-xs font-black text-slate-700">Tồn kho: <span className="text-slate-950">{variant.stock}</span> · Ngưỡng: {variant.safetyStockThreshold}</p></div>
              </button>
            );
          })}
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          visibleCount={variants.length}
          itemLabel="biến thể"
          disabled={loading}
          onPageChange={setPage}
        />
      </section>
      </div>
      {detailVariant ? (
        <AdminDetailPanel ariaLabel={`Chi tiết biến thể ${detailVariant.sku}`} className="flex flex-col">
          <section aria-labelledby="variant-detail-title" className="flex min-h-0 flex-1 flex-col">
            <header className="flex h-11 items-center justify-between border-b border-slate-200 px-4"><h2 id="variant-detail-title" className="text-sm font-black text-slate-950">Chi tiết biến thể & lô</h2><button type="button" onClick={() => setDetailVariant(null)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Đóng"><X className="h-4 w-4" /></button></header>
            <nav className="grid grid-cols-4 border-b border-slate-200 bg-slate-50/60 px-2">
              {([
                ['info', 'Thông tin'],
                ['stock', 'Tồn kho'],
                ['batches', `Lô (${detailBatches.length})`],
                ['history', `Lịch sử (${detailTransactions.length})`],
              ] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setDetailTab(value)} title={label} className={`min-w-0 truncate whitespace-nowrap border-b-2 px-1 py-2.5 text-[10px] font-bold ${detailTab === value ? 'border-slate-950 text-slate-950' : 'border-transparent text-slate-500'}`}>
                  {label}
                </button>
              ))}
            </nav>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {detailTab === 'info' && (
                <div className="grid gap-4">
                  <div>
                    <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      {detailVariant.productImageUrl ? <img src={detailVariant.productImageUrl} alt={detailVariant.productName} className="h-full w-full object-contain p-3" /> : <ImageIcon className="h-10 w-10 text-slate-300" />}
                    </div>
                    <h3 className="mt-3 text-base font-black leading-6 text-slate-950">{detailVariant.productName}</h3>
                    <a href={`/products/${detailVariant.productId}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      Xem sản phẩm <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="max-w-full truncate rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-black text-slate-700">{detailVariant.sku}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${getVariantStatus(detailVariant).className}`}>{getVariantStatus(detailVariant).label}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-4 text-sm">
                      {[
                        ['Thương hiệu', detailVariant.brandName ?? '—'],
                        ['Danh mục', detailVariant.categoryName ?? '—'],
                        ['Dòng sản phẩm', detailVariant.silhouetteName ?? 'Không áp dụng'],
                        ['Màu sắc', detailVariant.color],
                        ['Kích thước', detailVariant.size],
                        ['Giá bán', formatPrice(detailVariant.finalPrice)],
                        ['Chênh lệch giá', formatPrice(detailVariant.priceAdjustment)],
                        ['Ngày tạo', new Date(detailVariant.createdAt).toLocaleDateString('vi-VN')],
                      ].map(([label, value]) => <div key={label} className="min-w-0"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 break-words font-bold leading-5 text-slate-900">{value}</p></div>)}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'stock' && (
                <div className="space-y-4">
                  <header className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                      {detailVariant.productImageUrl ? <img src={detailVariant.productImageUrl} alt="" className="h-full w-full object-contain p-1.5" /> : <ImageIcon className="h-6 w-6 text-slate-300" />}
                    </div>
                    <div className="min-w-0"><p className="truncate text-sm font-black text-slate-950">{detailVariant.productName}</p><p className="mt-1 truncate font-mono text-[11px] font-bold text-blue-600">{detailVariant.sku}</p><p className="mt-1 truncate text-xs text-slate-500">{detailVariant.color} / {detailVariant.size}</p></div>
                  </header>

                  <div className="grid grid-cols-2 gap-2">
                    <article className="rounded-xl border border-slate-200 p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tồn hiện tại</p><p className={`mt-2 text-2xl font-black ${detailVariant.stock === 0 ? 'text-red-600' : 'text-slate-950'}`}>{detailVariant.stock}</p><p className="mt-1 text-xs text-slate-500">sản phẩm</p></article>
                    <form onSubmit={handleUpdateThreshold} className="rounded-xl border border-slate-200 p-3">
                      <label htmlFor="safety-stock-threshold" className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Ngưỡng an toàn</label>
                      <div className="mt-2 flex items-center gap-1.5">
                        <input
                          id="safety-stock-threshold"
                          type="number"
                          min={0}
                          value={thresholdInput}
                          onChange={(event) => setThresholdInput(Math.max(0, Number(event.target.value)))}
                          className="h-8 w-full min-w-0 rounded-lg border border-slate-200 px-2 text-lg font-black text-slate-950 outline-none focus:border-slate-400"
                        />
                        {thresholdInput !== detailVariant.safetyStockThreshold && (
                          <button
                            type="submit"
                            disabled={savingThreshold}
                            className="h-8 shrink-0 rounded-lg bg-slate-950 px-2.5 text-[11px] font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                          >
                            {savingThreshold ? '...' : 'Lưu'}
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">cảnh báo sắp hết</p>
                    </form>
                  </div>

                  <section className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-slate-500">Tình trạng tồn kho</p><p className="mt-1 text-sm font-black text-slate-950">{getVariantStatus(detailVariant).label}</p></div><span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${getVariantStatus(detailVariant).className}`}>{detailVariant.stock - detailVariant.safetyStockThreshold >= 0 ? `+${detailVariant.stock - detailVariant.safetyStockThreshold}` : detailVariant.stock - detailVariant.safetyStockThreshold}</span></div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${detailVariant.stock === 0 ? 'bg-red-500' : detailVariant.stock <= detailVariant.safetyStockThreshold ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, detailVariant.safetyStockThreshold > 0 ? (detailVariant.stock / (detailVariant.safetyStockThreshold * 2)) * 100 : 100)}%` }} /></div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{detailVariant.productInactive ? 'Sản phẩm đang ngừng kinh doanh; không thể thực hiện nhập hoặc xuất kho.' : detailVariant.stock === 0 ? 'Biến thể đã hết hàng và cần được nhập bổ sung.' : detailVariant.stock <= detailVariant.safetyStockThreshold ? `Tồn kho đang bằng hoặc thấp hơn ngưỡng an toàn; nên nhập thêm ít nhất ${detailVariant.safetyStockThreshold * 2 - detailVariant.stock} sản phẩm.` : `Tồn kho đang cao hơn ngưỡng an toàn ${detailVariant.stock - detailVariant.safetyStockThreshold} sản phẩm.`}</p>
                  </section>

                  <section className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2"><History className="h-4 w-4 text-slate-500" /><h3 className="text-sm font-black text-slate-900">Biến động gần nhất</h3></div>
                    {loadingDetailTransactions ? <div className="py-8 text-center text-xs text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Đang tải dữ liệu...</div> : <><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-lg bg-emerald-50 p-3"><p className="text-[11px] font-bold text-emerald-700">Đã nhập</p><p className="mt-1 text-lg font-black text-emerald-800">+{recentMovement.imported}</p></div><div className="rounded-lg bg-red-50 p-3"><p className="text-[11px] font-bold text-red-700">Đã xuất</p><p className="mt-1 text-lg font-black text-red-800">-{recentMovement.exported}</p></div></div><p className="mt-2 text-[11px] leading-4 text-slate-400">Tổng hợp từ {detailTransactions.length} giao dịch gần nhất được tải.</p></>}
                  </section>
                </div>
              )}

              {detailTab === 'batches' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Quản lý lô FIFO</p>
                      <p className="mt-0.5 text-xs font-bold text-slate-800">{detailBatches.length} lô nhập của SKU này</p>
                    </div>
                    <button
                      type="button"
                      disabled={detailVariant.productInactive}
                      onClick={() => openTransaction('IMPORT', detailVariant)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-950 px-2.5 text-[11px] font-bold text-white hover:bg-slate-800 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" /> Nhập lô mới
                    </button>
                  </div>

                  {loadingDetailBatches ? (
                    <div className="py-10 text-center text-sm text-slate-500">
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Đang tải danh sách lô...
                    </div>
                  ) : detailBatches.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                      <Boxes className="mx-auto h-7 w-7 text-slate-300" />
                      <p className="mt-2 text-xs font-bold text-slate-700">Chưa có chứng từ lô hàng</p>
                      <p className="mt-1 text-[11px] text-slate-400">Các lần nhập kho tiếp theo sẽ tự động ghi nhận mã lô và giá vốn tại đây.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {detailBatches.map((batch) => {
                        const ratio = batch.quantityImported > 0
                          ? Math.min(100, Math.round((batch.quantityRemaining / batch.quantityImported) * 100))
                          : 0;
                        return (
                          <article key={batch.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                            <div className="flex items-start justify-between gap-2">
                              <span className="truncate rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-black text-slate-800">
                                {batch.batchCode}
                              </span>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                                batch.quantityRemaining > 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                Còn {batch.quantityRemaining}/{batch.quantityImported}
                              </span>
                            </div>
                            <p className="mt-2 truncate text-xs font-bold text-slate-800">{batch.supplierName}</p>
                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                              <span>Giá vốn: <strong className="text-slate-900">{formatPrice(batch.unitCost)}</strong></span>
                              <span>{new Date(batch.receivedDate).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${batch.quantityRemaining > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'history' && (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3"><History className="h-4 w-4 text-slate-500" /><h3 className="text-sm font-black text-slate-900">Lịch sử giao dịch kho</h3></div>
                  {loadingDetailTransactions ? <div className="py-10 text-center text-sm text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Đang tải lịch sử...</div> : detailTransactions.length === 0 ? <div className="py-10 text-center text-sm text-slate-400">Chưa có giao dịch kho cho biến thể này.</div> : <div className="divide-y divide-slate-100">{detailTransactions.map((transaction) => <article key={transaction.id} className="p-3"><div className="flex items-center justify-between gap-3"><span className={`rounded-full px-2 py-1 text-[11px] font-black ${transaction.type === 'IMPORT' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{transaction.type === 'IMPORT' ? 'Nhập kho' : 'Xuất kho'}</span><strong className={transaction.type === 'IMPORT' ? 'text-emerald-700' : 'text-red-700'}>{transaction.type === 'IMPORT' ? '+' : '-'}{transaction.quantity}</strong></div><p className="mt-2 text-xs leading-5 text-slate-600">{transaction.note || 'Không có ghi chú'}</p><time className="mt-1 block text-[11px] text-slate-400">{new Date(transaction.createdAt).toLocaleString('vi-VN')}</time></article>)}</div>}
                </div>
              )}
            </div>
            <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 bg-white p-3"><button type="button" disabled={detailVariant.productInactive} onClick={() => openTransaction('EXPORT', detailVariant)} className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-red-200 px-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-40"><ArrowDownLeft className="h-4 w-4 shrink-0" /> Xuất kho</button><button type="button" disabled={detailVariant.productInactive} onClick={() => openTransaction('IMPORT', detailVariant)} className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-950 px-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40"><ArrowUpRight className="h-4 w-4 shrink-0" /> Nhập lô / Kho</button></footer>
          </section>
        </AdminDetailPanel>
      ) : (
        <AdminDetailPanel ariaLabel="Chưa chọn biến thể">
          <AdminDetailEmptyState
            icon={<ImageIcon className="h-9 w-9" />}
            title="Chưa chọn biến thể"
            description="Chọn một biến thể trong danh sách để xem tồn kho, lô hàng FIFO và lịch sử giao dịch."
            items={["Thuộc tính và giá bán", "Tồn kho và ngưỡng an toàn", "Chứng từ lô nhập & giá vốn FIFO"]}
          />
        </AdminDetailPanel>
      )}
      </div>

      {showVariantModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><p className="text-xs font-black uppercase tracking-wide text-slate-400">Catalog</p><h2 className="mt-1 text-lg font-black text-slate-950">Thêm biến thể mới</h2></div><button type="button" onClick={() => setShowVariantModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></header><form onSubmit={handleCreateVariant} className="space-y-4 p-5">{variantError && <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{variantError}</div>}<label className="block space-y-1.5"><span className="text-xs font-bold text-slate-600">Tìm sản phẩm</span><input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Tên sản phẩm hoặc SKU..." className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" /></label><label className="block space-y-1.5"><span className="text-xs font-bold text-slate-600">Sản phẩm *</span><div className="relative"><select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value ? Number(event.target.value) : '')} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"><option value="">Chọn sản phẩm</option>{productList.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>{loadingProducts && <Loader2 className="absolute right-9 top-3 h-4 w-4 animate-spin text-slate-400" />}</div></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5"><span className="text-xs font-bold text-slate-600">SKU *</span><input value={variantForm.sku} onChange={(event) => setVariantForm((current) => ({ ...current, sku: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm outline-none" /></label><label className="space-y-1.5"><span className="text-xs font-bold text-slate-600">Màu sắc *</span><input value={variantForm.color} onChange={(event) => setVariantForm((current) => ({ ...current, color: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" /></label><label className="space-y-1.5"><span className="text-xs font-bold text-slate-600">Kích thước *</span><select value={variantForm.size} onChange={(event) => setVariantForm((current) => ({ ...current, size: event.target.value }))} disabled={!selectedProduct} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none disabled:bg-slate-50"><option value="">Chọn kích thước</option>{variantSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}</select></label><label className="space-y-1.5"><span className="text-xs font-bold text-slate-600">Chênh lệch giá</span><input type="number" value={variantForm.priceAdjustment} onChange={(event) => setVariantForm((current) => ({ ...current, priceAdjustment: Number(event.target.value) }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" /></label></div><footer className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setShowVariantModal(false)} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700">Hủy</button><button type="submit" disabled={submittingVariant} className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-50">{submittingVariant && <Loader2 className="h-4 w-4 animate-spin" />}Tạo biến thể</button></footer></form></section></div>,
        document.body,
      )}

      {showTxModal && transactionTarget && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  {txType === 'IMPORT' ? 'Nhập lô hàng vào kho (FIFO)' : 'Xuất kho / Kiểm kê'}
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-950">
                  {txType === 'IMPORT' ? 'Tạo phiếu nhập kho & Lô hàng' : 'Tạo phiếu xuất kho'}
                </h2>
              </div>
              <button type="button" onClick={() => setShowTxModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </header>
            <form onSubmit={handleCreateTransaction} className="space-y-4 p-5">
              {txError && (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {txError}
                </div>
              )}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="font-bold text-slate-900">{transactionTarget.productName}</p>
                <p className="mt-1 font-mono text-xs text-blue-600">{transactionTarget.sku}</p>
                <p className="mt-1.5 text-xs text-slate-500">
                  {transactionTarget.color} / {transactionTarget.size} · Tồn hiện tại:{' '}
                  <strong className="text-slate-900">{transactionTarget.stock}</strong> · Giá bán:{' '}
                  <strong className="text-slate-900">{formatPrice(transactionTarget.finalPrice)}</strong>
                </p>
              </div>

              {txType === 'IMPORT' && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-600">Chứng từ lô nhập</span>
                    <button
                      type="button"
                      onClick={() => setTxForm((current) => ({ ...current, batchCode: generateSuggestedBatchCode(transactionTarget) }))}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Tự sinh mã lô
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs font-bold text-slate-600">Mã lô (để trống sẽ tự sinh)</span>
                      <input
                        value={txForm.batchCode}
                        onChange={(event) => setTxForm((current) => ({ ...current, batchCode: event.target.value }))}
                        placeholder="VD: BATCH-NK-2026-01"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs outline-none focus:border-slate-400"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-bold text-slate-600">Nhà cung cấp *</span>
                      <input
                        value={txForm.supplierName}
                        onChange={(event) => setTxForm((current) => ({ ...current, supplierName: event.target.value }))}
                        placeholder="Tên nhà phân phối..."
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-slate-400"
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className={`grid gap-3 ${txType === 'IMPORT' ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-600">Số lượng {txType === 'IMPORT' ? 'nhập' : 'xuất'} *</span>
                  <input
                    type="number"
                    min={1}
                    value={txForm.quantity}
                    onChange={(event) => setTxForm((current) => ({ ...current, quantity: Math.max(1, Number(event.target.value)) }))}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none focus:border-slate-400"
                  />
                </label>
                {txType === 'IMPORT' && (
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-600">Giá vốn / đôi (VNĐ) *</span>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      value={txForm.unitCost}
                      onChange={(event) => setTxForm((current) => ({ ...current, unitCost: Math.max(0, Number(event.target.value)) }))}
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none focus:border-slate-400"
                    />
                  </label>
                )}
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-600">Lý do / Ghi chú kiểm toán</span>
                <textarea
                  rows={2}
                  value={txForm.note}
                  onChange={(event) => setTxForm((current) => ({ ...current, note: event.target.value }))}
                  placeholder={txType === 'IMPORT' ? 'Nhập hàng định kỳ từ nhà cung cấp...' : 'Xuất hủy hàng lỗi / điều chỉnh kiểm kê...'}
                  className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
                />
              </label>

              <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowTxModal(false)} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingTx}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold text-white disabled:opacity-50 ${
                    txType === 'IMPORT' ? 'bg-slate-950 hover:bg-slate-800' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submittingTx && <Loader2 className="h-4 w-4 animate-spin" />}
                  {txType === 'IMPORT' ? 'Xác nhận nhập lô' : 'Xác nhận xuất kho'}
                </button>
              </footer>
            </form>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, ArrowUpRight, ArrowDownLeft, Calendar,
  Loader2, ImageIcon, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, X
} from 'lucide-react';
import { AdminProductService } from '../../services/admin/adminProductService';
import { ProductService, type ProductResponse, type ProductDetailResponse } from '../../services/productService';
import { AdminInventoryService, type InventoryTransactionResponse } from '../../services/admin/adminInventoryService';

type TransactionType = 'IMPORT' | 'EXPORT';

const formatPrice = (price?: number | null) =>
  price != null ? price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '—';

export default function AdminInventoryPage() {
  // Lựa chọn sản phẩm
  const [productList, setProductList] = useState<ProductResponse[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedProduct, setSelectedProduct] = useState<ProductDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal tạo biến thể mới
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantForm, setVariantForm] = useState({
    color: '',
    size: '',
    sku: '',
    priceAdjustment: 0,
  });
  const [submittingVariant, setSubmittingVariant] = useState(false);
  const [variantError, setVariantError] = useState('');

  // Modal Giao dịch kho (Nhập/Xuất)
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('IMPORT');
  const [selectedVariant, setSelectedVariant] = useState<{ id: number; sku: string; color: string; size: string; stock: number } | null>(null);
  const [txForm, setTxForm] = useState({
    quantity: 1,
    note: '',
  });
  const [submittingTx, setSubmittingTx] = useState(false);
  const [txError, setTxError] = useState('');

  // Lịch sử giao dịch kho
  const [transactions, setTransactions] = useState<InventoryTransactionResponse[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'IMPORT' | 'EXPORT'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);

  // Thông báo chung
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Tải danh sách sản phẩm để chọn
  useEffect(() => {
    setLoadingProducts(true);
    AdminProductService.getAdminProducts({ size: 100 })
      .then((res) => {
        setProductList(res.items || []);
      })
      .catch(() => {
        showToast('Không thể tải danh sách sản phẩm.', 'error');
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, []);

  // Tải chi tiết sản phẩm được chọn (để lấy danh sách biến thể)
  const loadProductDetail = useCallback(async (productId: number) => {
    setLoadingDetail(true);
    try {
      const detail = await ProductService.getProductById(productId);
      setSelectedProduct(detail);
    } catch {
      showToast('Không thể tải chi tiết sản phẩm.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadProductDetail(Number(selectedProductId));
    } else {
      setSelectedProduct(null);
    }
  }, [selectedProductId, loadProductDetail]);

  // Tải lịch sử giao dịch kho
  const loadTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      const typeParam = filterType === 'ALL' ? undefined : filterType;
      const res = await AdminInventoryService.getTransactions({
        productId: selectedProductId ? Number(selectedProductId) : undefined,
        type: typeParam,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: txPage,
        size: 8,
      });
      setTransactions(res.items || []);
      setTxTotalPages(res.totalPages || 1);
    } catch {
      showToast('Không thể tải lịch sử giao dịch kho.', 'error');
    } finally {
      setLoadingTx(false);
    }
  }, [selectedProductId, filterType, startDate, endDate, txPage]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Submit tạo biến thể mới
  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    setVariantError('');
    if (!selectedProductId) return;
    if (!variantForm.sku.trim()) { setVariantError('Vui lòng nhập mã SKU.'); return; }
    if (!variantForm.color.trim()) { setVariantError('Vui lòng nhập màu sắc.'); return; }
    if (!variantForm.size.trim()) { setVariantError('Vui lòng nhập kích cỡ.'); return; }

    setSubmittingVariant(true);
    try {
      await AdminInventoryService.createVariant(Number(selectedProductId), {
        color: variantForm.color.trim(),
        size: variantForm.size.trim(),
        sku: variantForm.sku.trim(),
        priceAdjustment: variantForm.priceAdjustment,
      });
      showToast('Thêm biến thể mới thành công.', 'success');
      setShowVariantModal(false);
      setVariantForm({ color: '', size: '', sku: '', priceAdjustment: 0 });
      // Reload danh sách biến thể
      loadProductDetail(Number(selectedProductId));
    } catch (err: any) {
      setVariantError(err?.response?.data?.message ?? err?.message ?? 'Lỗi khi tạo biến thể.');
    } finally {
      setSubmittingVariant(false);
    }
  };

  // Submit Giao dịch xuất/nhập kho
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError('');
    if (!selectedVariant) return;
    if (txForm.quantity <= 0) { setTxError('Số lượng giao dịch phải lớn hơn 0.'); return; }
    if (txType === 'EXPORT' && selectedVariant.stock < txForm.quantity) {
      setTxError(`Không đủ tồn kho để xuất. Tồn kho hiện tại: ${selectedVariant.stock}`);
      return;
    }

    setSubmittingTx(true);
    try {
      await AdminInventoryService.createTransaction({
        variantId: selectedVariant.id,
        quantity: txForm.quantity,
        type: txType,
        note: txForm.note.trim() || undefined,
      });
      showToast(`${txType === 'IMPORT' ? 'Nhập' : 'Xuất'} kho thành công.`, 'success');
      setShowTxModal(false);
      setTxForm({ quantity: 1, note: '' });
      // Reload tồn kho và lịch sử giao dịch
      if (selectedProductId) {
        loadProductDetail(Number(selectedProductId));
      }
      loadTransactions();
    } catch (err: any) {
      setTxError(err?.response?.data?.message ?? err?.message ?? 'Lỗi khi thực hiện giao dịch kho.');
    } finally {
      setSubmittingTx(false);
    }
  };

  // Mở modal giao dịch nhanh
  const openTxModal = (
    type: TransactionType,
    v: { id: number; sku: string; color: string; size: string; stock: number }
  ) => {
    setTxType(type);
    setSelectedVariant(v);
    setTxError('');
    setTxForm({ quantity: 1, note: '' });
    setShowTxModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm text-white transition-all duration-300
          ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Quản lý Kho hàng</h1>
          <p className="text-sm text-zinc-500 mt-1">Lập phiếu Nhập / Xuất kho, theo dõi lịch sử luân chuyển và quản lý biến thể sản phẩm.</p>
        </div>
      </div>

      {/* Section 1: Selector & Variants List */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-6">
        <div className="max-w-md space-y-2 mb-6">
          <label className="block text-sm font-semibold text-zinc-800">
            Bước 1: Chọn sản phẩm để xem biến thể & quản lý kho
          </label>
          <div className="relative">
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value ? Number(e.target.value) : '');
                setTxPage(0);
              }}
              disabled={loadingProducts}
              className="w-full pl-3 pr-10 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-950 bg-white"
            >
              <option value="">-- Vui lòng chọn một sản phẩm --</option>
              {productList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (#{p.id})
                </option>
              ))}
            </select>
            {loadingProducts && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-zinc-400" />
            )}
          </div>
        </div>

        {selectedProduct ? (
          <div className="border-t border-zinc-100 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-zinc-50 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img
                      src={selectedProduct.images.find((i) => i.isPrimary)?.imageUrl ?? selectedProduct.images[0].imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-zinc-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 text-lg">{selectedProduct.name}</h3>
                  <div className="text-xs text-zinc-400">
                    Thương hiệu: <span className="font-medium text-zinc-600">{selectedProduct.brand?.name ?? '—'}</span> | 
                    Danh mục: <span className="font-medium text-zinc-600">{selectedProduct.category?.name ?? '—'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setVariantError('');
                  setShowVariantModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition"
              >
                <Plus className="w-4 h-4" /> Thêm biến thể mới
              </button>
            </div>

            {/* Bảng biến thể */}
            <div className="overflow-x-auto border border-zinc-200 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Mã SKU</th>
                    <th className="px-5 py-3">Màu sắc</th>
                    <th className="px-5 py-3">Kích cỡ</th>
                    <th className="px-5 py-3 text-right">Chênh lệch giá</th>
                    <th className="px-5 py-3 text-right">Tồn kho hiện tại</th>
                    <th className="px-5 py-3 text-center">Thao tác kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loadingDetail ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-zinc-400">
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Đang tải thông tin biến thể...
                      </td>
                    </tr>
                  ) : !selectedProduct.variants || selectedProduct.variants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-zinc-400">
                        Sản phẩm này chưa có biến thể nào. Hãy tạo biến thể mới ở trên.
                      </td>
                    </tr>
                  ) : (
                    selectedProduct.variants.map((v) => (
                      <tr key={v.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-zinc-600">{v.color && v.size ? v.sku : 'Chưa định cấu hình'}</td>
                        <td className="px-5 py-4 text-zinc-900 font-medium">{v.color ?? '—'}</td>
                        <td className="px-5 py-4 font-medium text-zinc-700">{v.size ?? '—'}</td>
                        <td className="px-5 py-4 text-right text-zinc-500 font-mono">
                          +{formatPrice(v.priceMultiplier)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={`font-semibold px-2 py-0.5 rounded text-xs
                            ${(v.stock ?? 0) === 0 ? 'bg-red-50 text-red-700' : (v.stock ?? 0) < 10 ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
                            {v.stock ?? 0} chiếc
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => openTxModal('IMPORT', { id: v.id, sku: v.sku, color: v.color, size: v.size, stock: v.stock })}
                              className="flex items-center gap-1 px-2.5 py-1 border border-green-200 text-green-700 hover:bg-green-50 transition text-xs font-semibold rounded"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" /> Nhập kho
                            </button>
                            <button
                              onClick={() => openTxModal('EXPORT', { id: v.id, sku: v.sku, color: v.color, size: v.size, stock: v.stock })}
                              className="flex items-center gap-1 px-2.5 py-1 border border-red-200 text-red-700 hover:bg-red-50 transition text-xs font-semibold rounded"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" /> Xuất kho
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
        ) : (
          <div className="border border-dashed border-zinc-200 rounded-lg p-10 text-center text-zinc-400 mt-6 bg-zinc-50/50">
            <Search className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-medium">Chưa có sản phẩm nào được chọn.</p>
            <p className="text-xs text-zinc-400 mt-0.5">Vui lòng chọn một sản phẩm phía trên để bắt đầu thao tác với biến thể và tồn kho.</p>
          </div>
        )}
      </div>

      {/* Section 2: Inventory History Logs */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Lịch sử xuất nhập kho</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Theo dõi lịch sử luân chuyển hàng hóa thực tế.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Loại giao dịch */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as any);
                setTxPage(0);
              }}
              className="px-3 py-1.5 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950"
            >
              <option value="ALL">Tất cả giao dịch</option>
              <option value="IMPORT">Nhập kho (IMPORT)</option>
              <option value="EXPORT">Xuất kho (EXPORT)</option>
            </select>

            {/* Date filter */}
            <div className="flex items-center gap-1.5 border border-zinc-200 px-3 py-1.5 rounded text-xs bg-white">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setTxPage(0);
                }}
                className="focus:outline-none text-zinc-600 bg-transparent"
              />
              <span className="text-zinc-300">đến</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setTxPage(0);
                }}
                className="focus:outline-none text-zinc-600 bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table Lịch sử */}
        <div className="overflow-x-auto border border-zinc-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 text-xs uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Mã GD / Thời gian</th>
                <th className="px-5 py-3">Sản phẩm</th>
                <th className="px-5 py-3">Biến thể (Màu/Size)</th>
                <th className="px-5 py-3">Mã SKU</th>
                <th className="px-5 py-3 text-center">Giao dịch</th>
                <th className="px-5 py-3 text-right">Số lượng</th>
                <th className="px-5 py-3">Lý do / Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loadingTx ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Đang tải lịch sử giao dịch...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400">
                    Không tìm thấy dữ liệu lịch sử xuất nhập kho nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-zinc-900">GD-{tx.id}</div>
                      <div className="text-[10px] text-zinc-400">
                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-zinc-800 line-clamp-1 max-w-[180px]">{tx.productName}</div>
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {tx.color} / Size {tx.size}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-zinc-500">{tx.sku}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${tx.type === 'IMPORT' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {tx.type === 'IMPORT' ? (
                          <>
                            <ArrowUpRight className="w-3 h-3" /> Nhập kho
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="w-3 h-3" /> Xuất kho
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-zinc-800">
                      {tx.quantity} chiếc
                    </td>
                    <td className="px-5 py-4 text-zinc-500 text-xs italic">{tx.note ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Lịch sử */}
        {txTotalPages > 1 && (
          <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between mt-4">
            <span className="text-sm text-zinc-500">Trang {txPage + 1} / {txTotalPages}</span>
            <div className="flex gap-1.5">
              <button
                disabled={txPage === 0}
                onClick={() => setTxPage((p) => p - 1)}
                className="p-1.5 rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={txPage + 1 >= txTotalPages}
                onClick={() => setTxPage((p) => p + 1)}
                className="p-1.5 rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL: THÊM BIẾN THỂ MỚI ===== */}
      {showVariantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h3 className="text-lg font-bold text-zinc-950">Thêm biến thể mới</h3>
              <button
                onClick={() => setShowVariantModal(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVariant} className="p-6 space-y-4">
              {variantError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{variantError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Mã SKU biến thể *</label>
                <input
                  type="text" required
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  placeholder="Ví dụ: NKE-AJ1-RED-42"
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-950 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Màu sắc *</label>
                  <input
                    type="text" required
                    value={variantForm.color}
                    onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                    placeholder="Ví dụ: Đen/Đỏ"
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Kích cỡ (Size) *</label>
                  <input
                    type="text" required
                    value={variantForm.size}
                    onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                    placeholder="Ví dụ: 42"
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Chênh lệch giá với giá gốc (VND)</label>
                <input
                  type="number"
                  value={variantForm.priceAdjustment || 0}
                  onChange={(e) => setVariantForm({ ...variantForm, priceAdjustment: Number(e.target.value) })}
                  placeholder="Ví dụ: 100000"
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-950"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">Tồn kho ban đầu của biến thể mặc định là 0. Bạn cần lập phiếu Nhập kho để bổ sung số lượng.</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowVariantModal(false)}
                  disabled={submittingVariant}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingVariant}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition disabled:opacity-50"
                >
                  {submittingVariant && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Tạo biến thể
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: PHIẾU GIAO DỊCH KHO (NHẬP/XUẤT) ===== */}
      {showTxModal && selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h3 className="text-lg font-bold text-zinc-950">
                Lập phiếu {txType === 'IMPORT' ? 'Nhập kho' : 'Xuất kho'}
              </h3>
              <button
                onClick={() => setShowTxModal(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="p-6 space-y-4">
              {txError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{txError}</span>
                </div>
              )}

              {/* Thông tin biến thể */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-xs space-y-1">
                <div>Biến thể: <span className="font-semibold text-zinc-900">{selectedVariant.color} / Size {selectedVariant.size}</span></div>
                <div>Mã SKU: <span className="font-mono text-zinc-600">{selectedVariant.sku}</span></div>
                <div>Tồn kho hiện tại: <span className="font-semibold text-zinc-900">{selectedVariant.stock} chiếc</span></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Số lượng cần {txType === 'IMPORT' ? 'nhập' : 'xuất'} *
                </label>
                <input
                  type="number" required min={1}
                  value={txForm.quantity}
                  onChange={(e) => setTxForm({ ...txForm, quantity: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-950 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Lý do / Ghi chú</label>
                <textarea
                  rows={2}
                  value={txForm.note}
                  onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                  placeholder="Ví dụ: Nhập hàng bổ sung từ nhà sản xuất, xuất hoàn trả hàng lỗi..."
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  disabled={submittingTx}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingTx}
                  className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white rounded-lg transition disabled:opacity-50
                    ${txType === 'IMPORT' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {submittingTx && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Xác nhận {txType === 'IMPORT' ? 'nhập kho' : 'xuất kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

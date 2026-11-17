import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Loader2,
  Plus,
  Trash2,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageBackButton from '../../components/common/PageBackButton';
import { getOrderById, type OrderResponse } from '../../services/orderService';
import { ReturnService, type OrderReturnItem, type ReturnReasonCode } from '../../services/returnService';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback;
  const response = (error as { response?: { data?: { message?: unknown } } }).response;
  return typeof response?.data?.message === 'string' ? response.data.message : fallback;
};

const RETURN_STATUS_LABELS: Record<OrderReturnItem['status'], string> = {
  REQUESTED: 'Chờ duyệt',
  APPROVED: 'Đã chấp thuận',
  REJECTED: 'Đã từ chối',
  GOODS_RECEIVED: 'Đã nhận hàng',
  COMPLETED: 'Hoàn tất',
};

export default function OrderReturnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [existingReturns, setExistingReturns] = useState<OrderReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evaluatedAt] = useState(() => Date.now());

  // Form State
  const [returnType, setReturnType] = useState<'RETURN_REFUND' | 'EXCHANGE'>('EXCHANGE');
  const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({});
  const [reasonCode, setReasonCode] = useState<ReturnReasonCode>('WRONG_SIZE');
  const [reasonDetail, setReasonDetail] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);

  const reasonOptions: Array<{ value: ReturnReasonCode; label: string }> = [
    { value: 'WRONG_SIZE', label: 'Kích thước không phù hợp' },
    { value: 'DEFECTIVE_PRODUCT', label: 'Sản phẩm lỗi kỹ thuật' },
    { value: 'WRONG_ITEM', label: 'Giao sai sản phẩm hoặc màu sắc' },
    { value: 'NOT_AS_DESCRIBED', label: 'Sản phẩm không đúng mô tả' },
    { value: 'SHIPPING_DAMAGE', label: 'Hư hại trong quá trình vận chuyển' },
    { value: 'CHANGE_OF_MIND', label: 'Không còn phù hợp nhu cầu' },
    { value: 'OTHER', label: 'Lý do khác' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const orderData = await getOrderById(Number(id));
        setOrder(orderData);

        // Fetch existing return requests to see if user has already submitted
        try {
          const userReturns = await ReturnService.getUserReturns();
          const related = userReturns.filter((r) => r.orderId === Number(id));
          setExistingReturns(related);
        } catch {
          // Non-blocking if returns list fails
        }
      } catch {
        toast.error('Không thể tải thông tin đơn hàng');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    if (!imageUrlInput.startsWith('http://') && !imageUrlInput.startsWith('https://')) {
      toast.error('Vui lòng nhập đường dẫn URL ảnh hợp lệ (bắt đầu bằng http/https)');
      return;
    }
    if (evidenceImages.length >= 5) {
      toast.error('Tối đa 5 hình ảnh bằng chứng');
      return;
    }
    setEvidenceImages([...evidenceImages, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setEvidenceImages(evidenceImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    if (!reasonDetail.trim()) {
      toast.error('Vui lòng nhập mô tả chi tiết lý do yêu cầu đổi/trả');
      return;
    }

    const selectedItems = Object.entries(selectedQuantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId: Number(orderItemId), quantity }));
    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm cần đổi trả');
      return;
    }

    try {
      setSubmitting(true);
      await ReturnService.createReturn({
        orderId: order.id,
        returnType,
        reasonCode,
        reason: reasonDetail.trim(),
        evidenceImages: evidenceImages.length > 0 ? evidenceImages : undefined,
        items: selectedItems,
      });

      toast.success('Gửi yêu cầu đổi/trả hàng thành công! Đội ngũ CSKH sẽ liên hệ hỗ trợ bạn.');
      navigate(`/orders/${order.id}`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Có lỗi xảy ra khi gửi yêu cầu đổi/trả'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-zinc-50 text-zinc-950">
        <Loader2 className="mb-4 h-10 w-10 animate-spin" />
        <p className="text-sm text-zinc-500">Đang tải thông tin đổi trả...</p>
      </div>
    );
  }

  if (!order) return null;

  const requestedQuantityByItem = existingReturns
    .filter((request) => request.status !== 'REJECTED')
    .flatMap((request) => request.items)
    .reduce<Record<number, number>>((totals, item) => {
      totals[item.orderItemId] = (totals[item.orderItemId] ?? 0) + item.requestedQuantity;
      return totals;
    }, {});
  const availableQuantity = (orderItemId: number, purchasedQuantity: number) =>
    Math.max(0, purchasedQuantity - (requestedQuantityByItem[orderItemId] ?? 0));
  const returnDeadline = order.deliveredAt
    ? new Date(new Date(order.deliveredAt).getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;
  const eligibleStatus = order.status === 'DELIVERED' || order.status === 'COMPLETED';
  const withinReturnWindow = returnDeadline !== null && evaluatedAt <= returnDeadline.getTime();
  const canCreateReturn = eligibleStatus && withinReturnWindow
    && order.items.some((item) => availableQuantity(item.id, item.quantity) > 0);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Navigation */}
        <PageBackButton
          fallbackTo={`/orders/${order.id}`}
          label={`Quay lại đơn ${order.orderCode || '#' + order.id}`}
          className="mb-6"
        />

        {/* Title */}
        <div className="mb-8 border-b border-zinc-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Yêu cầu đổi trả
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {order.orderCode} · {formatPrice(order.finalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Previous Requests Alert */}
        {existingReturns.length > 0 && (
          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-950">
              <Clock className="h-5 w-5 text-amber-600" />
              Lịch sử yêu cầu đổi/trả của đơn hàng này
            </h3>
            <div className="space-y-3">
              {existingReturns.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-start justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <span className="mr-2 rounded bg-zinc-950 px-2 py-0.5 text-xs font-bold text-white">
                      {item.returnType === 'RETURN_REFUND' ? 'Hoàn tiền' : 'Đổi hàng'}
                    </span>
                    <span className="text-sm text-zinc-600">{item.reason}</span>
                  </div>
                  <span
                    className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : item.status === 'APPROVED'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : item.status === 'REJECTED'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {RETURN_STATUS_LABELS[item.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!canCreateReturn && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {!eligibleStatus
              ? 'Đơn hàng cần được giao thành công trước khi tạo yêu cầu đổi trả.'
              : !withinReturnWindow
                ? 'Đơn hàng đã quá thời hạn đổi trả 7 ngày.'
                : 'Toàn bộ số lượng đủ điều kiện đã có trong các yêu cầu trước.'}
          </div>
        )}

        {/* Return item selection */}
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-950">
            <Package className="h-4 w-4" />
            Chọn sản phẩm và số lượng cần đổi trả
          </h2>
          <div className="divide-y divide-zinc-100">
            {order.items?.map((item) => {
              const available = availableQuantity(item.id, item.quantity);
              return <div key={item.id} className="flex items-center gap-3 py-4 sm:gap-4">
                <input
                  type="checkbox"
                  disabled={!canCreateReturn || available === 0}
                  checked={(selectedQuantities[item.id] ?? 0) > 0}
                  onChange={(event) => setSelectedQuantities((current) => ({
                    ...current,
                    [item.id]: event.target.checked ? 1 : 0,
                  }))}
                  className="h-4 w-4 accent-zinc-950 disabled:opacity-40"
                  aria-label={`Chọn ${item.productName}`}
                />
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 p-1.5">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain" />
                  ) : (
                    <Package className="h-6 w-6 text-zinc-300" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-zinc-950">{item.productName}</h4>
                  <p className="text-xs text-zinc-500">
                    {item.variantName} · Có thể yêu cầu: {available}/{item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  {(selectedQuantities[item.id] ?? 0) > 0 && (
                    <select
                      value={selectedQuantities[item.id]}
                      onChange={(event) => setSelectedQuantities((current) => ({
                        ...current,
                        [item.id]: Number(event.target.value),
                      }))}
                      className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-950"
                      aria-label={`Số lượng đổi trả của ${item.productName}`}
                    >
                      {Array.from({ length: available }, (_, index) => index + 1).map((quantity) => (
                        <option key={quantity} value={quantity}>{quantity}</option>
                      ))}
                    </select>
                  )}
                  <p className="hidden text-sm font-extrabold text-zinc-950 sm:block">{formatPrice(item.subtotal)}</p>
                </div>
              </div>;
            })}
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
          {/* Step 1: Return Type */}
          <div>
            <label className="mb-3 block text-sm font-bold text-zinc-950">
              1. Chọn hình thức giải quyết
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setReturnType('EXCHANGE')}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                  returnType === 'EXCHANGE'
                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-lg'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <RefreshCw className="w-5 h-5" />
                  {returnType === 'EXCHANGE' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold">Đổi hàng</h3>
                  <p className={`mt-1 text-xs ${returnType === 'EXCHANGE' ? 'text-zinc-300' : 'text-zinc-500'}`}>Đổi size, màu hoặc phiên bản khác</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReturnType('RETURN_REFUND')}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                  returnType === 'RETURN_REFUND'
                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-lg'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <RotateCcw className="w-5 h-5" />
                  {returnType === 'RETURN_REFUND' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold">Trả hàng & hoàn tiền</h3>
                  <p className={`mt-1 text-xs ${returnType === 'RETURN_REFUND' ? 'text-zinc-300' : 'text-zinc-500'}`}>Trả sản phẩm và nhận lại khoản thanh toán</p>
                </div>
              </button>

            </div>
          </div>

          {/* Step 2: Reason Selection & Description */}
          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-950">
              2. Lý do đổi / trả hàng
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as ReturnReasonCode)}
              className="mb-3 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition focus:border-zinc-950 focus:outline-none"
            >
              {reasonOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <textarea
              rows={4}
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder="Vui lòng mô tả chi tiết tình trạng sản phẩm, yêu cầu hỗ trợ (ví dụ: đổi sang size 42.5, giày bị bung đế phía mũi chân phải...)"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-zinc-950 focus:outline-none"
              required
            />
          </div>

          {/* Step 3: Evidence Images */}
          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-bold text-zinc-950">
              <span>3. Liên kết ảnh bằng chứng</span>
              <span className="text-xs font-normal text-zinc-500">{evidenceImages.length}/5</span>
            </label>

            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Dán đường dẫn URL hình ảnh (ví dụ: https://i.imgur.com/...)"
                className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-zinc-950 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </div>

            {evidenceImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
                {evidenceImages.map((url, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                    <img src={url} alt={`evidence-${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-full transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Policy Box */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Điều kiện đổi trả</p>
              <p>&bull; Sản phẩm chưa qua sử dụng, còn nguyên tem mác và hộp đựng của hãng trong vòng 7 ngày kể từ khi nhận hàng.</p>
              <p>&bull; Sau khi yêu cầu được duyệt, bộ phận vận chuyển sẽ đến thu hồi sản phẩm hoặc bạn có thể gửi lại theo hướng dẫn của CSKH.</p>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={submitting || !canCreateReturn}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-4 text-sm font-extrabold text-white shadow-lg transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang gửi yêu cầu...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Xác nhận gửi yêu cầu đổi / trả</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

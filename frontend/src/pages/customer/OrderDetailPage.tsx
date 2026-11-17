import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader2, Package, Truck, CreditCard, CheckCircle2, Clock, MessageSquare, RefreshCw, RotateCcw, X } from "lucide-react";
import PageBackButton from "../../components/common/PageBackButton";
import { cancelOrder, getOrderById, getOrderShipment } from "../../services/orderService";
import { API_BASE_URL } from "../../services/api";
import type { OrderItemResponse, OrderResponse, ShipmentResponse } from "../../services/orderService";
import ReviewForm from "../../components/customer/ReviewForm";
import toast from "react-hot-toast";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [shipment, setShipment] = useState<ShipmentResponse | null>(null);
  
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const data = await getOrderById(Number(id));
        setOrder(data);
        try {
          setShipment(await getOrderShipment(Number(id)));
        } catch {
          setShipment(null);
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết đơn hàng:", err);
        setError("Không thể tải thông tin chi tiết đơn hàng hoặc bạn không có quyền xem.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-zinc-300 animate-spin mb-4" />
        <p className="text-zinc-500 text-sm font-medium">Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <Package className="h-12 w-12 text-red-300 mb-4" />
        <p className="text-red-500 text-sm font-bold uppercase tracking-widest">{error || "Không tìm thấy đơn hàng"}</p>
        <Link to="/orders" className="mt-6 text-zinc-500 hover:text-zinc-900 font-semibold underline text-sm transition-colors">
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
      case "DELIVERED": return "bg-teal-100 text-teal-800 border-teal-200";
      case "SHIPPING": return "bg-blue-100 text-blue-800 border-blue-200";
      case "PROCESSING": return "bg-purple-100 text-purple-800 border-purple-200";
      case "CONFIRMED": return "bg-sky-100 text-sky-800 border-sky-200";
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-zinc-100 text-zinc-800 border-zinc-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED": return "Đã giao hàng";
      case "DELIVERED": return "Đã giao";
      case "SHIPPING": return "Đang giao";
      case "PROCESSING": return "Đang xử lý";
      case "CONFIRMED": return "Đã xác nhận";
      case "PENDING": return "Chờ xác nhận";
      case "CANCELLED": return "Đã hủy";
      default: return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "PAID": return "Đã thanh toán";
      case "UNPAID": return "Chưa thanh toán";
      case "PENDING": return "Chờ thanh toán";
      case "FAILED": return "Thanh toán thất bại";
      case "REFUNDED": return "Đã hoàn tiền";
      default: return status;
    }
  };

  const getShipmentStatusText = (status: string) => ({
    ready_to_pick: "Đã tạo vận đơn, chờ GHN lấy hàng",
    picking: "GHN đang lấy hàng",
    money_collect_picking: "GHN đang lấy hàng và thu tiền",
    picked: "GHN đã lấy hàng",
    storing: "Đang lưu kho trung chuyển",
    transporting: "Đang vận chuyển",
    sorting: "Đang phân loại",
    delivering: "Đang giao đến người nhận",
    money_collect_delivering: "Đang giao và thu hộ COD",
    delivered: "Giao hàng thành công",
    delivery_fail: "Giao hàng chưa thành công",
    waiting_to_return: "Đang chờ hoàn hàng",
    return: "Bắt đầu hoàn hàng",
    return_transporting: "Đang vận chuyển hàng hoàn",
    return_sorting: "Đang phân loại hàng hoàn",
    returning: "Đang hoàn về cửa hàng",
    return_fail: "Hoàn hàng chưa thành công",
    returned: "Cửa hàng đã nhận lại hàng",
    cancel: "Vận đơn đã hủy",
    exception: "Vận đơn cần được kiểm tra",
    damage: "Hàng hóa được ghi nhận hư hỏng",
    lost: "Hàng hóa được ghi nhận thất lạc",
  }[status.toLowerCase()] ?? status);

  const handleBuyNow = (item: OrderItemResponse) => {
    const variantParts = (item.variantName ?? "").split("-");
    const buyNowItem = {
      id: item.productVariantId, // Checkout component expects a variant or specific id
      name: item.productName,
      variant: {
        id: item.productVariantId,
        size: variantParts[1]?.trim() || "N/A",
        color: variantParts[0]?.trim() || "N/A",
      },
      price: item.unitPrice,
      quantity: 1,
      imageUrl: item.imageUrl
    };
    navigate('/checkout', { state: { buyNowVariantId: item.productVariantId, buyNowItem } });
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này? Tồn kho sẽ được hoàn lại.")) return;
    setIsCancelling(true);
    try {
      const updatedOrder = await cancelOrder(order.id);
      setOrder(updatedOrder);
      toast.success("Đã hủy đơn hàng và hoàn lại tồn kho.");
    } catch (cancelError: unknown) {
      const message = typeof cancelError === "object" && cancelError !== null && "response" in cancelError
        ? (cancelError as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast.error(message || "Không thể hủy đơn hàng.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <PageBackButton fallbackTo="/orders" label="Quay lại Lịch sử đơn hàng" className="mb-6" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-900">
              Chi tiết đơn hàng
            </h1>
            <p className="text-zinc-500 mt-2 font-mono text-lg bg-zinc-50 px-2 py-1 rounded inline-block border border-zinc-200">
              {order.orderCode || `#${order.id}`}
            </p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest border rounded inline-flex items-center ${getStatusColor(order.status)}`}>
              {order.status === "COMPLETED" ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> :
               order.status === "SHIPPING" || order.status === "DELIVERED" ? <Truck className="w-3.5 h-3.5 mr-1.5" /> :
               <Clock className="w-3.5 h-3.5 mr-1.5" />}
              {getStatusText(order.status)}
            </span>
            <p className="text-sm text-zinc-500 mt-2">
              Đặt ngày {formatDateTime(order.createdAt)}
            </p>
            {order.status === "COMPLETED" && (
              <div className="mt-3">
                <Link
                  to={`/orders/${order.id}/return`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 text-white rounded-md transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Yêu cầu Đổi / Trả (RMA)
                </Link>
              </div>
            )}
            {(order.status === "PENDING" || order.status === "CONFIRMED") && (
              <button
                type="button"
                onClick={() => void handleCancelOrder()}
                disabled={isCancelling}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                {isCancelling ? "Đang hủy..." : "Hủy đơn hàng"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content: Items */}
        <div className="lg:col-span-8 space-y-8">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900 mb-6">Danh sách sản phẩm</h3>
            <div className="space-y-6">
              {order.items && order.items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-6 p-4 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:shadow-sm transition-all bg-white group">
                  <div className="w-full sm:w-36 h-36 bg-zinc-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img 
                      src={item.imageUrl ? (item.imageUrl.startsWith("http") ? item.imageUrl : `${API_BASE_URL}/images/${item.imageUrl}`) : `https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80`}
                      alt={item.productName} 
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80`;
                      }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="text-xl font-black text-zinc-900 leading-tight mb-2 hover:underline cursor-pointer">{item.productName}</h4>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full uppercase tracking-wider">{item.variantName}</span>
                        <span className="text-xs text-zinc-400 font-mono">SKU: {item.sku}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mt-auto mb-4">
                        <div className="text-sm font-medium text-zinc-500">
                          {formatPrice(item.unitPrice)} <span className="text-zinc-300 mx-1">x</span> <span className="text-zinc-900 font-black">{item.quantity}</span>
                        </div>
                        <div className="text-xl font-black text-zinc-900 tracking-tight">
                          {formatPrice(item.subtotal)}
                        </div>
                      </div>
                      
                      {order.status === "COMPLETED" && (
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-100">
                          <button 
                            onClick={() => setReviewProductId(item.productId)}
                            className="flex-1 min-w-[120px] inline-flex justify-center items-center px-4 py-2 bg-white border border-black text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 rounded transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-2" /> Đánh giá
                          </button>
                          <button 
                            onClick={() => handleBuyNow(item)}
                            className="flex-1 min-w-[120px] inline-flex justify-center items-center px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 rounded transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Mua lại
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {shipment && (
            <section className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900">Hành trình giao hàng</h3>
                  <p className="mt-1 text-sm text-zinc-500">GHN · {shipment.providerOrderCode}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  {getShipmentStatusText(shipment.providerStatus)}
                </span>
              </div>
              <ol className="mt-5 space-y-4 border-l border-zinc-200 pl-5">
                {shipment.events.length === 0 ? (
                  <li className="text-sm text-zinc-500">Vận đơn đã được tạo, đang chờ cập nhật từ GHN.</li>
                ) : shipment.events.filter((event) => event.applied).map((event) => (
                  <li key={event.id} className="relative">
                    <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                    <p className="text-sm font-bold text-zinc-800">{getShipmentStatusText(event.providerStatus)}</p>
                    <p className="mt-1 text-xs text-zinc-400">{formatDateTime(event.occurredAt)}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
          
          {/* Order Note */}
          {order.note && (
             <div className="bg-zinc-50 border-l-4 border-zinc-900 p-5 rounded-r-lg">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">Ghi chú đơn hàng</span>
                <p className="text-zinc-700 italic">{order.note}</p>
             </div>
          )}
        </div>

        {/* Sidebar: Summary & Info */}
        <div className="lg:col-span-4 space-y-8">
          {/* Summary */}
          <div className="bg-zinc-900 text-white p-8 rounded-2xl shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Tổng thanh toán
            </h3>
            <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between text-zinc-400">
                <span>Tạm tính</span>
                <span className="text-white">{formatPrice(order.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Phí giao hàng</span>
                <span className="text-white">{formatPrice(order.shippingFee)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Giảm giá {order.voucherCode ? `(${order.voucherCode})` : ""}</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="pt-6 mt-2 border-t border-zinc-700/50 flex justify-between items-end">
                <span className="text-sm font-black uppercase tracking-widest">Tổng cộng</span>
                <span className="text-3xl font-black text-white tracking-tighter">{formatPrice(order.finalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Payment Info */}
             <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-2xl">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
                 <CreditCard className="w-3.5 h-3.5" /> Thanh toán
               </h3>
               <p className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {getPaymentStatusText(order.paymentStatus)}
               </p>
             </div>

             {/* Order Status */}
             <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-2xl">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
                 <Package className="w-3.5 h-3.5" /> Trạng thái
               </h3>
               <p className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
               </p>
             </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-4 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Truck className="w-4 h-4 text-zinc-400" /> Thông tin nhận hàng
            </h3>
            <div className="text-sm text-zinc-600 space-y-1.5">
              <p className="font-bold text-zinc-900">{order.shippingName}</p>
              <p className="font-mono text-zinc-500">{order.shippingPhone}</p>
              <p className="leading-relaxed pt-2 mt-2 border-t border-zinc-100">
                <span className="font-medium text-zinc-800 block mb-1">{order.shippingStreet}</span>
                {order.shippingWard}, {order.shippingDistrict}, {order.shippingProvince}
              </p>
            </div>
          </div>
          
        </div>
      </div>
      {/* Review Modal */}
      {reviewProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setReviewProductId(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 md:p-8">
              <ReviewForm 
                productId={reviewProductId} 
                onReviewSubmitted={() => setReviewProductId(null)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

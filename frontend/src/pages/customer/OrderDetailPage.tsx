import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Package, Truck, CreditCard, CheckCircle2, Clock, MessageSquare, RefreshCw, X } from "lucide-react";
import { getOrderById } from "../../services/orderService";
import type { OrderResponse } from "../../services/orderService";
import { format } from "date-fns";
import ReviewForm from "../../components/customer/ReviewForm";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const data = await getOrderById(Number(id));
        setOrder(data);
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
      case "DELIVERING": return "bg-blue-100 text-blue-800 border-blue-200";
      case "PROCESSING": return "bg-purple-100 text-purple-800 border-purple-200";
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-zinc-100 text-zinc-800 border-zinc-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED": return "Đã giao hàng";
      case "DELIVERING": return "Đang vận chuyển";
      case "PROCESSING": return "Đang xử lý";
      case "PENDING": return "Chờ xác nhận";
      case "CANCELLED": return "Đã hủy";
      default: return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "PAID": return "Đã thanh toán";
      case "PENDING": return "Chờ thanh toán";
      case "FAILED": return "Thanh toán thất bại";
      case "REFUNDED": return "Đã hoàn tiền";
      default: return status;
    }
  };

  const handleBuyNow = (item: any) => {
    const buyNowItem = {
      id: item.productVariantId, // Checkout component expects a variant or specific id
      name: item.productName,
      variant: {
        id: item.productVariantId,
        size: item.variantName.split('-')[1]?.trim() || "N/A",
        color: item.variantName.split('-')[0]?.trim() || "N/A",
      },
      price: item.unitPrice,
      quantity: 1,
      imageUrl: item.imageUrl
    };
    navigate('/checkout', { state: { buyNowVariantId: item.productVariantId, buyNowItem } });
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Link to="/orders" className="inline-flex items-center text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors mb-4 uppercase tracking-widest">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Quay lại Lịch sử
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-900">
              Chi tiết đơn hàng
            </h1>
            <p className="text-zinc-500 mt-2 font-mono text-lg bg-zinc-50 px-2 py-1 rounded inline-block border border-zinc-200">
              #{order.id}
            </p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest border rounded inline-flex items-center ${getStatusColor(order.status)}`}>
              {order.status === "COMPLETED" ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : 
               order.status === "DELIVERING" ? <Truck className="w-3.5 h-3.5 mr-1.5" /> : 
               <Clock className="w-3.5 h-3.5 mr-1.5" />}
              {getStatusText(order.status)}
            </span>
            <p className="text-sm text-zinc-500 mt-2">
              Đặt ngày {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm") : "N/A"}
            </p>
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
                      src={item.imageUrl ? (item.imageUrl.startsWith("http") ? item.imageUrl : `http://localhost:8080/api/v1/images/${item.imageUrl}`) : `https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80`} 
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

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShoppingBag, Receipt } from "lucide-react";

import { useCart } from "../../context/CartContext";

export const VnpayReturnPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchCart } = useCart();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");
  
  // Thông tin giao dịch từ VNPay
  const [txnRef, setTxnRef] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    const vnpAmount = searchParams.get("vnp_Amount");
    const vnpTxnRef = searchParams.get("vnp_TxnRef");
    
    if (vnpTxnRef) setTxnRef(vnpTxnRef);
    if (vnpAmount) setAmount(Number(vnpAmount) / 100);

    if (!vnpAmount) {
      setStatus("error");
      setMessage("Không tìm thấy thông tin giao dịch.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = "http://localhost:8080/api/v1/payment/vnpay-return";
        
        const response = await axios.get(`${API_URL}${location.search}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (response.data.status === "success") {
          setStatus("success");
          setMessage("Thanh toán thành công! Cảm ơn bạn đã mua sắm tại PeakSneaker.");
          fetchCart(); // Cập nhật lại giỏ hàng
        } else {
          setStatus("error");
          setMessage("Thanh toán thất bại hoặc có lỗi xảy ra trong quá trình giao dịch.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Giao dịch đã bị hủy hoặc chữ ký xác thực không hợp lệ.");
      }
    };

    verifyPayment();
  }, [location.search]);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="min-h-[70vh] bg-zinc-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-zinc-100 relative overflow-hidden">
        
        {/* Pattern Background Overlay */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-zinc-100/50 to-transparent pointer-events-none"></div>

        {status === "loading" && (
          <div className="text-center py-12 relative z-10">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-zinc-900 mb-6" strokeWidth={1.5} />
            <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">Đang xử lý</h2>
            <p className="text-zinc-500">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-100 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-green-600" strokeWidth={2} />
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter mb-3">Thanh toán thành công</h2>
              <p className="text-zinc-500 text-sm md:text-base">{message}</p>
            </div>

            <div className="bg-zinc-50 rounded-xl p-6 mb-8 border border-zinc-100">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-200 pb-2">Chi tiết giao dịch</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">Mã đơn hàng</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono bg-white px-2 py-1 rounded border border-zinc-200">{txnRef}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                  <span className="text-sm text-zinc-500">Số tiền thanh toán</span>
                  <span className="text-lg font-black text-zinc-900">{formatPrice(amount)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                  <span className="text-sm text-zinc-500">Phương thức</span>
                  <span className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png" alt="VNPay" className="h-4 object-contain" />
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link 
                to="/orders" 
                className="group flex items-center justify-center gap-2 w-full py-3.5 bg-zinc-900 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg"
              >
                <Receipt className="w-4 h-4" />
                Đơn hàng của tôi
              </Link>
              <Link 
                to="/shop" 
                className="group flex items-center justify-center gap-2 w-full py-3.5 bg-white text-zinc-900 text-sm font-bold uppercase tracking-widest rounded-xl border-2 border-zinc-200 hover:border-zinc-900 transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-100 shadow-sm">
              <XCircle className="w-10 h-10 text-red-500" strokeWidth={2} />
            </div>
            
            <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter mb-4">Giao dịch thất bại</h2>
            <p className="text-zinc-500 mb-8">{message}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm mx-auto">
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-zinc-900 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg"
              >
                Thử lại
              </button>
              <Link 
                to="/" 
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-white text-zinc-900 text-sm font-bold uppercase tracking-widest rounded-xl border-2 border-zinc-200 hover:border-zinc-900 transition-all"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

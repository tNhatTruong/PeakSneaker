import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";

export const VnpayReturnPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // Nếu không có tham số vnp_Amount, có thể người dùng truy cập trực tiếp
    if (!searchParams.get("vnp_Amount")) {
      setStatus("error");
      setMessage("Không tìm thấy thông tin giao dịch.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = "http://localhost:8080/api/v1/payment/vnpay-return";
        
        // Chuyển toàn bộ query sang API
        const response = await axios.get(`${API_URL}${location.search}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (response.data.status === "success") {
          setStatus("success");
          setMessage("Thanh toán thành công! Cảm ơn bạn đã mua hàng.");
        } else {
          setStatus("error");
          setMessage("Thanh toán thất bại hoặc có lỗi xảy ra.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Giao dịch đã bị hủy hoặc chữ ký không hợp lệ.");
      }
    };

    verifyPayment();
  }, [location.search]);

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[60vh]">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center border border-gray-100">
        {status === "loading" && (
          <div className="animate-pulse">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">{message}</h2>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 uppercase tracking-wider">Thành công!</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <div className="space-y-4">
              <Link to="/order-history" className="block w-full py-3 bg-black text-white font-medium uppercase tracking-widest hover:bg-gray-800 transition-colors">
                Xem đơn hàng
              </Link>
              <Link to="/" className="block w-full py-3 bg-white text-black border border-black font-medium uppercase tracking-widest hover:bg-gray-50 transition-colors">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 uppercase tracking-wider">Thất bại!</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <div className="space-y-4">
              <button 
                onClick={() => navigate(-1)} 
                className="block w-full py-3 bg-black text-white font-medium uppercase tracking-widest hover:bg-gray-800 transition-colors"
              >
                Thử lại
              </button>
              <Link to="/" className="block w-full py-3 bg-white text-black border border-black font-medium uppercase tracking-widest hover:bg-gray-50 transition-colors">
                Về trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

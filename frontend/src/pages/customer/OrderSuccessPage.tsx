import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, ShoppingBag, Receipt, ArrowRight } from "lucide-react";

export const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to home if accessed without proper state
  if (!location.state || !location.state.orderId) {
    navigate("/");
    return null;
  }

  const { orderId } = location.state;

  return (
    <div className="min-h-[70vh] bg-zinc-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl w-full bg-white shadow-2xl rounded-2xl overflow-hidden border border-zinc-100">
        
        {/* Header - Success */}
        <div className="bg-zinc-900 px-6 py-8 text-center border-b-[6px] border-green-500">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white mb-6 shadow-inner">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Đặt hàng thành công!</h2>
          <p className="mt-3 text-sm text-zinc-300 font-medium tracking-wide">
            Cảm ơn bạn đã mua sắm tại PeakSneaker.
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-10 space-y-8 bg-zinc-50/50">
          
          <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
            <p className="text-zinc-600 mb-1 text-sm font-semibold uppercase tracking-wider">Mã đơn hàng của bạn</p>
            <p className="text-2xl font-black text-zinc-900 tracking-wider">#{orderId}</p>
            <p className="text-xs text-zinc-500 mt-2">Sử dụng mã này để theo dõi tiến trình đơn hàng của bạn trong phần Lịch sử mua hàng.</p>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
            <p className="text-sm text-blue-800 font-medium leading-relaxed">
              Chúng tôi sẽ sớm liên hệ với bạn để xác nhận đơn hàng và tiến hành giao hàng. Phương thức thanh toán của bạn là <span className="font-bold">Thanh toán khi nhận hàng (COD)</span>.
            </p>
          </div>

        </div>

        {/* Actions */}
        <div className="px-8 py-6 bg-white border-t border-zinc-100 flex flex-col sm:flex-row gap-4">
          <Link
            to="/shop"
            className="flex-1 flex justify-center items-center px-6 py-4 border-2 border-zinc-900 text-sm font-bold rounded-lg text-zinc-900 bg-transparent hover:bg-zinc-50 transition-colors uppercase tracking-wider"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Tiếp tục mua sắm
          </Link>
          <Link
            to={`/orders/${orderId}`}
            className="flex-1 flex justify-center items-center px-6 py-4 border-2 border-transparent text-sm font-bold rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/20 uppercase tracking-wider"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Xem đơn hàng
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

      </div>
    </div>
  );
};

import { Package, Search, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getOrders } from "../../services/orderService";
import type { OrderResponse } from "../../services/orderService";
import { format } from "date-fns";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // Tương lai có thể thêm pagination: const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getOrders(0, 50); // Tạm lấy 50 đơn
        setOrders(data?.items || []);
      } catch (error) {
        console.error("Lỗi khi tải lịch sử đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = (orders || []).filter(order => 
    order?.id?.toString().includes(searchQuery)
  );

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "COMPLETED": return { color: "bg-green-100 text-green-800 border-green-200", text: "Đã giao hàng" };
      case "DELIVERING": return { color: "bg-blue-100 text-blue-800 border-blue-200", text: "Đang vận chuyển" };
      case "PROCESSING": return { color: "bg-purple-100 text-purple-800 border-purple-200", text: "Đang xử lý" };
      case "PENDING": return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", text: "Chờ xác nhận" };
      case "CANCELLED": return { color: "bg-red-100 text-red-800 border-red-200", text: "Đã hủy" };
      default: return { color: "bg-zinc-100 text-zinc-800 border-zinc-200", text: status };
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl min-h-[70vh]">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-900">
          Lịch Sử Đơn Hàng
        </h1>
        <p className="text-zinc-500 mt-2">
          Theo dõi trạng thái giao hàng và xem lại các sản phẩm bạn đã mua.
        </p>
      </div>

      <div className="bg-white border border-zinc-200 p-6 md:p-8 shadow-sm">
        
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn hàng..." 
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none text-sm transition-colors"
            />
          </div>
          <div className="text-sm text-zinc-500">
            Hiển thị <span className="font-bold text-zinc-900">{filteredOrders.length}</span> đơn hàng
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
             <Loader2 className="h-10 w-10 text-zinc-300 animate-spin mb-4" />
             <p className="text-zinc-500 text-sm">Đang tải lịch sử đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Package className="h-16 w-16 text-zinc-300 mb-4" strokeWidth={1} />
            <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-wider mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-zinc-500 mb-6 text-sm">Bạn chưa thực hiện giao dịch nào trên hệ thống.</p>
            <Link to="/shop" className="bg-zinc-900 text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">
              Bắt đầu mua sắm
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-zinc-900 text-zinc-900 uppercase tracking-wider font-bold bg-zinc-50/50">
                    <th className="py-4 px-3">Mã Đơn</th>
                    <th className="py-4 px-3">Ngày Đặt</th>
                    <th className="py-4 px-3">Sản Phẩm</th>
                    <th className="py-4 px-3">Tổng Tiền</th>
                    <th className="py-4 px-3">Trạng Thái</th>
                    <th className="py-4 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 && (
                     <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500">Không tìm thấy đơn hàng phù hợp với "{searchQuery}"</td>
                     </tr>
                  )}
                  {filteredOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const itemCount = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
                    
                    return (
                    <tr key={order.id} className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors group">
                      <td className="py-4 px-3 font-bold text-zinc-900">#{order.id}</td>
                      <td className="py-4 px-3 text-zinc-600">
                        {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm") : "---"}
                      </td>
                      <td className="py-4 px-3 text-zinc-600">{itemCount} sản phẩm</td>
                      <td className="py-4 px-3 font-black text-zinc-900">{formatPrice(order.finalAmount)}</td>
                      <td className="py-4 px-3">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border rounded inline-flex items-center gap-1.5 ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <Link to={`/orders/${order.id}`} className="text-zinc-500 hover:text-zinc-900 font-semibold uppercase text-xs tracking-widest inline-flex items-center transition-colors">
                          Chi tiết <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-4">
               {filteredOrders.length === 0 && (
                  <div className="py-8 text-center text-zinc-500">Không tìm thấy đơn hàng phù hợp với "{searchQuery}"</div>
               )}
              {filteredOrders.map((order) => {
                 const statusInfo = getStatusInfo(order.status);
                 const itemCount = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
                 return (
                <div key={order.id} className="border border-zinc-200 p-5 bg-white rounded flex flex-col gap-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-zinc-900">#{order.id}</span>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border rounded ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 flex justify-between bg-zinc-50 p-3 rounded border border-zinc-100">
                    <span>{order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy") : "---"}</span>
                    <span className="font-medium text-zinc-700">{itemCount} sản phẩm</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-zinc-100">
                    <span className="font-black text-lg text-zinc-900">{formatPrice(order.finalAmount)}</span>
                    <Link to={`/orders/${order.id}`} className="text-zinc-900 font-bold uppercase text-xs inline-flex items-center border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50">
                      Chi tiết <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </div>
              )})}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// Helper inline components for icons inside badge


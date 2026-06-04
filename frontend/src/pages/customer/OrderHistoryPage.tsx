import { Package, Search, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function OrderHistoryPage() {
  // Mock Data cho Đơn hàng
  const orders = [
    {
      id: "ORD-982371",
      date: "02/06/2026",
      total: 8530000,
      status: "COMPLETED", // COMPLETED, DELIVERING, PENDING, CANCELLED
      statusText: "Đã giao hàng",
      itemCount: 2
    },
    {
      id: "ORD-982405",
      date: "04/06/2026",
      total: 3040000,
      status: "DELIVERING",
      statusText: "Đang vận chuyển",
      itemCount: 1
    },
    {
      id: "ORD-911002",
      date: "15/05/2026",
      total: 5490000,
      status: "CANCELLED",
      statusText: "Đã hủy",
      itemCount: 1
    }
  ];

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
      case "DELIVERING": return "bg-blue-100 text-blue-800 border-blue-200";
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-zinc-100 text-zinc-800 border-zinc-200";
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

      <div className="bg-white border border-zinc-200 p-6 md:p-8">
        
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm theo mã đơn hàng..." 
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none text-sm transition-colors"
            />
          </div>
          <div className="text-sm text-zinc-500">
            Hiển thị <span className="font-bold text-zinc-900">{orders.length}</span> đơn hàng
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-900 text-zinc-900 uppercase tracking-wider font-bold">
                <th className="py-4 px-2">Mã Đơn</th>
                <th className="py-4 px-2">Ngày Đặt</th>
                <th className="py-4 px-2">Số Lượng</th>
                <th className="py-4 px-2">Tổng Tiền</th>
                <th className="py-4 px-2">Trạng Thái</th>
                <th className="py-4 px-2 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors">
                  <td className="py-4 px-2 font-bold text-zinc-900">{order.id}</td>
                  <td className="py-4 px-2 text-zinc-600">{order.date}</td>
                  <td className="py-4 px-2 text-zinc-600">{order.itemCount} sản phẩm</td>
                  <td className="py-4 px-2 font-semibold text-zinc-900">{formatPrice(order.total)}</td>
                  <td className="py-4 px-2">
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded-sm inline-flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                      {order.status === "DELIVERING" && <TruckIcon />}
                      {order.status === "COMPLETED" && <CheckIcon />}
                      {order.statusText}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <button className="text-zinc-500 hover:text-zinc-900 font-semibold uppercase text-xs tracking-widest inline-flex items-center">
                      Chi tiết <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-zinc-200 p-4 bg-zinc-50 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-zinc-900">{order.id}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-sm ${getStatusColor(order.status)}`}>
                  {order.statusText}
                </span>
              </div>
              <div className="text-xs text-zinc-500 flex justify-between">
                <span>Ngày: {order.date}</span>
                <span>{order.itemCount} sản phẩm</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                <span className="font-bold text-zinc-900">{formatPrice(order.total)}</span>
                <button className="text-zinc-500 font-semibold uppercase text-xs inline-flex items-center">
                  Chi tiết <ChevronRight className="h-3 w-3 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (Optional: if orders.length === 0) */}
        {orders.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <Package className="h-16 w-16 text-zinc-300 mb-4" strokeWidth={1} />
            <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-wider mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-zinc-500 mb-6 text-sm">Bạn chưa thực hiện giao dịch nào trên hệ thống.</p>
            <Link to="/shop" className="bg-zinc-900 text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">
              Bắt đầu mua sắm
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

// Helper inline components for icons inside badge
function TruckIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-9h-5V5h-7"/><path d="M15 8h4l3 3v6h-2"/><circle cx="8.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>; }
function CheckIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }

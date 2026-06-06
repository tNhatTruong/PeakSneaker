import { Search, Filter, Eye, MoreHorizontal, X, Check, Truck, Clock, XCircle } from "lucide-react";
import { useState } from "react";

export default function AdminOrdersPage() {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const orders = [
    { id: "ORD-001", customer: "Nguyễn Văn A", date: "04-06-2026", total: "10,980,000 ₫", status: "Hoàn thành", payment: "Đã thanh toán" },
    { id: "ORD-002", customer: "Trần Thị B", date: "04-06-2026", total: "2,350,000 ₫", status: "Đang giao", payment: "COD" },
    { id: "ORD-003", customer: "Lê Văn C", date: "03-06-2026", total: "5,490,000 ₫", status: "Chờ xác nhận", payment: "Chưa thanh toán" },
    { id: "ORD-004", customer: "Phạm D", date: "02-06-2026", total: "1,200,000 ₫", status: "Đã hủy", payment: "Hoàn tiền" },
    { id: "ORD-005", customer: "Hoàng E", date: "01-06-2026", total: "3,890,000 ₫", status: "Hoàn thành", payment: "Đã thanh toán" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Quản lý Đơn hàng</h1>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm mã đơn hoặc tên khách..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
            />
          </div>
          <button className="flex items-center justify-center px-4 py-2 text-sm font-medium border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Lọc trạng thái
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3 font-medium">Mã đơn</th>
                <th className="px-6 py-3 font-medium">Khách hàng</th>
                <th className="px-6 py-3 font-medium">Ngày đặt</th>
                <th className="px-6 py-3 font-medium">Tổng tiền</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium">Thanh toán</th>
                <th className="px-6 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900">{order.id}</td>
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4 text-zinc-500">{order.date}</td>
                  <td className="px-6 py-4 font-medium">{order.total}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${order.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' : 
                        order.status === 'Đang giao' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Đã hủy' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }
                    `}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">{order.payment}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { setSelectedOrder(order); setIsDetailModalOpen(true); }}
                      className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors mr-2" 
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { setSelectedOrder(order); setIsStatusModalOpen(true); }}
                      className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors" 
                      title="Cập nhật trạng thái"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi Tiết Đơn Hàng */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Chi tiết đơn hàng {selectedOrder.id}</h3>
                <p className="text-sm text-zinc-500 mt-1">Đặt lúc: {selectedOrder.date}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 p-1 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {/* Thông tin khách hàng */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500 mb-1">Khách hàng</p>
                  <p className="font-medium text-zinc-900">{selectedOrder.customer}</p>
                  <p className="text-zinc-600 mt-1">SĐT: 0912345678</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Địa chỉ giao hàng</p>
                  <p className="text-zinc-900">123 Đường ABC, Quận X, TP. Hồ Chí Minh</p>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-3">Sản phẩm đã đặt</h4>
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-2 font-medium">Sản phẩm</th>
                        <th className="px-4 py-2 font-medium">Đơn giá</th>
                        <th className="px-4 py-2 font-medium">SL</th>
                        <th className="px-4 py-2 font-medium text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      <tr>
                        <td className="px-4 py-3">Air Jordan 1 Retro (Size 42)</td>
                        <td className="px-4 py-3">5,490,000 ₫</td>
                        <td className="px-4 py-3">1</td>
                        <td className="px-4 py-3 text-right font-medium">5,490,000 ₫</td>
                      </tr>
                      {/* Thêm món nữa nếu cần để Mock */}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tổng kết */}
              <div className="flex justify-end text-sm">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-zinc-500">
                    <span>Tạm tính</span>
                    <span>5,490,000 ₫</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Phí vận chuyển</span>
                    <span>30,000 ₫</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Mã giảm giá</span>
                    <span className="text-green-600">-30,000 ₫</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-zinc-900 pt-2 border-t border-zinc-200">
                    <span>Tổng cộng</span>
                    <span>{selectedOrder.total}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-zinc-100 flex justify-end">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cập Nhật Trạng Thái */}
      {isStatusModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900">Cập nhật đơn {selectedOrder.id}</h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <button className="w-full flex items-center p-3 rounded border border-zinc-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <Clock className="w-5 h-5 text-blue-500 mr-3" />
                <span className="font-medium text-sm text-zinc-700">Chờ xác nhận</span>
              </button>
              <button className="w-full flex items-center p-3 rounded border border-zinc-200 hover:border-yellow-500 hover:bg-yellow-50 transition-colors">
                <Truck className="w-5 h-5 text-yellow-500 mr-3" />
                <span className="font-medium text-sm text-zinc-700">Đang giao hàng</span>
              </button>
              <button className="w-full flex items-center p-3 rounded border border-zinc-200 hover:border-green-500 hover:bg-green-50 transition-colors">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span className="font-medium text-sm text-zinc-700">Hoàn thành</span>
              </button>
              <button className="w-full flex items-center p-3 rounded border border-zinc-200 hover:border-red-500 hover:bg-red-50 transition-colors">
                <XCircle className="w-5 h-5 text-red-500 mr-3" />
                <span className="font-medium text-sm text-zinc-700">Hủy đơn hàng</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

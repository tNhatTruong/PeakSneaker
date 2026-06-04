import { Search, Filter, Eye, MoreHorizontal } from "lucide-react";

export default function AdminOrdersPage() {
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
                    <button className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors mr-2" title="Xem chi tiết">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors" title="Thêm hành động">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

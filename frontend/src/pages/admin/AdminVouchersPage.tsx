import { Plus, Search, Edit2, Trash2 } from "lucide-react";

export default function AdminVouchersPage() {
  const vouchers = [
    { id: 1, code: "NEWBIE500", type: "Trừ tiền mặt", value: "500.000 ₫", exp: "30-06-2026", limit: "Không giới hạn", status: "Active" },
    { id: 2, code: "PEAKSUMMER", type: "Phần trăm", value: "20%", exp: "15-06-2026", limit: "100 lượt", status: "Active" },
    { id: 3, code: "FREESHIP", type: "Phí vận chuyển", value: "50.000 ₫", exp: "31-12-2026", limit: "Không giới hạn", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Quản lý Khuyến mãi</h1>
        <button className="flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Tạo Voucher
        </button>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm mã voucher..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3 font-medium">Mã Code</th>
                <th className="px-6 py-3 font-medium">Loại giảm</th>
                <th className="px-6 py-3 font-medium">Giá trị</th>
                <th className="px-6 py-3 font-medium">Giới hạn</th>
                <th className="px-6 py-3 font-medium">Hết hạn</th>
                <th className="px-6 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900">{v.code}</td>
                  <td className="px-6 py-4">{v.type}</td>
                  <td className="px-6 py-4 text-red-600 font-medium">{v.value}</td>
                  <td className="px-6 py-4 text-zinc-500">{v.limit}</td>
                  <td className="px-6 py-4 text-zinc-500">{v.exp}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-zinc-400 hover:text-blue-600 transition-colors mr-1" title="Sửa">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-zinc-400 hover:text-red-600 transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
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

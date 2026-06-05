import { Plus, Search, Edit2, Trash2 } from "lucide-react";

export default function AdminProductsPage() {
  const products = [
    { id: "SP01", name: "Air Jordan 1 Retro", price: "5,490,000 ₫", stock: 124, brand: "NIKE", status: "Đang bán" },
    { id: "SP02", name: "Nike Air Force 1", price: "2,990,000 ₫", stock: 85, brand: "NIKE", status: "Đang bán" },
    { id: "SP03", name: "Adidas Yeezy Boost", price: "6,500,000 ₫", stock: 0, brand: "ADIDAS", status: "Hết hàng" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Quản lý Sản phẩm</h1>
        <button className="flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Thêm Sản Phẩm
        </button>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm tên, mã sản phẩm..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3 font-medium">Sản phẩm</th>
                <th className="px-6 py-3 font-medium">Thương hiệu</th>
                <th className="px-6 py-3 font-medium">Giá bán</th>
                <th className="px-6 py-3 font-medium">Tổng tồn kho</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{p.name}</div>
                    <div className="text-xs text-zinc-500">{p.id}</div>
                  </td>
                  <td className="px-6 py-4">{p.brand}</td>
                  <td className="px-6 py-4 font-medium">{p.price}</td>
                  <td className="px-6 py-4">{p.stock}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${p.status === 'Đang bán' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    `}>
                      {p.status}
                    </span>
                  </td>
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

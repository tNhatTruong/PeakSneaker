import { Search, Save } from "lucide-react";

export default function AdminInventoryPage() {
  const variants = [
    { id: 1, product: "Air Jordan 1 Retro", size: "40", color: "Đen/Đỏ", stock: 15 },
    { id: 2, product: "Air Jordan 1 Retro", size: "41", color: "Đen/Đỏ", stock: 8 },
    { id: 3, product: "Air Jordan 1 Retro", size: "42", color: "Đen/Đỏ", stock: 0 },
    { id: 4, product: "Nike Air Force 1", size: "40", color: "Trắng", stock: 50 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Quản lý Kho (Biến thể)</h1>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Lọc theo tên sản phẩm..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
            />
          </div>
          <button className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-zinc-800 transition-colors">
            <Save className="w-4 h-4 mr-2" /> Lưu thay đổi
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3 font-medium">Tên Sản phẩm</th>
                <th className="px-6 py-3 font-medium">Màu sắc</th>
                <th className="px-6 py-3 font-medium">Kích cỡ (Size)</th>
                <th className="px-6 py-3 font-medium text-right">Tồn kho hiện tại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {variants.map((v) => (
                <tr key={v.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900">{v.product}</td>
                  <td className="px-6 py-4">{v.color}</td>
                  <td className="px-6 py-4 font-medium">{v.size}</td>
                  <td className="px-6 py-4 text-right">
                    <input 
                      type="number" 
                      defaultValue={v.stock}
                      className={`w-24 px-3 py-1.5 text-right text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 ${v.stock === 0 ? 'border-red-300 bg-red-50 text-red-900' : 'border-zinc-300'}`}
                    />
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

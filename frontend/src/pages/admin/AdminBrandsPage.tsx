import { Plus, Search, Edit2, Trash2, X } from "lucide-react";
import { useState } from "react";

export default function AdminBrandsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Chuyển brands thành state để có thể mock tính năng thêm mới trên UI
  const [brands, setBrands] = useState([
    { id: 1, name: "NIKE", lines: 5, logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" },
    { id: 2, name: "ADIDAS", lines: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg" },
    { id: 3, name: "NEW BALANCE", lines: 2, logo: "https://upload.wikimedia.org/wikipedia/commons/e/ea/New_Balance_logo.svg" },
  ]);

  const handleAddBrand = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newBrandName = formData.get("brandName") as string;
    const newLogoUrl = formData.get("logoUrl") as string;

    if (newBrandName && newLogoUrl) {
      setBrands([
        ...brands,
        {
          id: brands.length + 1,
          name: newBrandName.toUpperCase(),
          lines: 0,
          logo: newLogoUrl
        }
      ]);
      setIsAddModalOpen(false); // Đóng modal sau khi thêm
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Thương Hiệu & Dòng Giày</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Thương Hiệu
        </button>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm thương hiệu..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3 font-medium">Logo</th>
                <th className="px-6 py-3 font-medium">Tên Hãng</th>
                <th className="px-6 py-3 font-medium">Số dòng giày</th>
                <th className="px-6 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 flex items-center justify-center p-2 bg-zinc-50 border border-zinc-100 rounded">
                       <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900">{brand.name}</td>
                  <td className="px-6 py-4 text-zinc-500">
                    <button className="text-zinc-900 font-medium hover:underline">
                      {brand.lines} dòng (Xem chi tiết)
                    </button>
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
              {brands.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    Chưa có thương hiệu nào. Hãy thêm mới!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup Modal Thêm Thương Hiệu */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900">Thêm Thương Hiệu Mới</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleAddBrand} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tên Thương Hiệu <span className="text-red-500">*</span></label>
                <input 
                  required 
                  name="brandName"
                  type="text" 
                  placeholder="Ví dụ: ASICS" 
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Đường dẫn Logo (URL) <span className="text-red-500">*</span></label>
                <input 
                  required 
                  name="logoUrl"
                  type="url" 
                  placeholder="https://..." 
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Mô tả chi tiết (Tùy chọn)</label>
                <textarea 
                  name="description"
                  rows={3} 
                  placeholder="Nhập mô tả hoặc câu chuyện thương hiệu..." 
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow resize-none"
                ></textarea>
              </div>
              
              {/* Modal Footer */}
              <div className="pt-4 mt-6 border-t border-zinc-100 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="px-4 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  Lưu Thương Hiệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  )
}

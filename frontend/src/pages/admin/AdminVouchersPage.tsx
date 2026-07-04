import { Plus, Search, Edit2, Trash2, X } from "lucide-react";
import { VoucherService, type VoucherRequest, type VoucherParams, type VoucherResponse } from "../../services/admin/adminVoucherService";
import { useState, useEffect } from "react";

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<VoucherParams>({
    query: "",
    isActive: undefined,
    page: 0,
    size: 10,
  });
  const [totalElements, setTotalElements] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherResponse | null>(null);
  const [formData, setFormData] = useState<VoucherRequest>({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: null,
    startAt: "",
    expireAt: "",
    isActive: true,
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const data = await VoucherService.getVouchers(params);
      setVouchers(data.items || []);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error("fetch error: " + error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVouchers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [params]);

  const handleOpenModal = (voucher?: VoucherResponse) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minOrderAmount: voucher.minOrderAmount,
        maxDiscountAmount: voucher.maxDiscountAmount,
        usageLimit: voucher.usageLimit,
        startAt: voucher.startAt ? new Date(voucher.startAt).toISOString().slice(0, 16) : "",
        expireAt: voucher.expireAt ? new Date(voucher.expireAt).toISOString().slice(0, 16) : "",
        isActive: voucher.isActive ?? true,
      });
    } else {
      setEditingVoucher(null);
      setFormData({
        code: "",
        discountType: "PERCENTAGE",
        discountValue: 0,
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        usageLimit: null,
        startAt: "",
        expireAt: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVoucher(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        startAt: formData.startAt ? new Date(formData.startAt).toISOString() : undefined,
        expireAt: formData.expireAt ? new Date(formData.expireAt).toISOString() : undefined,
      };

      if (editingVoucher) {
        await VoucherService.updateVoucher(editingVoucher.id, payload);
        alert("Cập nhật voucher thành công");
      } else {
        await VoucherService.createVoucher(payload);
        alert("Tạo voucher thành công");
      }
      handleCloseModal();
      fetchVouchers();
    } catch (error) {
      console.error("Lỗi khi lưu voucher", error);
      alert("Có lỗi xảy ra khi lưu voucher");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa voucher này?")) {
      try {
        await VoucherService.deleteVoucher(id);
        alert("Xóa voucher thành công");
        fetchVouchers();
      } catch (error) {
        console.error("Lỗi khi xóa voucher", error);
        alert("Có lỗi xảy ra khi xóa voucher");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Quản lý Khuyến mãi</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo Voucher
        </button>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              value={params.query}
              onChange={(e) => setParams(prev => ({ ...prev, query: e.target.value, page: 0 }))}
              placeholder="Tìm mã voucher..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
            />
          </div>
          <div className="w-full sm:w-48">
            <select 
              value={params.isActive === undefined ? "" : params.isActive ? "true" : "false"}
              onChange={(e) => {
                const val = e.target.value;
                setParams(prev => ({ 
                  ...prev, 
                  isActive: val === "" ? undefined : val === "true",
                  page: 0
                }));
              }}
              className="w-full px-4 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 bg-white"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Đã vô hiệu hóa</option>
            </select>
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
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">Đang tải dữ liệu...</td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">Không tìm thấy voucher nào</td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr className="hover:bg-zinc-50 transition-colors" key={v.id}>
                    <td className="px-6 py-4 font-bold text-zinc-900">{v.code}</td>
                    <td className="px-6 py-4">{v.discountType === "FIXED" ? "Cố định" : "Phần trăm"}</td>
                    <td className="px-6 py-4 text-red-600 font-medium">
                      {v.discountType === "FIXED" 
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.discountValue || 0)
                        : `${v.discountValue}%`}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{v.usageLimit ? `${v.usedCount || 0} / ${v.usageLimit}` : 'Không giới hạn'}</td>
                    <td className="px-6 py-4 text-zinc-500">{v.expireAt ? new Date(v.expireAt).toLocaleDateString('vi-VN') : 'Không thời hạn'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {v.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleOpenModal(v)} className="p-2 text-zinc-400 hover:text-blue-600 transition-colors mr-1" title="Sửa">
                          <Edit2 className="w-4 h-4"/>
                       </button>
                       <button onClick={() => handleDelete(v.id)} className="p-2 text-zinc-400 hover:text-red-600 transition-colors" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Phân trang */}
        <div className="p-4 border-t border-zinc-200 flex justify-between items-center text-sm text-zinc-500">
          <div>Hiển thị {vouchers.length} / {totalElements} kết quả</div>
          <div className="flex gap-2">
            <button 
              disabled={params.page === 0}
              onClick={() => setParams(prev => ({ ...prev, page: (prev.page || 0) - 1 }))}
              className="px-3 py-1 border border-zinc-200 rounded hover:bg-zinc-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button 
              disabled={vouchers.length < (params.size || 10)}
              onClick={() => setParams(prev => ({ ...prev, page: (prev.page || 0) + 1 }))}
              className="px-3 py-1 border border-zinc-200 rounded hover:bg-zinc-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tạo/Sửa Voucher */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-200">
              <h2 className="text-xl font-bold text-zinc-900">{editingVoucher ? 'Sửa Voucher' : 'Tạo Voucher Mới'}</h2>
              <button onClick={handleCloseModal} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="voucher-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-zinc-700">Mã Code *</label>
                    <input 
                      required
                      type="text" 
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950"
                      placeholder="VD: SUMMER24"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-zinc-700">Trạng thái</label>
                    <select 
                      value={formData.isActive ? "true" : "false"}
                      onChange={(e) => setFormData({...formData, isActive: e.target.value === "true"})}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 bg-white"
                    >
                      <option value="true">Đang hoạt động</option>
                      <option value="false">Vô hiệu hóa</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-zinc-700">Loại giảm giá</label>
                    <select 
                      value={formData.discountType}
                      onChange={(e) => setFormData({...formData, discountType: e.target.value as "FIXED" | "PERCENTAGE"})}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 bg-white"
                    >
                      <option value="PERCENTAGE">Phần trăm (%)</option>
                      <option value="FIXED">Số tiền cố định</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-zinc-700">Giá trị giảm *</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      value={formData.discountValue || ""}
                      onChange={(e) => setFormData({...formData, discountValue: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950"
                      placeholder={formData.discountType === "PERCENTAGE" ? "VD: 10" : "VD: 50000"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-zinc-700">Đơn hàng tối thiểu</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.minOrderAmount || ""}
                      onChange={(e) => setFormData({...formData, minOrderAmount: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950"
                      placeholder="VD: 200000"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-zinc-700">Giảm tối đa (Nếu chọn %)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.maxDiscountAmount || ""}
                      onChange={(e) => setFormData({...formData, maxDiscountAmount: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950"
                      placeholder="VD: 50000"
                      disabled={formData.discountType === "FIXED"}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">Giới hạn số lượt dùng (Để trống nếu không giới hạn)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.usageLimit || ""}
                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value ? Number(e.target.value) : null})}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950"
                    placeholder="VD: 100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-zinc-700">Thời gian bắt đầu</label>
                    <input 
                      type="datetime-local" 
                      value={formData.startAt || ""}
                      onChange={(e) => setFormData({...formData, startAt: e.target.value})}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-zinc-700">Thời gian kết thúc</label>
                    <input 
                      type="datetime-local" 
                      value={formData.expireAt || ""}
                      onChange={(e) => setFormData({...formData, expireAt: e.target.value})}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950"
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={handleCloseModal}
                className="px-4 py-2 border border-zinc-300 text-zinc-700 font-medium rounded-md hover:bg-zinc-100 transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                form="voucher-form"
                className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-md hover:bg-zinc-800 transition-colors"
              >
                {editingVoucher ? 'Lưu thay đổi' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

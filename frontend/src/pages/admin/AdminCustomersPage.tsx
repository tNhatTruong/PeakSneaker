import { Search, Ban, CheckCircle2, AlertTriangle, Filter, Calendar, Edit, X, RefreshCw, Loader2, UserCog } from "lucide-react";
import { useState, useEffect } from "react";
import { AdminUserService, type UserResponse } from "../../services/admin/adminUserService";
import toast from "react-hot-toast";

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  // Edit form
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("Tất cả");
  const [selectedRole, setSelectedRole] = useState<string>("Tất cả");
  
  const getInitialMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  const [specificMonth, setSpecificMonth] = useState<string>(getInitialMonth());

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { page, size: pageSize };

      if (debouncedQuery.trim()) params.query = debouncedQuery.trim();
      
      if (selectedStatus === "Hoạt động") params.isActive = true;
      else if (selectedStatus === "Bị khóa") params.isActive = false;

      if (selectedRole === "Khách hàng") params.role = "USER";
      else if (selectedRole === "Quản trị viên") params.role = "ADMIN";

      if (specificMonth) params.specificMonth = specificMonth;

      const res = await AdminUserService.getUsers(params);
      if (res && res.items) {
        setUsers(res.items);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debouncedQuery, selectedStatus, selectedRole, specificMonth, page]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("Tất cả");
    setSelectedRole("Tất cả");
    setSpecificMonth(getInitialMonth());
    setPage(0);
    toast.success("Đã cài lại bộ lọc");
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    const toastId = toast.loading("Đang cập nhật...");
    try {
      await AdminUserService.updateUserStatus(selectedUser.id, !selectedUser.isActive);
      toast.success("Cập nhật trạng thái thành công!", { id: toastId });
      setIsConfirmModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại.", { id: toastId });
    }
  };

  const handleUpdateRole = async (role: 'USER' | 'ADMIN') => {
    if (!selectedUser) return;
    const toastId = toast.loading("Đang cập nhật quyền...");
    try {
      await AdminUserService.updateUserRole(selectedUser.id, role);
      toast.success("Cập nhật quyền thành công!", { id: toastId });
      setIsRoleModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại.", { id: toastId });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmittingEdit(true);
    try {
      await AdminUserService.updateUserInfo(selectedUser.id, editForm);
      toast.success("Cập nhật thông tin thành công!");
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const statusOptions = ["Tất cả", "Hoạt động", "Bị khóa"];
  const roleOptions = ["Tất cả", "Khách hàng", "Quản trị viên"];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Quản lý Khách hàng</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Hiển thị <span className="font-semibold text-zinc-800">{totalElements}</span> người dùng
          </p>
        </div>
        <button
          onClick={handleClearFilters}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all rounded-lg"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Cài lại bộ lọc
        </button>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-zinc-50/80 border-b border-zinc-100 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bộ lọc & Tìm kiếm</span>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            {/* Search */}
            <div className="lg:col-span-8">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Tìm kiếm người dùng
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  placeholder="Nhập họ tên, email, sđt..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all placeholder-zinc-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); setPage(0); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Month Picker */}
            <div className="lg:col-span-4">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Tháng tham gia
              </label>
              <input
                type="month"
                value={specificMonth}
                onChange={(e) => { setSpecificMonth(e.target.value); setPage(0); }}
                className="w-full px-3 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all text-zinc-700"
              />
            </div>
          </div>

          {/* Status & Role Tabs */}
          <div className="pt-4 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                Trạng thái tài khoản
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => { setSelectedStatus(status); setPage(0); }}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-150 ${
                      selectedStatus === status
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                Quyền hạn (Role)
              </label>
              <div className="flex flex-wrap gap-2">
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    onClick={() => { setSelectedRole(role); setPage(0); }}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-150 ${
                      selectedRole === role
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin h-10 w-10 text-zinc-950" />
            <p className="text-sm font-semibold text-zinc-500">Đang tải danh sách...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-3">
            <Ban className="h-12 w-12 text-zinc-300" />
            <h3 className="text-base font-bold text-zinc-800">Không tìm thấy người dùng</h3>
            <p className="text-sm text-zinc-500 max-w-sm">Không có người dùng nào khớp với điều kiện lọc hiện tại.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-3.5">Khách hàng</th>
                  <th className="px-6 py-3.5">Liên hệ</th>
                  <th className="px-6 py-3.5">Ngày tham gia</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">#{user.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-700">{user.email}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        user.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${
                        user.role === 'ADMIN' ? 'text-purple-700 bg-purple-50' : 'text-blue-700 bg-blue-50'
                      }`}>
                        {user.role === 'ADMIN' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2 justify-end">
                        <button 
                          onClick={() => { 
                            setSelectedUser(user); 
                            setEditForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone });
                            setIsEditModalOpen(true); 
                          }}
                          className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" 
                          title="Sửa thông tin"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setSelectedUser(user); setIsRoleModalOpen(true); }}
                          className="p-1.5 text-zinc-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-all" 
                          title="Phân quyền"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
                        {user.isActive ? (
                          <button 
                            onClick={() => { setSelectedUser(user); setIsConfirmModalOpen(true); }}
                            className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded transition-all" 
                            title="Khóa tài khoản"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => { setSelectedUser(user); setIsConfirmModalOpen(true); }}
                            className="p-1.5 text-zinc-500 hover:text-green-600 hover:bg-green-50 rounded transition-all" 
                            title="Mở khóa tài khoản"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Trang <span className="font-semibold text-zinc-900">{page + 1}</span> / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-all"
              >
                Trước
              </button>
              <button
                disabled={page === totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-all"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Xác Nhận Khóa/Mở Khóa */}
      {isConfirmModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${selectedUser.isActive ? 'bg-red-100' : 'bg-green-100'}`}>
                <AlertTriangle className={`h-6 w-6 ${selectedUser.isActive ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">
                Xác nhận {selectedUser.isActive ? 'Khóa' : 'Mở khóa'} tài khoản
              </h3>
              <p className="text-sm text-zinc-500 mb-6">
                Bạn có chắc chắn muốn {selectedUser.isActive ? 'khóa' : 'mở khóa'} tài khoản của <span className="font-medium text-zinc-900">{selectedUser.firstName} {selectedUser.lastName}</span>?
                {selectedUser.isActive && " Họ sẽ không thể đăng nhập vào hệ thống."}
              </p>
              <div className="flex justify-center space-x-3">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleToggleStatus}
                  className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm ${selectedUser.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa Thông Tin */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-zinc-200">
              <h3 className="text-lg font-bold text-zinc-900">Sửa thông tin cơ bản</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Họ *</label>
                  <input
                    type="text" required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Tên *</label>
                  <input
                    type="text" required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Số điện thoại *</label>
                <input
                  type="text" required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-950"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" disabled={submittingEdit}
                  className="flex items-center px-5 py-2 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
                >
                  {submittingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Phân Quyền */}
      {isRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-zinc-200">
              <h3 className="text-lg font-bold text-zinc-900">Phân quyền tài khoản</h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-zinc-600 mb-4">
                Chọn quyền hạn cho người dùng <span className="font-semibold text-zinc-900">{selectedUser.firstName} {selectedUser.lastName}</span>:
              </p>
              
              <button
                onClick={() => handleUpdateRole('USER')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  selectedUser.role === 'USER' ? 'border-blue-500 bg-blue-50/50' : 'border-zinc-200 hover:border-blue-200'
                }`}
              >
                <div className="text-left">
                  <div className="font-bold text-sm text-zinc-900">User (Khách hàng)</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Quyền mua sắm cơ bản</div>
                </div>
                {selectedUser.role === 'USER' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
              </button>

              <button
                onClick={() => handleUpdateRole('ADMIN')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  selectedUser.role === 'ADMIN' ? 'border-purple-500 bg-purple-50/50' : 'border-zinc-200 hover:border-purple-200'
                }`}
              >
                <div className="text-left">
                  <div className="font-bold text-sm text-zinc-900">Admin (Quản trị viên)</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Toàn quyền hệ thống</div>
                </div>
                {selectedUser.role === 'ADMIN' && <CheckCircle2 className="w-5 h-5 text-purple-500" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

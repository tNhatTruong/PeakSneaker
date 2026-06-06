import { Search, Ban, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function AdminCustomersPage() {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const users = [
    { id: 1, name: "Trần Nhật Trường", email: "truong@gmail.com", phone: "0912345678", joined: "15-05-2026", status: "Active" },
    { id: 2, name: "Nguyễn Thiết Hình", email: "hinh@gmail.com", phone: "0987654321", joined: "20-05-2026", status: "Active" },
    { id: 3, name: "Le Hacker", email: "spam@hacker.com", phone: "0123012301", joined: "01-06-2026", status: "Banned" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Quản lý Khách hàng</h1>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo email, tên, sđt..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3 font-medium">Khách hàng</th>
                <th className="px-6 py-3 font-medium">Số điện thoại</th>
                <th className="px-6 py-3 font-medium">Ngày tham gia</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{user.name}</div>
                    <div className="text-zinc-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">{user.phone}</td>
                  <td className="px-6 py-4 text-zinc-500">{user.joined}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    `}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.status === 'Active' ? (
                      <button 
                        onClick={() => { setSelectedUser(user); setIsConfirmModalOpen(true); }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors" 
                        title="Khóa tài khoản"
                      >
                        <Ban className="w-3.5 h-3.5 mr-1.5" /> Khóa
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setSelectedUser(user); setIsConfirmModalOpen(true); }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors" 
                        title="Mở khóa tài khoản"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mở khóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Xác Nhận Khóa/Mở Khóa */}
      {isConfirmModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-6 text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${selectedUser.status === 'Active' ? 'bg-red-100' : 'bg-green-100'}`}>
                <AlertTriangle className={`h-6 w-6 ${selectedUser.status === 'Active' ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">
                Xác nhận {selectedUser.status === 'Active' ? 'Khóa' : 'Mở khóa'} tài khoản
              </h3>
              <p className="text-sm text-zinc-500 mb-6">
                Bạn có chắc chắn muốn {selectedUser.status === 'Active' ? 'khóa' : 'mở khóa'} tài khoản của người dùng <span className="font-medium text-zinc-900">{selectedUser.name}</span> không?
                {selectedUser.status === 'Active' && " Họ sẽ không thể đăng nhập vào hệ thống sau khi bị khóa."}
              </p>
              <div className="flex justify-center space-x-3">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors shadow-sm ${selectedUser.status === 'Active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

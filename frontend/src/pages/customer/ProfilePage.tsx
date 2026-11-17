import { User, Package, MapPin, Settings, Loader2, ShieldCheck, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import OrderHistoryPage from "./OrderHistoryPage";
import AddressBookTab from "./AddressBookTab";
import AccountSettingsTab from "./AccountSettingsTab";
import { AuthService, isStaffOrAdminRole, getRoleDisplayName, type UserResponse } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("info");
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await AuthService.getMe();
        setUser(data);
        if (data.fullName) {
          const parts = data.fullName.split(" ");
          setFirstName(parts.shift() || "");
          setLastName(parts.join(" ") || "");
        }
        setPhone(data.phone || "");
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải thông tin hồ sơ.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    try {
      setIsSaving(true);
      await AuthService.updateMe({ firstName, lastName, phone });
      toast.success("Cập nhật thông tin thành công!");
      // reload user info
      const data = await AuthService.getMe();
      setUser(data);
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật thông tin thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Đăng xuất thành công!");
    navigate("/login");
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-zinc-300" /></div>;
  }
  
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-8 lg:flex-row">
        
        {/* Sidebar */}
        <div className="w-full flex-shrink-0 lg:w-64">
          <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg uppercase">
                {user?.fullName ? user.fullName.charAt(0) : "U"}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900">{user?.fullName || "Người dùng"}</h3>
                {(() => {

                  const isAdmin = isStaffOrAdminRole(user?.role);
                  return (
                    <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded mt-1 ${isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-zinc-200 text-zinc-700'}`}>
                      {isAdmin ? getRoleDisplayName(user?.role) : 'Khách hàng'}
                    </span>
                  );
                })()}
              </div>
            </div>

            {(() => {

              const isAdmin = isStaffOrAdminRole(user?.role);
              return isAdmin ? (
                <Link
                  to="/admin/dashboard"
                  className="mb-4 flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-zinc-950" />
                  <span>Vào Trang Quản Trị</span>
                </Link>
              ) : null;
            })()}
            
            <nav className="space-y-2">
              <button onClick={() => setActiveTab("info")} className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'info' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                <User className="w-4 h-4 mr-3" /> Thông tin cá nhân
              </button>
              <button onClick={() => setActiveTab("orders")} className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'orders' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                <Package className="w-4 h-4 mr-3" /> Đơn hàng của tôi
              </button>
              <button onClick={() => setActiveTab("address")} className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'address' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                <MapPin className="w-4 h-4 mr-3" /> Sổ địa chỉ
              </button>
              <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'settings' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                <Settings className="w-4 h-4 mr-3" /> Cài đặt tài khoản
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-3" /> Đăng xuất
              </button>
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'info' && (
            <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm">
              <h2 className="text-2xl font-bold text-zinc-900 mb-6 tracking-tight">Thông tin cá nhân</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Họ</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full px-4 py-2.5 border border-zinc-300 rounded-md focus:ring-zinc-900 focus:border-zinc-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Tên</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full px-4 py-2.5 border border-zinc-300 rounded-md focus:ring-zinc-900 focus:border-zinc-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Số điện thoại</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full px-4 py-2.5 border border-zinc-300 rounded-md focus:ring-zinc-900 focus:border-zinc-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Email (Không thể thay đổi)</label>
                  <input type="email" value={user?.email || ""} disabled className="w-full px-4 py-2.5 border border-zinc-200 bg-zinc-50 rounded-md text-zinc-500" />
                </div>
                <div className="pt-4 flex items-center gap-4">
                  <button type="submit" disabled={isSaving} className="px-6 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest rounded-md hover:bg-zinc-800 disabled:bg-zinc-400 transition-colors flex items-center">
                    {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang lưu...</> : "Lưu Thay Đổi"}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'orders' && (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div>
                <OrderHistoryPage />
              </div>
            </div>
          )}
          {activeTab === 'address' && (
            <AddressBookTab />
          )}

          {activeTab === 'settings' && user && (
             <AccountSettingsTab user={user} onUpdateUser={() => {
                AuthService.getMe().then(setUser);
             }} />
          )}
        </div>
      </div>
    </div>
  )
}

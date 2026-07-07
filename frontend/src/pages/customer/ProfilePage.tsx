import { User, Package, MapPin, Settings, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import OrderHistoryPage from "./OrderHistoryPage";
import AddressBookTab from "./AddressBookTab";
import AccountSettingsTab from "./AccountSettingsTab";
import { AuthService, type UserResponse } from "../../services/authService";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("info");
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-zinc-300" /></div>;
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg uppercase">
                {user?.fullName ? user.fullName.charAt(0) : "U"}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900">{user?.fullName || "Người dùng"}</h3>
                <p className="text-xs text-zinc-500 uppercase font-semibold mt-0.5">{user?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</p>
              </div>
            </div>
            
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
              <div className="scale-95 origin-top">
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

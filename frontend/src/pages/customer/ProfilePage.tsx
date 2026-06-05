import { User, Package, MapPin, Settings } from "lucide-react";
import { useState } from "react";
import OrderHistoryPage from "./OrderHistoryPage";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("info");
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">
                H
              </div>
              <div>
                <h3 className="font-bold text-zinc-900">Thiết Hình</h3>
                <p className="text-xs text-zinc-500">Khách hàng Vàng</p>
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
              <form className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Họ và Tên</label>
                    <input type="text" defaultValue="Nguyễn Thiết Hình" className="w-full px-4 py-2.5 border border-zinc-300 rounded-md focus:ring-zinc-900 focus:border-zinc-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Số điện thoại</label>
                    <input type="tel" defaultValue="0987654321" className="w-full px-4 py-2.5 border border-zinc-300 rounded-md focus:ring-zinc-900 focus:border-zinc-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Email (Không thể thay đổi)</label>
                  <input type="email" defaultValue="hinh@gmail.com" disabled className="w-full px-4 py-2.5 border border-zinc-200 bg-zinc-50 rounded-md text-zinc-500" />
                </div>
                <div className="pt-4">
                  <button type="button" className="px-6 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest rounded-md hover:bg-zinc-800 transition-colors">
                    Lưu Thay Đổi
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
        </div>
      </div>
    </div>
  )
}

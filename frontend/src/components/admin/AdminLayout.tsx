import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Tags,
  ShoppingBag,
  Layers,
  Ticket,
  Search,
  Bell,
  LogOut,
  Menu,
  FolderTree
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-zinc-50">Đang tải...</div>;
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Đơn hàng", path: "/admin/orders", icon: Package },
    { name: "Danh mục", path: "/admin/categories", icon: FolderTree },
    { name: "Sản phẩm", path: "/admin/products", icon: ShoppingBag },
    { name: "Kho & Biến thể", path: "/admin/inventory", icon: Layers },
    { name: "Thương hiệu", path: "/admin/brands", icon: Tags },
    { name: "Khách hàng", path: "/admin/customers", icon: Users },
    { name: "Khuyến mãi", path: "/admin/vouchers", icon: Ticket },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden font-sans">

      {/* Sidebar (Desktop & Mobile) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-black">
          <Link to="/admin/dashboard" className="text-xl font-black uppercase tracking-widest text-white">
            PEAK ADMIN
          </Link>
          <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            &times;
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-zinc-800">
          <button onClick={logout} className="flex items-center w-full px-4 py-3 text-sm font-medium text-zinc-400 rounded-md hover:bg-white/5 hover:text-white transition-colors mb-2">
            <LogOut className="w-5 h-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-zinc-200">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-zinc-500" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="pl-10 pr-4 py-2 w-64 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-zinc-400 hover:text-zinc-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
              AD
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-50 p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

    </div>
  );
}

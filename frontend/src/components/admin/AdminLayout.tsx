import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Tags,
  ShoppingBag,
  Layers,
  Ticket,
  Bell,
  LogOut,
  Menu,
  FolderTree,
  RotateCcw,
  Boxes,
  TrendingUp,
  Search,
  ExternalLink,
  ShieldCheck,
  History,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { isStaffOrAdminRole, getRoleDisplayName } from "../../services/authService";
import logo from "../../assets/logo.png";

interface AdminNavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  roles?: string[]; // Danh sách vai trò được phép truy cập (nếu rỗng/undefined thì cho phép tất cả nhân sự)
}

interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export default function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    const desktopMedia = window.matchMedia("(min-width: 1280px)");
    const handleViewportChange = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) setSidebarOpen(false);
    };

    handleViewportChange(desktopMedia);
    desktopMedia.addEventListener("change", handleViewportChange);
    return () => desktopMedia.removeEventListener("change", handleViewportChange);
  }, []);

  if (isLoading) {
    return <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50">Đang tải...</div>;
  }

  const isStaffOrAdmin = isStaffOrAdminRole(user?.role);

  if (!isAuthenticated || !isStaffOrAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = (user?.role || "").trim().toUpperCase();

  const isRoleAllowedForItem = (item: AdminNavItem): boolean => {
    if (!userRole) return false;
    // Super Admin & Admin có toàn quyền truy cập tất cả các phân hệ
    if (
      userRole === "ROLE_SUPER_ADMIN" ||
      userRole === "SUPER_ADMIN" ||
      userRole === "ROLE_ADMIN" ||
      userRole === "ADMIN"
    ) {
      return true;
    }
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some((r) => {
      const rUpper = r.trim().toUpperCase();
      return rUpper === userRole || `ROLE_${rUpper}` === userRole || rUpper === `ROLE_${userRole}`;
    });
  };

  const navGroups: AdminNavGroup[] = [
    {
      label: "Bàn làm việc & Dự báo",
      items: [
        {
          name: "Tổng quan",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
          roles: ["SUPER_ADMIN", "ADMIN", "STAFF_MANAGER", "WAREHOUSE", "SALES", "SUPPORT", "MARKETING"],
        },
        {
          name: "Dự báo & Cảnh báo",
          path: "/admin/forecast",
          icon: TrendingUp,
          roles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE"],
        },
      ],
    },
    {
      label: "Đơn hàng & Vận hành",
      items: [
        {
          name: "Đơn hàng",
          path: "/admin/orders",
          icon: Package,
          roles: ["SUPER_ADMIN", "ADMIN", "SALES", "SUPPORT"],
        },
        {
          name: "Đổi trả (RMA)",
          path: "/admin/returns",
          icon: RotateCcw,
          roles: ["SUPER_ADMIN", "ADMIN", "SALES", "SUPPORT", "WAREHOUSE"],
        },
      ],
    },
    {
      label: "Sản phẩm & Kho vận",
      items: [
        {
          name: "Sản phẩm",
          path: "/admin/products",
          icon: ShoppingBag,
          roles: ["SUPER_ADMIN", "ADMIN", "MARKETING", "WAREHOUSE", "SALES", "SUPPORT"],
        },
        {
          name: "Tồn kho & Biến thể",
          path: "/admin/inventory",
          icon: Layers,
          roles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE"],
        },
        {
          name: "Lô hàng & Truy xuất",
          path: "/admin/batches",
          icon: Boxes,
          roles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE"],
        },
        {
          name: "Danh mục",
          path: "/admin/categories",
          icon: FolderTree,
          roles: ["SUPER_ADMIN", "ADMIN", "MARKETING"],
        },
        {
          name: "Thương hiệu",
          path: "/admin/brands",
          icon: Tags,
          roles: ["SUPER_ADMIN", "ADMIN", "MARKETING"],
        },
      ],
    },
    {
      label: "Kinh doanh & Hệ thống",
      items: [
        {
          name: "Khách hàng",
          path: "/admin/customers",
          icon: Users,
          roles: ["SUPER_ADMIN", "ADMIN", "STAFF_MANAGER", "SALES", "SUPPORT"],
        },
        {
          name: "Nhân sự & Phân quyền",
          path: "/admin/staff",
          icon: ShieldCheck,
          roles: ["SUPER_ADMIN", "ADMIN", "STAFF_MANAGER"],
        },
        {
          name: "Khuyến mãi",
          path: "/admin/vouchers",
          icon: Ticket,
          roles: ["SUPER_ADMIN", "ADMIN", "MARKETING", "SALES"],
        },
        {
          name: "Nhật ký Hoạt động",
          path: "/admin/audit-logs",
          icon: History,
          roles: ["SUPER_ADMIN", "ADMIN", "STAFF_MANAGER"],
        },
      ],
    },
  ];

  // Lọc động: Chỉ hiển thị các mục menu được phân quyền cho vai trò hiện tại
  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(isRoleAllowedForItem),
    }))
    .filter((group) => group.items.length > 0);

  const allowedNavItems = visibleNavGroups.flatMap((group) => group.items);

  // Tìm nhanh chỉ gợi ý các phân hệ được phép truy cập
  const quickResults = quickQuery.trim()
    ? allowedNavItems
        .filter((item) =>
          item.name.toLocaleLowerCase("vi").includes(quickQuery.trim().toLocaleLowerCase("vi"))
        )
        .slice(0, 5)
    : [];

  // Route Guarding: Kiểm tra quyền truy cập đường dẫn hiện tại
  const currentPath = location.pathname;
  const isCurrentPathAllowed =
    userRole === "ROLE_SUPER_ADMIN" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "ROLE_ADMIN" ||
    userRole === "ADMIN" ||
    allowedNavItems.some(
      (item) => item.path === currentPath || currentPath.startsWith(item.path + "/")
    );

  const fallbackPath = allowedNavItems[0]?.path || "/admin/dashboard";

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-zinc-50 font-sans">

      {/* Sidebar (Desktop & Mobile) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-[228px] flex-col bg-slate-950 text-white transform transition-transform duration-300 ease-in-out
        xl:relative xl:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <Link to="/admin/dashboard" className="flex items-center gap-3 text-white">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-white p-1.5">
              <img src={logo} alt="" className="h-full w-full object-contain" />
            </span>
            <span>
              <strong className="block text-sm font-black tracking-tight">PeakSneaker</strong>
              <small className="block text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Admin</small>
            </span>
          </Link>
          <button className="text-zinc-400 hover:text-white xl:hidden" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu quản trị">
            &times;
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-3">
          {visibleNavGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex h-10 items-center rounded-lg px-3 text-xs font-semibold transition-colors ${isActive ? "bg-blue-600 text-white shadow-sm shadow-blue-950/30" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-zinc-800 p-3">
          <button onClick={logout} className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-400 rounded-md hover:bg-red-500/10 hover:text-red-300 transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-4 lg:px-5">
          <div className="flex min-w-0 items-center">
            <button className="mr-3 shrink-0 text-zinc-500 xl:hidden" onClick={() => setSidebarOpen(true)} aria-label="Mở menu quản trị">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden w-[min(38vw,500px)] lg:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={quickQuery}
                onChange={(event) => setQuickQuery(event.target.value)}
                placeholder="Tìm nhanh chức năng quản trị..."
                aria-label="Tìm nhanh chức năng quản trị"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              {quickResults.length > 0 && (
                <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  {quickResults.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.path} to={item.path} onClick={() => setQuickQuery("")} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950">
                        <Icon className="h-4 w-4" /> {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-sm"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              <span>Xem cửa hàng</span>
            </Link>

            <button className="relative p-2 text-zinc-400 hover:text-zinc-600 transition-colors" title="Thông báo">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                {user?.fullName ? user.fullName.charAt(0) : "AD"}
              </div>
              <div className="hidden text-left 2xl:block">
                <p className="text-xs font-bold text-zinc-900 leading-tight">{user?.fullName || "Quản trị viên"}</p>
                <p className="text-[10px] text-amber-600 font-semibold uppercase">{getRoleDisplayName(user?.role)}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-3 sm:p-4 lg:p-5">
          <div className="mx-auto w-full max-w-[1800px]">
            {!isCurrentPathAllowed ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm max-w-lg mx-auto mt-12 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80 shadow-sm">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Phân hệ không thuộc quyền truy cập
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                    Tài khoản của bạn (<span className="font-bold text-slate-700">{getRoleDisplayName(user?.role)}</span>) không được phân công phụ trách không gian làm việc này. Vui lòng liên hệ Quản lý Nhân sự nếu bạn cần được cấp quyền bổ sung.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <Link
                    to={fallbackPath}
                    className="inline-flex h-9 items-center gap-2 px-4 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition shadow-sm"
                  >
                    Về bàn làm việc của bạn
                  </Link>
                  <Link
                    to="/"
                    className="inline-flex h-9 items-center gap-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                  >
                    Xem cửa hàng
                  </Link>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

    </div>
  );
}

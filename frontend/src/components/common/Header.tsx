import { ShoppingBag, Search, Menu, User, X, Heart, ShieldAlert } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import CartDrawer from "../customer/CartDrawer";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { isStaffOrAdminRole } from "../../services/authService";
import logoImg from "../../assets/logo.png";
import GlobalProductSearch from "./GlobalProductSearch";

export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const { itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  const isAdmin = isStaffOrAdminRole(user?.role);
  const navigate = useNavigate();

  useEffect(() => {
    const desktopMedia = window.matchMedia("(min-width: 1280px)");
    const wideDesktopMedia = window.matchMedia("(min-width: 1536px)");
    const syncOverlays = () => {
      if (desktopMedia.matches) setIsMobileMenuOpen(false);
      if (wideDesktopMedia.matches) setIsMobileSearchOpen(false);
    };

    syncOverlays();
    desktopMedia.addEventListener("change", syncOverlays);
    wideDesktopMedia.addEventListener("change", syncOverlays);
    return () => {
      desktopMedia.removeEventListener("change", syncOverlays);
      wideDesktopMedia.removeEventListener("change", syncOverlays);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 xl:px-8">
          <div className="grid h-[72px] grid-cols-[auto_minmax(0,1fr)] items-center gap-2 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-5 2xl:gap-8">
            {/* LEFT: Logo */}
            <div className="flex justify-start">
              <Link
                to="/"
                className="inline-flex items-center transition-opacity duration-200 hover:opacity-80"
              >
                <img
                  src={logoImg}
                  alt="PeakSneaker"
                  className="h-12 w-auto max-w-36 object-contain sm:h-14 sm:max-w-44"
                />
              </Link>
            </div>

            {/* CENTER: Desktop Navigation */}
            <nav className="hidden min-w-0 items-center justify-center gap-4 whitespace-nowrap xl:flex 2xl:gap-7">
              <Link to="/" className="relative group py-2 text-xs font-bold uppercase tracking-[0.1em] text-zinc-900 2xl:text-sm">
                <span>Trang chủ</span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link to="/shop?category=giay-sneaker" className="relative group py-2 text-xs font-bold uppercase tracking-[0.1em] text-zinc-900 2xl:text-sm">
                <span>Sneaker</span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link to="/shop?category=phu-kien-sneaker" className="relative group py-2 text-xs font-bold uppercase tracking-[0.1em] text-zinc-900 2xl:text-sm">
                <span>Phụ Kiện</span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link to="/brands" className="relative group py-2 text-xs font-bold uppercase tracking-[0.1em] text-zinc-900 2xl:text-sm">
                <span>Thương Hiệu</span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link to="/vouchers" className="relative group flex items-center gap-1 py-2 text-xs font-bold uppercase tracking-[0.1em] text-red-600 2xl:text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span>Khuyến Mãi</span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link to="/contact" className="relative group py-2 text-xs font-bold uppercase tracking-[0.1em] text-zinc-900 2xl:text-sm">
                <span>Liên Hệ</span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
            </nav>

            {/* RIGHT: Icons + Mobile Menu Button */}
            <div className="flex min-w-0 items-center justify-end gap-0.5 sm:gap-1.5">
              {/* Mobile Menu Button */}
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-zinc-900 xl:hidden" aria-label="Mở menu">
                <Menu className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-2 text-zinc-900 transition-colors hover:text-zinc-600 2xl:hidden"
                aria-label="Mở tìm kiếm sản phẩm"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Search */}
              <div className="hidden 2xl:block">
                <GlobalProductSearch />
              </div>

              {isAuthenticated && isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="hidden items-center gap-1.5 rounded-md bg-amber-400 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-amber-950 shadow-sm shadow-amber-500/20 transition-all hover:bg-amber-300 2xl:inline-flex"
                  title="Truy cập Bảng điều khiển Quản trị viên"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-950" />
                  <span>Admin</span>
                </Link>
              )}

              {isAuthenticated ? (
                <div className="relative group">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-1 p-2 text-zinc-900 hover:text-zinc-600 transition-colors"
                    title="Tài khoản cá nhân"
                  >
                    <User className="h-5 w-5" />
                    <span className="hidden text-sm font-medium 2xl:block">
                      {user?.fullName?.split(" ").pop()}
                    </span>
                  </Link>
                  <div className="absolute right-0 w-52 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1">
                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100/80 border-b border-amber-200/70 transition-colors"
                        >
                          <ShieldAlert className="h-4 w-4 text-amber-600" />
                          <span>Trang Quản Trị</span>
                        </Link>
                      )}
                      <Link to="/profile" className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100">Hồ sơ của tôi</Link>
                      <Link to="/orders" className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100">Đơn mua</Link>
                      <Link to="/wishlist" className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100">Sản phẩm yêu thích</Link>
                      <Link to="/cart" className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100">Giỏ hàng</Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-zinc-100"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="p-2 text-zinc-900 hover:text-zinc-600 transition-colors"
                  title="Đăng nhập"
                >
                  <User className="h-5 w-5" />
                </Link>
              )}

              <Link
                to="/wishlist"
                className="hidden p-2 text-zinc-900 transition-colors hover:text-zinc-600 sm:inline-flex"
                title="Sản phẩm yêu thích"
              >
                <Heart className="h-5 w-5" />
              </Link>

              <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-zinc-900 hover:text-zinc-600 transition-colors" title="Giỏ hàng">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[70] bg-white px-4 py-5 2xl:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between border-b border-zinc-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">PeakSneaker</p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-zinc-900">Tìm sản phẩm</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="flex h-10 w-10 items-center justify-center border border-zinc-200 text-zinc-900"
              aria-label="Đóng tìm kiếm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mx-auto mt-5 max-w-xl">
            <GlobalProductSearch
              mode="mobile"
              autoFocus
              onNavigate={() => setIsMobileSearchOpen(false)}
            />
            <p className="mt-4 text-xs leading-5 text-zinc-500">Nhập ít nhất 2 ký tự để xem gợi ý.</p>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex xl:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative flex h-[100dvh] w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300">
            <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-100">
              <span className="text-base font-extrabold tracking-tighter text-zinc-900 uppercase">Danh Mục</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-900 hover:text-zinc-500 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col px-6 py-6 space-y-6 overflow-y-auto">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors">Trang chủ</Link>
              <Link to="/shop?category=giay-sneaker" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors">Sneaker</Link>
              <Link to="/shop?category=phu-kien-sneaker" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors">Phụ Kiện</Link>
              <Link to="/brands" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors">Thương Hiệu</Link>
              <div className="border-t border-zinc-100 pt-6 mt-2 space-y-4">
                <Link to="/vouchers" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-red-600 uppercase tracking-wide hover:text-red-500 transition-colors flex items-center">
                  Khuyến Mãi
                </Link>
                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors flex items-center">
                  Liên Hệ
                </Link>
                <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors flex items-center">
                  Sản Phẩm Yêu Thích
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 p-2.5 rounded-lg uppercase tracking-wide transition-colors flex items-center gap-2"
                  >
                    <ShieldAlert className="h-4 w-4 text-amber-700" />
                    Trang Quản Trị (Admin)
                  </Link>
                )}
                {isAuthenticated ? (
                  <div className="border-t border-zinc-100 pt-4 space-y-3">
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors flex items-center"
                    >
                      Hồ sơ ({user?.fullName || "Tôi"})
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors flex items-center"
                    >
                      Đơn mua
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="text-sm font-bold text-red-600 uppercase tracking-wide hover:text-red-500 transition-colors flex items-center w-full text-left"
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-zinc-100 pt-4">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors flex items-center"
                    >
                      Đăng nhập / Đăng ký
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

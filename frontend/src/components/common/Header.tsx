import { ShoppingBag, Search, Menu, User, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import CartDrawer from "../customer/CartDrawer";
import { useCart } from "../../context/CartContext";

export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [userName, setUserName] = useState(localStorage.getItem("fullName") || "");
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
      setUserName(localStorage.getItem("fullName") || "");
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("fullName");
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Mobile Menu Button */}
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-zinc-900">
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <div className="flex-1 md:flex-none text-center md:text-left">
              <Link to="/" className="text-2xl font-extrabold tracking-tighter text-zinc-900 uppercase">
                PeakSneaker
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex flex-1 justify-center space-x-8">
              <Link to="/" className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">Trang chủ</Link>
              <Link to="/shop?category=new" className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">Mới Nhất</Link>
              <Link to="/shop?gender=men" className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">Nam</Link>
              <Link to="/shop?gender=women" className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">Nữ</Link>
              <Link to="/shop?category=accessories" className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">Phụ Kiện</Link>
              <Link to="/brands" className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">Thương Hiệu</Link>
              <Link to="/vouchers" className="text-sm font-semibold text-red-600 hover:text-red-500 transition-colors uppercase tracking-wide">Khuyến Mãi</Link>
            </nav>

            {/* Right Icons */}
            <div className="flex items-center space-x-4 md:space-x-6">
              <button className="p-2 text-zinc-900 hover:text-zinc-600 transition-colors hidden md:block">
                <Search className="h-5 w-5" />
              </button>
              
              {isLoggedIn ? (
                <div className="relative group">
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-1 p-2 text-zinc-900 hover:text-zinc-600 transition-colors" 
                    title="Tài khoản cá nhân"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium hidden md:block">
                      {userName.split(" ").pop()}
                    </span>
                  </Link>
                  <div className="absolute right-0 w-48 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100">Hồ sơ của tôi</Link>
                      <Link to="/orders" className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100">Đơn mua</Link>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative w-[80%] max-w-sm bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
            <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-100">
              <span className="text-base font-extrabold tracking-tighter text-zinc-900 uppercase">Danh Mục</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-900 hover:text-zinc-500 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col px-6 py-6 space-y-6 overflow-y-auto">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors">Trang chủ</Link>
              <Link to="/shop?category=new" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors">Mới Nhất</Link>
              <Link to="/shop?gender=men" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors">Nam</Link>
              <Link to="/shop?gender=women" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors">Nữ</Link>
              <Link to="/shop?category=accessories" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors">Phụ Kiện</Link>
              <Link to="/brands" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors">Thương Hiệu</Link>
              <div className="border-t border-zinc-100 pt-6 mt-2">
                <Link to="/vouchers" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-red-600 uppercase tracking-wide hover:text-red-500 transition-colors flex items-center">
                  Khuyến Mãi
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

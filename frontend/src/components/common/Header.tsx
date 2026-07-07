import { ShoppingBag, Search, Menu, User, X, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import CartDrawer from "../customer/CartDrawer";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import logoImg from "../../assets/logo.png";
import { ProductService, type ProductResponse } from "../../services/productService";
import { useDebounce } from "../../hooks/useDebounce";

export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 400);
  const searchRef = useRef<HTMLDivElement>(null);

  const { itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedSearch.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        setIsSearching(true);
        const res = await ProductService.filterProducts({ search: debouncedSearch, size: 5 });
        setSearchResults(res.items);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setIsSearching(false);
      }
    };
    fetchSearchResults();
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-[1fr_auto_1fr] h-20 items-center gap-4 lg:gap-6 xl:gap-10">
            {/* LEFT: Logo */}
            <div className="flex justify-start">
              <Link
                to="/"
                className="inline-flex items-center transition-opacity duration-200 hover:opacity-80"
              >
                <img
                  src={logoImg}
                  alt="PeakSneaker"
                  className="h-16 w-auto object-contain"
                  style={{ maxWidth: '220px' }}
                />
              </Link>
            </div>

            {/* CENTER: Desktop Navigation */}
            <nav className="hidden lg:flex items-center justify-center space-x-5 xl:space-x-8 whitespace-nowrap">
              <Link to="/" className="relative group text-sm font-bold text-zinc-900 uppercase tracking-widest py-2">
                <span>Trang chủ</span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link to="/shop?sortBy=createdAt&sortDirection=desc" className="relative group text-sm font-bold text-zinc-900 uppercase tracking-widest py-2">
                <span>Mới Nhất</span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link to="/shop?categoryId=1" className="relative group text-sm font-bold text-zinc-900 uppercase tracking-widest py-2">
                <span>Sneaker</span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link to="/shop?categoryId=3" className="relative group text-sm font-bold text-zinc-900 uppercase tracking-widest py-2">
                <span>Phụ Kiện</span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link to="/brands" className="relative group text-sm font-bold text-zinc-900 uppercase tracking-widest py-2">
                <span>Thương Hiệu</span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link to="/vouchers" className="relative group text-sm font-bold text-red-600 uppercase tracking-widest py-2 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span>Khuyến Mãi</span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
            </nav>

            {/* RIGHT: Icons + Mobile Menu Button */}
            <div className="flex justify-end items-center space-x-3">
              {/* Mobile Menu Button */}
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-zinc-900">
                <Menu className="h-6 w-6" />
              </button>

              {/* Search */}
              <div className="relative hidden lg:block" ref={searchRef}>
                <form onSubmit={handleSearchSubmit} className="flex items-center group relative w-48 xl:w-56 focus-within:w-56 xl:focus-within:w-64 transition-all duration-300">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors duration-300" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!isSearchOpen) setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    className="block w-full pl-10 pr-10 py-2 border border-zinc-300 rounded-full text-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-white transition-all shadow-sm group-focus-within:shadow-md"
                  />
                  {isSearching ? (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
                    </div>
                  ) : searchQuery ? (
                    <button type="button" onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <X className="h-4 w-4 text-zinc-400 hover:text-zinc-600 transition-colors" />
                    </button>
                  ) : null}

                  {/* Suggestions Dropdown */}
                  {isSearchOpen && debouncedSearch && searchResults.length > 0 && (
                    <div className="absolute top-full right-0 mt-3 w-[22rem] bg-white rounded-xl shadow-2xl border border-zinc-100 overflow-hidden z-50">
                      <div className="p-2">
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSearchQuery("");
                            }}
                            className="flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-lg transition-colors"
                          >
                            <img
                              src={product.defaultImageUrl}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-md bg-zinc-100"
                            />
                            <div className="flex-1 overflow-hidden">
                              <h4 className="text-sm font-bold text-zinc-900 truncate">{product.name}</h4>
                              <div className="text-xs font-semibold text-zinc-500 mt-0.5">
                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.price || product.basePrice)}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-zinc-100 bg-zinc-50 p-3 text-center">
                        <Link
                          to={`/shop?search=${encodeURIComponent(debouncedSearch)}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="text-xs font-bold text-zinc-600 uppercase hover:text-zinc-900 transition-colors"
                        >
                          Xem tất cả kết quả
                        </Link>
                      </div>
                    </div>
                  )}
                  
                  {/* No results */}
                  {isSearchOpen && debouncedSearch && searchResults.length === 0 && !isSearching && (
                    <div className="absolute top-full right-0 mt-3 w-[22rem] bg-white rounded-xl shadow-2xl border border-zinc-100 overflow-hidden z-50">
                      <div className="p-6 text-center text-zinc-500 text-sm">
                        Không tìm thấy kết quả nào cho "{debouncedSearch}"
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {isAuthenticated ? (
                <div className="relative group">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-1 p-2 text-zinc-900 hover:text-zinc-600 transition-colors"
                    title="Tài khoản cá nhân"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium hidden md:block">
                      {user?.fullName?.split(" ").pop()}
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
              <Link to="/shop?sortBy=createdAt&sortDirection=desc" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors">Mới Nhất</Link>
              <Link to="/shop?categoryId=1" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors">Sneaker</Link>
              <Link to="/shop?categoryId=3" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-zinc-900 uppercase tracking-wide hover:text-zinc-600 transition-colors">Phụ Kiện</Link>
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

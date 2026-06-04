import { useState } from "react";
import { Filter, Search, ChevronDown, SlidersHorizontal } from "lucide-react";
import ProductCard from "../../components/customer/ProductCard";

export default function ShopPage() {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Hardcode data (Mock Data)
  const products = [
    { id: "1", name: "Nike Air Force 1 '07", price: 2990000, category: "Lifestyle", imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600" },
    { id: "2", name: "Jordan 1 Retro High OG", price: 5490000, category: "Jordan", imageUrl: "https://images.unsplash.com/photo-1605340537586-0a5a228fdd64?auto=format&fit=crop&q=80&w=600" },
    { id: "3", name: "New Balance 550", price: 3290000, category: "Lifestyle", imageUrl: "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600" },
    { id: "4", name: "Adidas Yeezy Boost 350 V2", price: 6590000, category: "Yeezy", imageUrl: "https://images.unsplash.com/photo-1620012253295-c15ce331ff61?auto=format&fit=crop&q=80&w=600" },
    { id: "5", name: "Nike Dunk Low Panda", price: 3500000, category: "Nike", imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=600" },
    { id: "6", name: "Asics Gel-Kayano 14", price: 4200000, category: "Running", imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600" },
    { id: "7", name: "Salomon XT-6", price: 5100000, category: "Outdoor", imageUrl: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&q=80&w=600" },
    { id: "8", name: "Converse Chuck 70", price: 1800000, category: "Classic", imageUrl: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&q=80&w=600" },
    { id: "9", name: "Air Jordan 4 Retro", price: 7200000, category: "Jordan", imageUrl: "https://images.unsplash.com/photo-1579338908476-3a3a1d71a706?auto=format&fit=crop&q=80&w=600" },
  ];

  return (
    <div className="container mx-auto px-4 md:px-8 py-10">
      
      {/* Page Header & Top Bar */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 text-center md:text-left">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-zinc-900">
            Khám Phá Sản Phẩm
          </h1>
          <p className="text-zinc-500 mt-3 max-w-2xl">
            Tất cả những phiên bản mới nhất, độc quyền và giới hạn được tổng hợp tại đây.
          </p>
        </div>
        
        {/* Top Bar: Search & Sort (Desktop) */}
        <div className="hidden lg:flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm giày..." 
              className="pl-10 pr-4 py-2 bg-zinc-100 border-transparent focus:bg-white focus:border-zinc-900 focus:ring-0 text-sm w-64 outline-none transition-all"
            />
          </div>
          <div className="relative group">
            <button className="flex items-center space-x-2 border border-zinc-200 px-4 py-2 text-sm font-medium bg-white">
              <span>Sắp xếp</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <ul className="py-2">
                <li className="px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer">Mới nhất</li>
                <li className="px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer">Giá tăng dần</li>
                <li className="px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer">Giá giảm dần</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar + Grid */}
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex justify-between items-center border-b border-zinc-200 pb-4">
          <button 
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex items-center space-x-2 font-bold uppercase text-sm text-zinc-900"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Lọc Sản Phẩm</span>
          </button>
          <span className="text-sm text-zinc-500">{products.length} Kết quả</span>
        </div>

        {/* Sidebar Filters */}
        <aside className={`${isMobileFilterOpen ? "block" : "hidden"} lg:block w-full lg:w-1/4 space-y-8`}>
          
          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-4 flex items-center justify-between">
              Phân loại <ChevronDown className="h-4 w-4 lg:hidden" />
            </h3>
            <ul className="space-y-3">
              <li><label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" className="form-checkbox h-4 w-4 text-zinc-900 border-zinc-300 rounded-none focus:ring-zinc-900" /><span className="text-sm text-zinc-600 hover:text-zinc-900">Mới Nhất</span></label></li>
              <li><label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" className="form-checkbox h-4 w-4 text-zinc-900 border-zinc-300 rounded-none focus:ring-zinc-900" /><span className="text-sm text-zinc-600 hover:text-zinc-900">Nam</span></label></li>
              <li><label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" className="form-checkbox h-4 w-4 text-zinc-900 border-zinc-300 rounded-none focus:ring-zinc-900" /><span className="text-sm text-zinc-600 hover:text-zinc-900">Nữ</span></label></li>
              <li><label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" className="form-checkbox h-4 w-4 text-zinc-900 border-zinc-300 rounded-none focus:ring-zinc-900" /><span className="text-sm text-zinc-600 hover:text-zinc-900">Phụ Kiện</span></label></li>
            </ul>
          </div>

          <hr className="border-zinc-100" />

          {/* Brands */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-4">Thương hiệu</h3>
            <ul className="space-y-3">
              {['Nike', 'Jordan', 'Adidas', 'New Balance', 'Asics', 'Converse'].map(brand => (
                <li key={brand}><label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-zinc-900 border-zinc-300 rounded-none focus:ring-zinc-900" />
                  <span className="text-sm text-zinc-600 hover:text-zinc-900">{brand}</span>
                </label></li>
              ))}
            </ul>
          </div>

          <hr className="border-zinc-100" />

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-4">Mức giá</h3>
            <ul className="space-y-3">
              <li><label className="flex items-center space-x-3 cursor-pointer"><input type="radio" name="price" className="form-radio h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" /><span className="text-sm text-zinc-600">Dưới 2.000.000đ</span></label></li>
              <li><label className="flex items-center space-x-3 cursor-pointer"><input type="radio" name="price" className="form-radio h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" /><span className="text-sm text-zinc-600">2.000.000đ - 5.000.000đ</span></label></li>
              <li><label className="flex items-center space-x-3 cursor-pointer"><input type="radio" name="price" className="form-radio h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" /><span className="text-sm text-zinc-600">Trên 5.000.000đ</span></label></li>
            </ul>
          </div>

        </aside>

        {/* Product Grid Area */}
        <div className="flex-1">
          
          {/* Product Count (Mobile/Tablet fallback) */}
          <div className="lg:hidden mb-6 text-sm font-medium text-zinc-500">
            {products.length} Kết quả
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-16 flex justify-center">
            <div className="flex space-x-1">
              <button className="px-4 py-2 border border-zinc-200 text-sm font-medium text-zinc-500 hover:bg-zinc-100 disabled:opacity-50" disabled>&larr; Prev</button>
              <button className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium">1</button>
              <button className="px-4 py-2 border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-100">2</button>
              <button className="px-4 py-2 border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-100">3</button>
              <button className="px-4 py-2 border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-100">Next &rarr;</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

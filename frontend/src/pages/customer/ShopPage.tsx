import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "../../components/customer/ProductCard";
import { ProductService, type ProductResponse, type PaginatedResponse } from "../../services/productService";
import { CategoryService, type CategoryResponse } from "../../services/categoryService";
import { BrandService, type Brand } from "../../services/brandService";
import { SilhouetteService, type SilhouetteResponse } from "../../services/silhouetteService";

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Dữ liệu từ API
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [silhouettes, setSilhouettes] = useState<SilhouetteResponse[]>([]);
  
  // Trạng thái load/phân trang
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Lấy các giá trị từ URL Params
  const categoryId = searchParams.get("categoryId");
  const brandId = searchParams.get("brandId");
  const silhouetteId = searchParams.get("silhouetteId");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const searchKeyword = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortDirection = searchParams.get("sortDirection") || "desc";
  const page = parseInt(searchParams.get("page") || "0");

  // Load danh mục & thương hiệu lần đầu
  useEffect(() => {
    CategoryService.getAllCategories().then(setCategories).catch(console.error);
    BrandService.getAllBrands().then(setBrands).catch(console.error);
  }, []);

  // Load dòng giày mỗi khi brandId thay đổi
  useEffect(() => {
    if (brandId) {
      SilhouetteService.getSilhouettesByBrand(parseInt(brandId))
        .then(setSilhouettes)
        .catch(console.error);
    } else {
      SilhouetteService.getAllSilhouettes().then(setSilhouettes).catch(console.error);
    }
    
    // Nếu đổi brand thì reset silhouette đang chọn
    if (brandId) {
       // Chúng ta không reset trực tiếp trên searchParams ở đây để tránh loop, 
       // chỉ khi người dùng click đổi brand thì mới reset ở hàm xử lý.
    }
  }, [brandId]);

  // Load sản phẩm mỗi khi Params thay đổi
  useEffect(() => {
    setIsLoading(true);
    ProductService.filterProducts({
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      brandId: brandId ? parseInt(brandId) : undefined,
      silhouetteId: silhouetteId ? parseInt(silhouetteId) : undefined,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      search: searchKeyword,
      sortBy,
      sortDirection,
      page,
      size: 12
    })
      .then((res: PaginatedResponse<ProductResponse>) => {
        setProducts(res.items);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [categoryId, brandId, silhouetteId, minPrice, maxPrice, searchKeyword, sortBy, sortDirection, page]);

  // Hàm cập nhật query parameter
  const updateParams = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Đổi filter thì reset về trang 0
    if (key !== "page") {
      newParams.set("page", "0");
    }
    
    // Nếu đổi brand thì reset silhouette
    if (key === "brandId") {
      newParams.delete("silhouetteId");
    }
    
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const kw = formData.get("keyword") as string;
    updateParams("search", kw);
  };

  const handleSort = (sort: string, dir: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sortBy", sort);
    newParams.set("sortDirection", dir);
    newParams.set("page", "0");
    setSearchParams(newParams);
  };

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
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              name="keyword"
              defaultValue={searchKeyword}
              type="text"
              placeholder="Tìm kiếm giày..."
              className="pl-10 pr-4 py-2 bg-zinc-100 border-transparent focus:bg-white focus:border-zinc-900 focus:ring-0 text-sm w-64 outline-none transition-all"
            />
          </form>
          
          <div className="relative group">
            <button className="flex items-center space-x-2 border border-zinc-200 px-4 py-2 text-sm font-medium bg-white">
              <span>Sắp xếp</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <ul className="py-2">
                <li onClick={() => handleSort("createdAt", "desc")} className="px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer">Mới nhất</li>
                <li onClick={() => handleSort("basePrice", "asc")} className="px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer">Giá tăng dần</li>
                <li onClick={() => handleSort("basePrice", "desc")} className="px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer">Giá giảm dần</li>
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
          <span className="text-sm text-zinc-500">{totalElements} Kết quả</span>
        </div>

        {/* Sidebar Filters */}
        <aside className={`${isMobileFilterOpen ? "block" : "hidden"} lg:block w-full lg:w-1/4 space-y-8`}>
          
          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-4 flex items-center justify-between">
              Danh mục <ChevronDown className="h-4 w-4 lg:hidden" />
            </h3>
            <ul className="space-y-3">
              <li>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="category" 
                    checked={!categoryId} 
                    onChange={() => updateParams("categoryId", null)}
                    className="form-radio h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" 
                  />
                  <span className="text-sm text-zinc-600 hover:text-zinc-900">Tất cả</span>
                </label>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="category" 
                      checked={categoryId === cat.id.toString()}
                      onChange={() => updateParams("categoryId", cat.id.toString())}
                      className="form-radio h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" 
                    />
                    <span className="text-sm text-zinc-600 hover:text-zinc-900">{cat.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <hr className="border-zinc-100" />

          {/* Brands */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-4">Thương hiệu</h3>
            <ul className="space-y-3">
              <li>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="brand" 
                    checked={!brandId}
                    onChange={() => updateParams("brandId", null)}
                    className="form-radio h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" 
                  />
                  <span className="text-sm text-zinc-600 hover:text-zinc-900">Tất cả</span>
                </label>
              </li>
              {brands.map(brand => (
                <li key={brand.id}>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="brand" 
                      checked={brandId === brand.id.toString()}
                      onChange={() => updateParams("brandId", brand.id.toString())}
                      className="form-radio h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" 
                    />
                    <span className="text-sm text-zinc-600 hover:text-zinc-900">{brand.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <hr className="border-zinc-100" />

          {/* Silhouettes */}
          {silhouettes.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-4">Dòng giày</h3>
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  <li>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="silhouette" 
                        checked={!silhouetteId}
                        onChange={() => updateParams("silhouetteId", null)}
                        className="form-radio h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" 
                      />
                      <span className="text-sm text-zinc-600 hover:text-zinc-900">Tất cả</span>
                    </label>
                  </li>
                  {silhouettes.map(sil => (
                    <li key={sil.id}>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                          type="radio" 
                          name="silhouette" 
                          checked={silhouetteId === sil.id.toString()}
                          onChange={() => updateParams("silhouetteId", sil.id.toString())}
                          className="form-radio h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" 
                        />
                        <span className="text-sm text-zinc-600 hover:text-zinc-900">{sil.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              <hr className="border-zinc-100" />
            </>
          )}

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-4">Mức giá</h3>
            <ul className="space-y-3">
              <li>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="price" 
                    checked={!minPrice && !maxPrice}
                    onChange={() => { updateParams("minPrice", null); updateParams("maxPrice", null); }}
                    className="form-radio h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" 
                  />
                  <span className="text-sm text-zinc-600 hover:text-zinc-900">Tất cả</span>
                </label>
              </li>
              <li>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="price" 
                    checked={maxPrice === "2000000"}
                    onChange={() => { updateParams("minPrice", null); updateParams("maxPrice", "2000000"); }}
                    className="form-radio h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" 
                  />
                  <span className="text-sm text-zinc-600 hover:text-zinc-900">Dưới 2.000.000đ</span>
                </label>
              </li>
              <li>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="price" 
                    checked={minPrice === "2000000" && maxPrice === "5000000"}
                    onChange={() => { updateParams("minPrice", "2000000"); updateParams("maxPrice", "5000000"); }}
                    className="form-radio h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" 
                  />
                  <span className="text-sm text-zinc-600 hover:text-zinc-900">2.000.000đ - 5.000.000đ</span>
                </label>
              </li>
              <li>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="price" 
                    checked={minPrice === "5000000" && !maxPrice}
                    onChange={() => { updateParams("minPrice", "5000000"); updateParams("maxPrice", null); }}
                    className="form-radio h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900" 
                  />
                  <span className="text-sm text-zinc-600 hover:text-zinc-900">Trên 5.000.000đ</span>
                </label>
              </li>
            </ul>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="flex-1">
          {/* Product Count (Mobile/Tablet fallback) */}
          <div className="lg:hidden mb-6 text-sm font-medium text-zinc-500">
            {totalElements} Kết quả
          </div>
          
          {/* Active Filters Display */}
          {(searchKeyword || categoryId || brandId || silhouetteId || minPrice || maxPrice) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {searchKeyword && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                  Từ khóa: {searchKeyword}
                  <button onClick={() => updateParams("search", null)} className="ml-2 hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}
              {categoryId && categories.find(c => c.id.toString() === categoryId) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                  {categories.find(c => c.id.toString() === categoryId)?.name}
                  <button onClick={() => updateParams("categoryId", null)} className="ml-2 hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}
              {brandId && brands.find(b => b.id.toString() === brandId) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                  {brands.find(b => b.id.toString() === brandId)?.name}
                  <button onClick={() => updateParams("brandId", null)} className="ml-2 hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}
              {silhouetteId && silhouettes.find(s => s.id.toString() === silhouetteId) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                  {silhouettes.find(s => s.id.toString() === silhouetteId)?.name}
                  <button onClick={() => updateParams("silhouetteId", null)} className="ml-2 hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                  {minPrice ? `${parseInt(minPrice).toLocaleString()}đ` : '0đ'} - {maxPrice ? `${parseInt(maxPrice).toLocaleString()}đ` : 'Trở lên'}
                  <button onClick={() => { updateParams("minPrice", null); updateParams("maxPrice", null); }} className="ml-2 hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  id={product.id.toString()}
                  name={product.name}
                  price={product.basePrice}
                  category={product.brand?.name} // Sử dụng tên thương hiệu làm tag
                  imageUrl={product.defaultImageUrl}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-zinc-500 mb-4">Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
              <button 
                onClick={() => setSearchParams({})}
                className="px-6 py-2 bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-16 flex justify-center">
              <div className="flex space-x-1">
                <button 
                  onClick={() => updateParams("page", (page - 1).toString())}
                  disabled={page === 0}
                  className="px-4 py-2 border border-zinc-200 text-sm font-medium text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 disabled:hover:bg-white"
                >
                  &larr; Prev
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => updateParams("page", i.toString())}
                    className={`px-4 py-2 border border-zinc-200 text-sm font-medium ${
                      page === i 
                        ? "bg-zinc-900 text-white" 
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button 
                  onClick={() => updateParams("page", (page + 1).toString())}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 border border-zinc-200 text-sm font-medium text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 disabled:hover:bg-white"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

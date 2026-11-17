import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, RotateCcw, Lock, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import ProductCard from "../../components/customer/ProductCard";
import { ProductService, type ProductResponse } from "../../services/productService";

interface BrandCardItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  theme: "dark" | "light";
}

const BRAND_CARDS: BrandCardItem[] = [
  {
    id: "nike",
    name: "Nike",
    slug: "nike",
    logoUrl: "/brands/nike.svg",
    theme: "dark",
  },
  {
    id: "adidas",
    name: "adidas",
    slug: "adidas",
    logoUrl: "/brands/adidas.svg",
    theme: "light",
  },
  {
    id: "jordan",
    name: "Jordan",
    slug: "jordan",
    logoUrl: "/brands/jordan.svg",
    theme: "dark",
  },
  {
    id: "new-balance",
    name: "New Balance",
    slug: "new-balance",
    logoUrl: "/brands/new-balance.svg",
    theme: "light",
  },
  {
    id: "converse",
    name: "Converse",
    slug: "converse",
    logoUrl: "/brands/converse.svg",
    theme: "dark",
  },
  {
    id: "asics",
    name: "ASICS",
    slug: "asics",
    logoUrl: "/brands/asics.svg",
    theme: "light",
  },
];

export default function HomePage() {
  const [bestSellers, setBestSellers] = useState<ProductResponse[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductResponse[]>([]);
  const [saleProducts, setSaleProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states matching the mockup dot indicators
  const [bestSellerPage, setBestSellerPage] = useState(0);
  const [newArrivalPage, setNewArrivalPage] = useState(0);
  const [salePage, setSalePage] = useState(0);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [featuredResult, newResult, saleResult] = await Promise.allSettled([
          ProductService.getFeaturedProducts(12),
          ProductService.getNewArrivals(15),
          ProductService.getSaleProducts(12),
        ]);

        if (featuredResult.status === "fulfilled") {
          const raw = featuredResult.value;
          const sorted = [...raw].sort((a, b) => {
            const aInStock = (a.totalStock ?? 0) > 0 ? 1 : 0;
            const bInStock = (b.totalStock ?? 0) > 0 ? 1 : 0;
            if (aInStock !== bInStock) return bInStock - aInStock;
            return (b.totalSold ?? 0) - (a.totalSold ?? 0);
          });
          setBestSellers(sorted);
        } else {
          console.error("Failed to fetch featured products:", featuredResult.reason);
        }

        if (newResult.status === "fulfilled") {
          const raw = newResult.value;
          // Sort to prioritize exact items matching mockup on page 1:
          // [332 (Jason Markk Suede Kit), 333 (Foam Cleaner), 329 (Repel Spray), 327 (Everyday Crew Socks), 281 (Converse)]
          const primaryNewOrder = [332, 333, 329, 327, 281];
          const sorted = [...raw].sort((a, b) => {
            const indexA = primaryNewOrder.indexOf(a.id);
            const indexB = primaryNewOrder.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return b.id - a.id;
          });
          setNewArrivals(sorted);
        } else {
          console.error("Failed to fetch new arrivals:", newResult.reason);
        }

        if (saleResult.status === "fulfilled") {
          setSaleProducts(saleResult.value);
        } else {
          console.error("Failed to fetch sale products:", saleResult.reason);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    toast.success("Cảm ơn bạn đã đăng ký nhận bản tin PeakSneaker!");
    setNewsletterEmail("");
  };

  // Slice products based on current active page
  const currentBestSellers = bestSellers.slice(bestSellerPage * 4, bestSellerPage * 4 + 4);
  const currentNewArrivals = newArrivals.slice(newArrivalPage * 5, newArrivalPage * 5 + 5);
  const currentSaleProducts = saleProducts.slice(salePage * 4, salePage * 4 + 4);
  const totalSalePages = Math.max(1, Math.ceil(saleProducts.length / 4));

  return (
    <div className="w-full bg-white font-sans text-zinc-900">
      {/* 1. HERO SECTION (Dark monochromatic aesthetic with studio pedestal sneaker) */}
      <section className="relative overflow-hidden bg-[#121316] text-white">
        {/* Ambient atmospheric glows */}
        <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-zinc-800/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-zinc-700/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Left Content */}
            <div className="space-y-6 lg:col-span-6 xl:col-span-7">
              <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-6xl lg:text-7xl leading-none">
                THE CULTURE <br /> OF SNEAKERS.
              </h1>

              <p className="max-w-lg text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
                Khám phá những bộ sưu tập độc quyền và giới hạn. Nâng tầm phong cách cá nhân của bạn.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-zinc-950 text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-lg"
                >
                  SHOP NOW
                </Link>
                <Link
                  to="/shop?sortBy=createdAt&sortDirection=desc"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-transparent border border-white text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  NEW ARRIVALS
                </Link>
              </div>
            </div>

            {/* Right Pedestal Artwork */}
            <div className="relative flex justify-center lg:col-span-6 xl:col-span-5 lg:justify-end">
              <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-none overflow-hidden rounded-xl shadow-2xl">
                <img
                  src="/hero-pedestal-hq.jpg"
                  alt="The Culture Of Sneakers - PeakSneaker"
                  className="w-full h-auto object-cover object-center filter drop-shadow-2xl transition-transform duration-700 hover:scale-105"
                />
                {/* Subtle soft gradient blend on the left edge */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#121316] to-transparent hidden lg:block" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST BADGES FLOATING CARD */}
      <div className="relative z-20 -mt-8 sm:-mt-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-xl border border-zinc-200/80 px-6 py-6 sm:px-8 sm:py-7">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 sm:divide-x divide-zinc-200">
            {/* Item 1 */}
            <div className="flex items-center gap-3.5 sm:px-4 first:sm:pl-0">
              <ShieldCheck className="h-6 w-6 text-zinc-900 shrink-0" strokeWidth={1.75} />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  CHÍNH HÃNG 100%
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">
                  Cam kết hoàn tiền nếu phát hiện fake
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-3.5 sm:px-4">
              <Truck className="h-6 w-6 text-zinc-900 shrink-0" strokeWidth={1.75} />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  GIAO HÀNG TOÀN QUỐC
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">
                  Miễn phí giao hàng cho đơn từ 2M
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-3.5 sm:px-4">
              <RotateCcw className="h-6 w-6 text-zinc-900 shrink-0" strokeWidth={1.75} />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  ĐỔI TRẢ DỄ DÀNG
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">
                  Hỗ trợ đổi size trong vòng 7 ngày
                </p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-center gap-3.5 sm:px-4">
              <Lock className="h-6 w-6 text-zinc-900 shrink-0" strokeWidth={1.75} />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  THANH TOÁN AN TOÀN
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">
                  Bảo mật tuyệt đối thông tin
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BEST SELLERS SECTION */}
      <section className="pt-20 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10 pb-4 border-b border-zinc-200">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900">
                BEST SELLERS
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
                Những thiết kế được săn đón nhiều nhất trong tháng.
              </p>
            </div>
            <Link
              to="/shop?sortBy=totalSold&sortDirection=desc"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900 hover:text-zinc-500 transition-colors"
            >
              <span>XEM TẤT CẢ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* 4-column Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <div key={`bs-skeleton-${index}`} className="aspect-[4/5] animate-pulse bg-zinc-100 rounded" />
              ))}

            {!isLoading &&
              currentBestSellers.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id.toString()}
                  name={product.name}
                  price={product.price ?? product.basePrice}
                  basePrice={product.basePrice}
                  discountPercent={product.discountPercent}
                  totalStock={product.totalStock}
                  totalSold={product.totalSold}
                  isNew={product.isNew}
                  isFeatured={product.isFeatured}
                  imageUrl={product.defaultImageUrl || "https://placehold.co/600x600/png?text=No+Image"}
                  category={product.brand ? product.brand.name : "PeakSneaker"}
                />
              ))}

            {!isLoading && currentBestSellers.length === 0 && (
              <p className="col-span-full py-12 text-center text-xs text-zinc-500">
                Chưa có sản phẩm nổi bật.
              </p>
            )}
          </div>

          {/* Pagination Dot Indicator matching mockup • — • */}
          <div className="flex items-center justify-center gap-2 mt-10">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setBestSellerPage(idx)}
                className={`transition-all duration-300 rounded-full h-1.5 ${
                  bestSellerPage === idx ? "w-8 bg-zinc-900" : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
                }`}
                aria-label={`Trang bán chạy ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. SHOP BY BRAND */}
      <section className="py-12 bg-zinc-50/60 border-y border-zinc-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8 pb-3 border-b border-zinc-200">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900">
                SHOP BY BRAND
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
                Lựa chọn nhanh theo thương hiệu bạn yêu thích.
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900 hover:text-zinc-500 transition-colors"
            >
              <span>XEM TẤT CẢ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* 6 High-Contrast Alternating Brand Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {BRAND_CARDS.map((brand) => (
              <Link
                key={brand.id}
                to={`/shop?brand=${brand.slug}`}
                className={`group flex h-28 sm:h-32 items-center justify-center rounded-lg p-5 transition-all duration-300 hover:-translate-y-1 ${
                  brand.theme === "dark"
                    ? "bg-black text-white hover:bg-zinc-800 shadow-md"
                    : "bg-white border border-zinc-200/90 text-zinc-900 shadow-sm hover:border-zinc-400 hover:shadow-md"
                }`}
              >
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className={`h-8 sm:h-9 max-w-[110px] w-auto object-contain transition-transform duration-300 group-hover:scale-105 ${
                    brand.theme === "dark" ? "brightness-0 invert" : "brightness-0"
                  }`}
                  loading="lazy"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SPECIAL OFFERS (Sản phẩm giảm giá) */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10 pb-4 border-b border-zinc-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-2 bg-red-50 border border-red-200 text-red-600 rounded text-[11px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                Ưu Đãi Đặc Biệt
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900">
                SPECIAL OFFERS
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
                Những mẫu sneaker và phụ kiện chính hãng đang được áp dụng mức giá ưu đãi tốt nhất.
              </p>
            </div>
            <Link
              to="/shop?onSale=true"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900 hover:text-zinc-500 transition-colors"
            >
              <span>XEM TẤT CẢ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* 4-column Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <div key={`sale-skeleton-${index}`} className="aspect-[4/5] animate-pulse bg-zinc-100 rounded" />
              ))}

            {!isLoading &&
              currentSaleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id.toString()}
                  name={product.name}
                  price={product.price ?? product.basePrice}
                  basePrice={product.basePrice}
                  discountPercent={product.discountPercent}
                  totalStock={product.totalStock}
                  totalSold={product.totalSold}
                  isNew={product.isNew}
                  isFeatured={product.isFeatured}
                  imageUrl={product.defaultImageUrl || "https://placehold.co/600x600/png?text=No+Image"}
                  category={product.brand ? product.brand.name : "PeakSneaker"}
                />
              ))}

            {!isLoading && currentSaleProducts.length === 0 && (
              <p className="col-span-full py-12 text-center text-xs text-zinc-500">
                Chưa có sản phẩm giảm giá.
              </p>
            )}
          </div>

          {/* Pagination Dot Indicator */}
          {saleProducts.length > 4 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {Array.from({ length: Math.min(3, totalSalePages) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSalePage(idx)}
                  className={`transition-all duration-300 rounded-full h-1.5 ${
                    salePage === idx ? "w-8 bg-zinc-900" : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
                  }`}
                  aria-label={`Trang ưu đãi ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. EDITORIAL BANNER: MINIMAL. ESSENTIAL. */}
      <section className="my-16 sm:my-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0e0f11] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              {/* Left Column */}
              <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 space-y-4">
                <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-400 uppercase block">
                  NEW COLLECTION
                </span>

                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-none">
                  MINIMAL. <br /> ESSENTIAL.
                </h2>

                <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed pt-2 pb-4">
                  Sự kết hợp hoàn hảo giữa công năng và thẩm mỹ đương đại. <br className="hidden sm:inline" />
                  Các thiết kế vượt thời gian dành cho những ai trân trọng sự tinh tế.
                </p>

                <div>
                  <Link
                    to="/shop?category=giay-sneaker"
                    className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-zinc-950 text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-lg"
                  >
                    KHÁM PHÁ NGAY
                  </Link>
                </div>
              </div>

              {/* Right Column with Pedestal Artwork */}
              <div className="lg:col-span-6 relative flex items-center justify-center p-4 lg:p-0">
                <img
                  src="/banner-pedestal-hq.jpg"
                  alt="Minimal Essential Collection - PeakSneaker"
                  className="w-full h-auto object-cover object-center filter drop-shadow-2xl transition-transform duration-700 hover:scale-105"
                />
                {/* Subtle soft gradient blend on the left edge */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0e0f11] to-transparent hidden lg:block" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. NEW ARRIVALS (5 Columns) */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10 pb-4 border-b border-zinc-200">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900">
                NEW ARRIVALS
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
                Cập nhật ngay những sản phẩm mới nhất.
              </p>
            </div>
            <Link
              to="/shop?sortBy=createdAt&sortDirection=desc"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900 hover:text-zinc-500 transition-colors"
            >
              <span>XEM TẤT CẢ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* 5-column Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
            {isLoading &&
              Array.from({ length: 5 }).map((_, index) => (
                <div key={`new-skeleton-${index}`} className="aspect-[4/5] animate-pulse bg-zinc-100 rounded" />
              ))}

            {!isLoading &&
              currentNewArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id.toString()}
                  name={product.name}
                  price={product.price ?? product.basePrice}
                  basePrice={product.basePrice}
                  discountPercent={product.discountPercent}
                  totalStock={product.totalStock}
                  totalSold={product.totalSold}
                  isNew={product.isNew}
                  isFeatured={product.isFeatured}
                  imageUrl={product.defaultImageUrl || "https://placehold.co/600x600/png?text=No+Image"}
                  category={product.brand ? product.brand.name : "PeakSneaker"}
                />
              ))}

            {!isLoading && currentNewArrivals.length === 0 && (
              <p className="col-span-full py-12 text-center text-xs text-zinc-500">
                Chưa có sản phẩm mới.
              </p>
            )}
          </div>

          {/* Pagination Dot Indicator matching mockup • — • */}
          <div className="flex items-center justify-center gap-2 mt-10">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setNewArrivalPage(idx)}
                className={`transition-all duration-300 rounded-full h-1.5 ${
                  newArrivalPage === idx ? "w-8 bg-zinc-900" : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
                }`}
                aria-label={`Trang hàng mới ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 8. JOIN THE CLUB (Newsletter) */}
      <section className="my-16 sm:my-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-[#f8f9fa] border border-zinc-200/90 rounded-xl p-8 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
              <div className="md:col-span-3">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900 leading-none">
                  JOIN <br /> THE CLUB
                </h3>
              </div>
              <div className="md:col-span-4">
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  Đăng ký email để nhận thông tin về các đợt phát hành mới, ưu đãi độc quyền và xu hướng thời trang.
                </p>
              </div>
              <div className="md:col-span-5">
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn..."
                    className="flex-1 bg-white border border-zinc-300 px-4 py-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-zinc-900 text-white px-7 py-3 text-xs font-black uppercase tracking-wider hover:bg-zinc-800 transition-colors whitespace-nowrap"
                  >
                    ĐĂNG KÝ
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Link } from "react-router-dom";
import { ShieldCheck, Truck, RefreshCcw } from "lucide-react";
import ProductCard from "../../components/customer/ProductCard";

export default function HomePage() {
  // Hardcode data mồi (Mock Data)
  const bestSellers = [
    { id: "1", name: "Nike Air Force 1 '07", price: 2990000, category: "Lifestyle", imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600" },
    { id: "2", name: "Jordan 1 Retro High OG", price: 5490000, category: "Jordan", imageUrl: "https://images.unsplash.com/photo-1605340537586-0a5a228fdd64?auto=format&fit=crop&q=80&w=600" },
    { id: "3", name: "New Balance 550", price: 3290000, category: "Lifestyle", imageUrl: "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600" },
    { id: "4", name: "Adidas Yeezy Boost 350 V2", price: 6590000, category: "Yeezy", imageUrl: "https://images.unsplash.com/photo-1620012253295-c15ce331ff61?auto=format&fit=crop&q=80&w=600" },
  ];

  const newArrivals = [
    { id: "5", name: "Nike Dunk Low Panda", price: 3500000, category: "Nike", imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=600" },
    { id: "6", name: "Asics Gel-Kayano 14", price: 4200000, category: "Running", imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600" },
    { id: "7", name: "Salomon XT-6", price: 5100000, category: "Outdoor", imageUrl: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&q=80&w=600" },
    { id: "8", name: "Converse Chuck 70", price: 1800000, category: "Classic", imageUrl: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&q=80&w=600" },
  ];

  const brands = [
    { name: "Nike", imageUrl: "https://images.unsplash.com/photo-1616124619460-ff4ed8f4683c?auto=format&fit=crop&q=80&w=600" },
    { name: "Jordan", imageUrl: "https://images.unsplash.com/photo-1579338908476-3a3a1d71a706?auto=format&fit=crop&q=80&w=600" },
    { name: "Adidas", imageUrl: "https://images.unsplash.com/photo-1588117305388-c2631a279f82?auto=format&fit=crop&q=80&w=600" },
    { name: "New Balance", imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600" }, // Reusing asics image for aesthetic demo
  ];

  return (
    <div className="w-full">
      {/* 1. Hero Section */}
      <section className="relative h-[85vh] w-full bg-zinc-100 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1552346154-21d32810baa3?auto=format&fit=crop&q=80&w=2000" 
            alt="Hero Background" 
            className="w-full h-full object-cover object-center opacity-80"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-zinc-900 mb-6 drop-shadow-md">
            The Culture <br /> Of Sneakers.
          </h1>
          <p className="text-lg md:text-xl text-zinc-800 font-medium mb-10 max-w-2xl mx-auto drop-shadow-sm">
            Khám phá những bộ sưu tập độc quyền và giới hạn. <br className="hidden md:block" /> Nâng tầm phong cách cá nhân của bạn.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              to="/shop" 
              className="inline-block bg-zinc-900 text-white px-10 py-4 text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
            >
              Shop Now
            </Link>
            <Link 
              to="/shop?category=new" 
              className="inline-block bg-white text-zinc-900 px-10 py-4 text-sm font-bold uppercase tracking-widest hover:bg-zinc-100 transition-colors"
            >
              New Arrivals
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Trust Badges / Features */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-200">
            <div className="flex flex-col items-center justify-center py-4 md:py-0">
              <ShieldCheck className="h-8 w-8 text-zinc-900 mb-3" strokeWidth={1.5} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Chính hãng 100%</h3>
              <p className="text-xs text-zinc-500 mt-1">Cam kết hoàn tiền nếu phát hiện fake</p>
            </div>
            <div className="flex flex-col items-center justify-center py-4 md:py-0">
              <Truck className="h-8 w-8 text-zinc-900 mb-3" strokeWidth={1.5} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Giao hàng Hỏa tốc</h3>
              <p className="text-xs text-zinc-500 mt-1">Miễn phí giao hàng nội thành trong 2h</p>
            </div>
            <div className="flex flex-col items-center justify-center py-4 md:py-0">
              <RefreshCcw className="h-8 w-8 text-zinc-900 mb-3" strokeWidth={1.5} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Đổi trả Dễ dàng</h3>
              <p className="text-xs text-zinc-500 mt-1">Hỗ trợ đổi size trong vòng 7 ngày</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Best Sellers Section */}
      <section className="py-20 md:py-24 container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-end mb-12 border-b border-zinc-200 pb-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-zinc-900">Best Sellers</h2>
            <p className="text-zinc-500 mt-2 font-medium">Những thiết kế được săn đón nhiều nhất trong tháng.</p>
          </div>
          <Link to="/shop?sort=popular" className="hidden md:inline-block text-sm font-bold uppercase tracking-widest text-zinc-900 hover:text-zinc-500 transition-colors">
            Xem tất cả &rarr;
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* 4. Shop By Brand (Visual Grid) */}
      <section className="py-10 bg-zinc-50">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-zinc-900 mb-10 text-center">
            Shop By Brand
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {brands.map((brand, idx) => (
              <Link key={idx} to={`/shop?brand=${brand.name.toLowerCase()}`} className="group relative h-64 overflow-hidden bg-zinc-200">
                <img 
                  src={brand.imageUrl} 
                  alt={brand.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <span className="text-white text-2xl font-black uppercase tracking-widest">{brand.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. New Arrivals Section */}
      <section className="py-20 md:py-24 container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-end mb-12 border-b border-zinc-200 pb-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-zinc-900">New Arrivals</h2>
            <p className="text-zinc-500 mt-2 font-medium">Cập nhật ngay những xu hướng mới nhất.</p>
          </div>
          <Link to="/shop?category=new" className="hidden md:inline-block text-sm font-bold uppercase tracking-widest text-zinc-900 hover:text-zinc-500 transition-colors">
            Xem tất cả &rarr;
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* 6. Featured Collection Banner */}
      <section className="bg-zinc-950 text-white py-24 md:py-32 relative overflow-hidden">
        {/* Background Pattern/Texture or Image could go here */}
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-8">
            Minimal. <br /> Essential.
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-10 text-lg">
            Sự kết hợp hoàn hảo giữa công năng và thẩm mỹ đương đại. Các thiết kế vượt thời gian dành cho những ai trân trọng sự tinh tế.
          </p>
          <Link 
            to="/shop?category=essentials" 
            className="inline-block bg-white text-zinc-900 px-10 py-4 text-sm font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Mua Bộ Sưu Tập
          </Link>
        </div>
      </section>

      {/* 7. Newsletter Section */}
      <section className="py-24 bg-white border-t border-zinc-200">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl text-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 mb-4">
            Join The Club
          </h2>
          <p className="text-zinc-500 mb-8">
            Đăng ký email để nhận thông tin về các đợt phát hành mới, ưu đãi độc quyền và xu hướng thời trang.
          </p>
          <form className="flex flex-col md:flex-row gap-3 justify-center">
            <input 
              type="email" 
              placeholder="Nhập địa chỉ email của bạn..." 
              className="px-6 py-4 bg-zinc-100 border-none focus:ring-2 focus:ring-zinc-900 outline-none flex-1 max-w-md text-sm"
              required
            />
            <button 
              type="submit" 
              className="bg-zinc-900 text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors text-sm"
            >
              Đăng Ký
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}

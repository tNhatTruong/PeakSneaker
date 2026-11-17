import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { BrandService, type Brand } from "../../services/brandService";

export default function BrandsPage() {
  const [brandsData, setBrandsData] = useState<Brand[]>([]);
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await BrandService.getAllBrands();
        setBrandsData(data);
      } catch (error) {
        console.error("Failed to fetch brands data:", error);
      }
    };

    fetchBrands();
  }, []);

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-white">
      
      {/* Global Header */}
      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16 text-center">
          <h1 className="mb-4 text-3xl font-black uppercase tracking-tighter text-zinc-900 sm:text-4xl lg:text-6xl">
            Thương Hiệu
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
            Khám phá các thương hiệu hàng đầu thế giới và những dòng sản phẩm (Silhouettes) tiêu biểu làm nên tên tuổi của họ.
          </p>
        </div>
      </div>

      {/* Brands Sections */}
      <div className="container mx-auto max-w-7xl px-4 py-14 md:py-20">
        <div className="space-y-24 lg:space-y-32">
          {brandsData.map((brand) => (
            <div key={brand.id} className="relative">
              
              {/* Brand Header */}
              <div className="relative mb-12 flex flex-col items-center overflow-hidden py-2 text-center lg:mb-16">
                {/* Fallback text nếu ảnh SVG lỗi */}
                <h2 className="absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 truncate text-5xl font-black uppercase tracking-tighter text-zinc-100 select-none sm:text-6xl lg:text-8xl">
                  {brand.name}
                </h2>
                <div className="relative z-10 flex flex-col items-center">
                  <h3 className="mb-3 text-2xl font-black uppercase tracking-tighter text-zinc-900 sm:text-3xl lg:text-4xl">{brand.name}</h3>
                  <p className="max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">{brand.description}</p>
                </div>
              </div>

              {/* Silhouettes Spotlight Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12 mb-10">
                {brand.silhouettes?.map((item) => (
                  <Link key={item.id} to={`/shop?brand=${brand.slug}&silhouette=${item.slug}`} className="group flex flex-col items-center h-full">
                    <div className="w-full relative pt-[75%] mb-4 bg-zinc-50/50 hover:bg-zinc-100 rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-md border border-zinc-100">
                      <div className="absolute inset-0 p-4 flex items-center justify-center">
                        <img 
                          src={item.imageUrl || 'https://placehold.co/300x300/png?text=No+Image'} 
                          alt={item.name} 
                          className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm transition-transform duration-500 group-hover:scale-105" 
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <span className="font-bold text-zinc-900 text-sm group-hover:text-zinc-500 transition-colors text-center mt-auto">
                      {item.name}
                    </span>
                  </Link>
                ))}
              </div>

              {/* View all button for brand */}
              <div className="flex justify-center border-b border-zinc-200 pb-16 pt-8">
                <Link to={`/shop?brand=${brand.slug}`} className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-zinc-900 hover:text-zinc-500 transition-colors">
                  Xem tất cả sản phẩm {brand.name} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

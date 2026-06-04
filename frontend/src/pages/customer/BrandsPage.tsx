import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function BrandsPage() {
  // Dữ liệu mô phỏng: Phân loại theo Hãng, bên trong Hãng là các Dòng giày (Silhouettes)
  const brandsData = [
    {
      id: "nike",
      name: "NIKE",
      description: "Classic silhouettes and cutting-edge innovation to build your game from the ground up.",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
      silhouettes: [
        { id: "aj1", name: "Air Jordan 1", imageUrl: "https://images.unsplash.com/photo-1605340537586-0a5a228fdd64?auto=format&fit=crop&q=80&w=300" },
        { id: "af1", name: "Air Force 1", imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=300" },
        { id: "dunk", name: "Dunk", imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=300" },
        { id: "airmax", name: "Air Max", imageUrl: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=300" },
        { id: "pegasus", name: "Pegasus", imageUrl: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&q=80&w=300" },
      ]
    },
    {
      id: "adidas",
      name: "ADIDAS",
      description: "Sự giao thoa hoàn hảo giữa thể thao chuyên nghiệp và thời trang đường phố.",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg",
      silhouettes: [
        { id: "yeezy", name: "Yeezy Boost", imageUrl: "https://images.unsplash.com/photo-1620012253295-c15ce331ff61?auto=format&fit=crop&q=80&w=300" },
        { id: "samba", name: "Samba", imageUrl: "https://images.unsplash.com/photo-1588117305388-c2631a279f82?auto=format&fit=crop&q=80&w=300" },
      ]
    },
    {
      id: "new-balance",
      name: "NEW BALANCE",
      description: "Vẻ đẹp 'Dad Shoe' cổ điển vượt thời gian kết hợp cùng sự thoải mái tối đa.",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ea/New_Balance_logo.svg",
      silhouettes: [
        { id: "nb550", name: "550", imageUrl: "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=300" },
        { id: "nb2002r", name: "2002R", imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=300" },
      ]
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      
      {/* Global Header */}
      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="container mx-auto px-4 py-20 text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-zinc-900 mb-6">
            Thương Hiệu
          </h1>
          <p className="text-zinc-500 text-lg">
            Khám phá các thương hiệu hàng đầu thế giới và những dòng giày (Silhouettes) kinh điển làm nên tên tuổi của họ.
          </p>
        </div>
      </div>

      {/* Brands Sections */}
      <div className="container mx-auto px-4 py-16 md:py-24 max-w-7xl">
        <div className="space-y-32">
          {brandsData.map((brand) => (
            <div key={brand.id} className="relative">
              
              {/* Brand Header */}
              <div className="flex flex-col items-center mb-16 text-center">
                {/* Fallback text nếu ảnh SVG lỗi */}
                <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-zinc-100 absolute -top-10 z-0 select-none">
                  {brand.name}
                </h2>
                <div className="relative z-10 flex flex-col items-center">
                  <h3 className="text-4xl font-black uppercase tracking-tighter text-zinc-900 mb-4">{brand.name}</h3>
                  <p className="text-zinc-600 max-w-2xl">{brand.description}</p>
                </div>
              </div>

              {/* Silhouettes Spotlight Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12 mb-10">
                {brand.silhouettes.map((item) => (
                  <Link key={item.id} to={`/shop?brand=${brand.id}&silhouette=${item.id}`} className="group flex flex-col items-center">
                    <div className="w-full h-24 md:h-32 mb-4 flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-2">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm" 
                        loading="lazy"
                      />
                    </div>
                    <span className="font-bold text-zinc-900 text-sm group-hover:text-zinc-500 transition-colors">
                      {item.name}
                    </span>
                  </Link>
                ))}
              </div>

              {/* View all button for brand */}
              <div className="flex justify-center border-b border-zinc-200 pb-16">
                <Link to={`/shop?brand=${brand.id}`} className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-zinc-900 hover:text-zinc-500 transition-colors">
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

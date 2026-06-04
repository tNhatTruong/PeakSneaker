import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
}

export default function ProductCard({ id, name, price, imageUrl, category }: ProductCardProps) {
  // Format giá tiền VNĐ
  const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <Link to={`/product/${id}`} className="group block">
      {/* Khung ảnh nền xám nhạt để bóc nền giày trắng */}
      <div className="relative aspect-square overflow-hidden bg-zinc-100 mb-4">
        <img 
          src={imageUrl} 
          alt={name} 
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Lớp overlay nhẹ trên hover */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      {/* Thông tin sản phẩm */}
      <div className="space-y-1">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{category}</p>
        <h3 className="text-sm font-bold text-zinc-900 leading-tight">{name}</h3>
        <p className="text-sm text-zinc-900 font-medium">{formattedPrice}</p>
      </div>
    </Link>
  );
}

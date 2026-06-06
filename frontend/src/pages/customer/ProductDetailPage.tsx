import { Star, Truck, ShieldCheck, Ruler, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProductService } from "../../services/productService";
import type { ProductDetailResponse } from "../../services/productService";
import { useCart } from "../../context/CartContext";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await ProductService.getProductById(Number(id));
        setProduct(data);
        
        // Auto-select first available color and size
        if (data.variants && data.variants.length > 0) {
          const firstVariant = data.variants[0];
          setSelectedColor(firstVariant.color);
          setSelectedSize(firstVariant.size);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải thông tin sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Derived state for variants
  const availableColors = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set(product.variants.map(v => v.color)));
  }, [product]);

  const availableSizesForColor = useMemo(() => {
    if (!product || !selectedColor) return [];
    return product.variants
      .filter(v => v.color === selectedColor)
      .map(v => v.size);
  }, [product, selectedColor]);

  const currentVariant = useMemo(() => {
    if (!product) return null;
    return product.variants.find(
      v => v.color === selectedColor && v.size === selectedSize
    );
  }, [product, selectedColor, selectedSize]);

  // Handle color change -> auto select first available size for new color if current size is not available
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (product) {
      const sizesForNewColor = product.variants.filter(v => v.color === color).map(v => v.size);
      if (!sizesForNewColor.includes(selectedSize)) {
        setSelectedSize(sizesForNewColor[0] || "");
      }
    }
  };

  const handleAddToCart = async () => {
    if (!currentVariant) return;
    if (currentVariant.stock <= 0) {
      toast.error("Sản phẩm này đã hết hàng!");
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(currentVariant.id, 1);
      toast.success("Đã thêm vào giỏ hàng thành công!");
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng.");
        navigate("/login");
      } else {
        toast.error(err.response?.data?.message || "Đã xảy ra lỗi khi thêm vào giỏ hàng.");
      }
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-900" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex justify-center items-center h-screen flex-col gap-4">
        <p className="text-xl text-red-500 font-medium">{error || "Sản phẩm không tồn tại"}</p>
        <button onClick={() => navigate("/shop")} className="px-6 py-2 bg-black text-white rounded-md">
          Quay lại cửa hàng
        </button>
      </div>
    );
  }

  const primaryImage = product.images.find(img => img.isPrimary)?.imageUrl || product.images[0]?.imageUrl || "https://placehold.co/800x800?text=No+Image";
  const displayPrice = currentVariant ? currentVariant.finalPrice : product.basePrice;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
        
        {/* Product Gallery */}
        <div className="flex flex-col-reverse lg:flex-row gap-4">
          {/* Thumbnails */}
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible scrollbar-hide">
            {product.images.map((img) => (
              <button key={img.id} className="w-20 h-20 flex-shrink-0 bg-zinc-100 rounded-md border-2 border-transparent hover:border-black focus:border-black overflow-hidden transition-all">
                <img src={img.imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply" />
              </button>
            ))}
          </div>
          {/* Main Image */}
          <div className="flex-1 bg-zinc-50 rounded-xl aspect-square lg:aspect-auto lg:h-[600px] flex items-center justify-center p-8 overflow-hidden relative">
             {product.isFeatured && (
               <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10">
                 Nổi bật
               </div>
             )}
             {product.isNew && !product.isFeatured && (
               <div className="absolute top-4 left-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10">
                 Mới
               </div>
             )}
             <img src={primaryImage} alt={product.name} className="w-full max-h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-500" />
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-10 lg:mt-0">
          <div className="flex items-center gap-2 mb-2">
            {product.brand && (
              <span className="text-sm font-bold text-zinc-500 tracking-widest uppercase">{product.brand.name}</span>
            )}
            {product.silhouette && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="text-sm font-medium text-zinc-500">{product.silhouette.name}</span>
              </>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight uppercase">{product.name}</h1>
          
          <div className="mt-4 flex items-center gap-4">
            <p className="text-2xl font-bold text-zinc-900">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(displayPrice)}
            </p>
            <div className="flex items-center text-sm">
              <div className="flex text-yellow-400">
                <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
              </div>
              <span className="ml-2 text-zinc-500 underline cursor-pointer hover:text-black">124 Đánh giá</span>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <p className="text-zinc-600 leading-relaxed">
              {product.description || "Chưa có mô tả cho sản phẩm này."}
            </p>

            {/* Colors */}
            {availableColors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-900 mb-3">Màu sắc: <span className="font-bold">{selectedColor}</span></h3>
                <div className="flex items-center space-x-3 flex-wrap gap-y-3">
                  {availableColors.map(color => (
                    <button 
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                        selectedColor === color 
                          ? 'border-black bg-black text-white shadow-md' 
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-black'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {availableSizesForColor.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-zinc-900">Kích thước (EU)</h3>
                  <button className="text-sm text-zinc-500 flex items-center hover:text-black underline">
                    <Ruler className="w-4 h-4 mr-1"/> Hướng dẫn chọn size
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {availableSizesForColor.map(size => {
                    // Find if this specific size is out of stock
                    const variant = product.variants.find(v => v.color === selectedColor && v.size === size);
                    const isOutOfStock = !variant || variant.stock <= 0;

                    return (
                      <button 
                        key={size}
                        onClick={() => !isOutOfStock && setSelectedSize(size)}
                        disabled={isOutOfStock}
                        className={`py-3 text-sm font-medium border rounded-md transition-all
                          ${isOutOfStock ? 'opacity-40 cursor-not-allowed bg-zinc-50 border-zinc-200 text-zinc-400' : ''}
                          ${!isOutOfStock && selectedSize === size ? 'border-black bg-black text-white shadow-md' : ''}
                          ${!isOutOfStock && selectedSize !== size ? 'border-zinc-200 bg-white text-zinc-900 hover:border-black' : ''}
                        `}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col space-y-4 pt-6 border-t border-zinc-100">
              {currentVariant && currentVariant.stock <= 0 ? (
                <div className="text-red-500 font-medium text-center py-2 bg-red-50 rounded-md">
                  Biến thể này hiện đã hết hàng.
                </div>
              ) : currentVariant && currentVariant.stock < 5 ? (
                <div className="text-orange-500 text-sm font-medium">
                  Chỉ còn {currentVariant.stock} sản phẩm trong kho!
                </div>
              ) : null}

              <div className="flex space-x-4">
                <button 
                  onClick={handleAddToCart}
                  disabled={addingToCart || !currentVariant || currentVariant.stock <= 0}
                  className="flex-1 flex justify-center items-center bg-black text-white py-4 rounded-md font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : "Thêm Vào Giỏ"}
                </button>
                <button 
                  disabled={!currentVariant || currentVariant.stock <= 0}
                  className="flex-1 bg-white border-2 border-black text-black py-4 rounded-md font-bold uppercase tracking-widest hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mua Ngay
                </button>
              </div>
            </div>

            {/* Policies */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="flex items-start">
                <Truck className="w-5 h-5 text-zinc-400 mr-3 flex-shrink-0" />
                <p className="text-sm text-zinc-600">Miễn phí giao hàng cho đơn từ 2.000.000 đ</p>
              </div>
              <div className="flex items-start">
                <ShieldCheck className="w-5 h-5 text-zinc-400 mr-3 flex-shrink-0" />
                <p className="text-sm text-zinc-600">Đổi trả miễn phí trong vòng 30 ngày</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from "react";
import { CreditCard, Banknote, MapPin, Package, ShieldCheck } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getProvinces, getDistricts, getWards, calculateFee } from "../../services/shippingService";
import type { Province, District, Ward } from "../../services/shippingService";
import { createAddress } from "../../services/addressService";
import { checkout } from "../../services/orderService";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("VNPAY");
  const { cart, loading } = useCart();
  const navigate = useNavigate();

  // Shipping Form State
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [streetDetail, setStreetDetail] = useState("");
  const [note, setNote] = useState("");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  const [shippingFee, setShippingFee] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!cart || cart.items.length === 0)) {
      toast.error("Giỏ hàng của bạn đang trống.");
      navigate("/shop");
    }
  }, [cart, loading, navigate]);

  useEffect(() => {
    // Load Provinces on mount
    getProvinces().then((res) => {
      if (res && res.data) {
        setProvinces(res.data);
      }
    }).catch(err => console.error(err));
  }, []);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = e.target.value;
    setSelectedProvince(provinceId);
    setSelectedDistrict("");
    setSelectedWard("");
    setWards([]);
    setShippingFee(0);
    
    if (provinceId) {
      getDistricts(parseInt(provinceId)).then((res) => {
        if (res && res.data) setDistricts(res.data);
      }).catch(err => console.error(err));
    } else {
      setDistricts([]);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value;
    setSelectedDistrict(districtId);
    setSelectedWard("");
    setShippingFee(0);

    if (districtId) {
      getWards(parseInt(districtId)).then((res) => {
        if (res && res.data) setWards(res.data);
      }).catch(err => console.error(err));
    } else {
      setWards([]);
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardCode = e.target.value;
    setSelectedWard(wardCode);

    if (selectedDistrict && wardCode) {
      calculateFee(parseInt(selectedDistrict), wardCode).then((res) => {
        if (res && res.data && res.data.total) {
          setShippingFee(res.data.total);
        }
      }).catch(err => {
        console.error(err);
        setShippingFee(30000); // Fallback
      });
    }
  };

  const cartItems = cart?.items || [];
  const subtotal = cart?.totalPrice || 0;
  const total = subtotal + shippingFee;

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !phone || !selectedProvince || !selectedDistrict || !selectedWard || !streetDetail) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng!");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Đang xử lý đơn hàng...");

    try {
      // 1. Create Address
      const provinceName = provinces.find(p => p.ProvinceID.toString() === selectedProvince)?.ProvinceName || "";
      const districtName = districts.find(d => d.DistrictID.toString() === selectedDistrict)?.DistrictName || "";
      const wardName = wards.find(w => w.WardCode === selectedWard)?.WardName || "";

      const addressData = {
        recipientName,
        phone,
        provinceId: selectedProvince,
        provinceName,
        districtId: selectedDistrict,
        districtName,
        wardId: selectedWard,
        wardName,
        streetDetail,
        isDefault: true
      };

      const addressRes = await createAddress(addressData);
      const addressId = addressRes.data.id;

      // 2. Checkout
      const checkoutReq = {
        addressId,
        paymentMethod,
        note
      };

      const checkoutRes = await checkout(checkoutReq);
      
      if (checkoutRes.data.paymentUrl) {
        toast.success("Chuyển hướng đến trang thanh toán...", { id: toastId });
        window.location.href = checkoutRes.data.paymentUrl;
      } else {
        toast.success("Đặt hàng thành công!", { id: toastId });
        navigate("/orders");
      }

    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi đặt hàng.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-50 min-h-screen py-10">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-900 mb-8">
          Thanh Toán
        </h1>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Column: Form & Payment */}
          <div className="flex-1 space-y-8">
            
            {/* Shipping Details */}
            <div className="bg-white p-6 border border-zinc-200">
              <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-900 mb-6 flex items-center">
                <MapPin className="mr-2 h-5 w-5" /> Thông tin giao hàng
              </h2>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Họ & Tên</label>
                    <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none transition-colors" placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Số điện thoại</label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none transition-colors" placeholder="0909 123 456" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Tỉnh/Thành phố</label>
                    <select value={selectedProvince} onChange={handleProvinceChange} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 outline-none">
                      <option value="">Chọn Tỉnh/Thành</option>
                      {provinces.map(p => (
                        <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Quận/Huyện</label>
                    <select value={selectedDistrict} onChange={handleDistrictChange} disabled={!selectedProvince} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 outline-none disabled:opacity-50">
                      <option value="">Chọn Quận/Huyện</option>
                      {districts.map(d => (
                        <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Phường/Xã</label>
                    <select value={selectedWard} onChange={handleWardChange} disabled={!selectedDistrict} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 outline-none disabled:opacity-50">
                      <option value="">Chọn Phường/Xã</option>
                      {wards.map(w => (
                        <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Địa chỉ chi tiết</label>
                  <input type="text" value={streetDetail} onChange={e => setStreetDetail(e.target.value)} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none transition-colors" placeholder="Số nhà, Tên đường..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Ghi chú (Tùy chọn)</label>
                  <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none transition-colors" placeholder="Ghi chú thêm cho người giao hàng..."></textarea>
                </div>
              </form>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 border border-zinc-200">
              <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-900 mb-6 flex items-center">
                <CreditCard className="mr-2 h-5 w-5" /> Phương thức thanh toán
              </h2>
              <div className="space-y-4">
                
                {/* VNPAY Option */}
                <label className={`block cursor-pointer border ${paymentMethod === 'VNPAY' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200'} p-4 transition-all relative overflow-hidden group`}>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="payment" 
                      value="VNPAY" 
                      checked={paymentMethod === 'VNPAY'} 
                      onChange={() => setPaymentMethod('VNPAY')}
                      className="form-radio h-5 w-5 text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900">Thanh toán trực tuyến (VNPAY)</span>
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm tracking-wider">VNPAY</span>
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">Chuyển hướng đến cổng thanh toán an toàn VNPAY. Hỗ trợ thẻ ATM, Visa, MasterCard và QR Code.</p>
                    </div>
                  </div>
                  {paymentMethod === 'VNPAY' && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                  )}
                </label>

                {/* COD Option */}
                <label className={`block cursor-pointer border ${paymentMethod === 'COD' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200'} p-4 transition-all relative overflow-hidden`}>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="payment" 
                      value="COD" 
                      checked={paymentMethod === 'COD'} 
                      onChange={() => setPaymentMethod('COD')}
                      className="form-radio h-5 w-5 text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900">Thanh toán khi nhận hàng (COD)</span>
                        <Banknote className="h-5 w-5 text-zinc-400" />
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">Thanh toán bằng tiền mặt trực tiếp khi người giao hàng đưa sản phẩm tới tay bạn.</p>
                    </div>
                  </div>
                </label>

              </div>
            </div>

          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white p-6 border border-zinc-200 sticky top-24">
              <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-900 mb-6 flex items-center">
                <Package className="mr-2 h-5 w-5" /> Tóm tắt đơn hàng
              </h2>
              
              {/* Items List */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-zinc-100 flex-shrink-0">
                      <img src={item.productThumbnail || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200"} alt={item.productName} className="w-full h-full object-cover mix-blend-multiply" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-zinc-900 line-clamp-1">{item.productName}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">Size: {item.size} | Màu: {item.color}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-semibold text-zinc-500">x{item.quantity}</span>
                        <span className="text-sm font-bold text-zinc-900">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="border-zinc-200 my-6" />

              {/* Totals */}
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-zinc-600">
                  <span>Tạm tính</span>
                  <span className="font-medium text-zinc-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium text-zinc-900">{shippingFee > 0 ? formatPrice(shippingFee) : '---'}</span>
                </div>
              </div>

              <hr className="border-zinc-900 my-4 border-t-2" />
              
              <div className="flex justify-between items-end mb-8">
                <span className="font-bold uppercase tracking-wider text-zinc-900">Tổng cộng</span>
                <span className="text-2xl font-black text-zinc-900">{formatPrice(total)}</span>
              </div>

              {/* Submit Button */}
              <button 
                onClick={handleCheckout}
                disabled={isSubmitting || cartItems.length === 0}
                className="w-full bg-zinc-900 text-white py-4 font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors flex justify-center items-center disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xử lý...' : paymentMethod === 'VNPAY' ? 'Thanh toán qua VNPAY' : 'Hoàn tất đặt hàng'}
              </button>

              <div className="mt-4 flex items-center justify-center text-zinc-400 text-xs gap-1">
                <ShieldCheck className="h-4 w-4" /> <span>Thanh toán bảo mật và được mã hóa</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

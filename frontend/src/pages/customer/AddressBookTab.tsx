import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Check, Loader2 } from "lucide-react";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "../../services/addressService";
import type { AddressResponse, AddressRequest } from "../../services/addressService";
import { getProvinces, getDistricts, getWards } from "../../services/shippingService";
import type { Province, District, Ward } from "../../services/shippingService";
import toast from "react-hot-toast";

export default function AddressBookTab() {
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [streetDetail, setStreetDetail] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await getAddresses();
      if (res && res.data) {
        // Sắp xếp địa chỉ mặc định lên đầu
        const sorted = res.data.sort((a: AddressResponse, b: AddressResponse) => 
          (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)
        );
        setAddresses(sorted);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách địa chỉ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    getProvinces().then((res) => {
      if (res && res.data) setProvinces(res.data);
    }).catch(console.error);
  }, []);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = e.target.value;
    setSelectedProvince(provinceId);
    setSelectedDistrict("");
    setSelectedWard("");
    setWards([]);
    if (provinceId) {
      getDistricts(parseInt(provinceId)).then((res) => {
        if (res && res.data) setDistricts(res.data);
      }).catch(console.error);
    } else {
      setDistricts([]);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value;
    setSelectedDistrict(districtId);
    setSelectedWard("");
    if (districtId) {
      getWards(parseInt(districtId)).then((res) => {
        if (res && res.data) setWards(res.data);
      }).catch(console.error);
    } else {
      setWards([]);
    }
  };

  const resetForm = () => {
    setRecipientName("");
    setPhone("");
    setStreetDetail("");
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedWard("");
    setIsDefault(false);
    setDistricts([]);
    setWards([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleAddNew = () => {
    resetForm();
    if (addresses.length === 0) setIsDefault(true);
    setShowForm(true);
  };

  const handleEdit = async (address: AddressResponse) => {
    setEditingId(address.id);
    setRecipientName(address.recipientName);
    setPhone(address.phone);
    setStreetDetail(address.streetDetail);
    setIsDefault(address.isDefault);
    setSelectedProvince(address.provinceId);
    
    // Tải district và ward tương ứng
    try {
      const distRes = await getDistricts(parseInt(address.provinceId));
      if (distRes && distRes.data) setDistricts(distRes.data);
      
      setSelectedDistrict(address.districtId);
      
      const wardRes = await getWards(parseInt(address.districtId));
      if (wardRes && wardRes.data) setWards(wardRes.data);
      
      setSelectedWard(address.wardId);
    } catch (err) {
      console.error(err);
    }
    
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
    try {
      await deleteAddress(id);
      toast.success("Xóa địa chỉ thành công");
      fetchAddresses();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lỗi khi xóa địa chỉ");
    }
  };

  const handleSetDefault = async (address: AddressResponse) => {
    try {
      const data: AddressRequest = { ...address, isDefault: true };
      await updateAddress(address.id, data);
      toast.success("Đã đặt làm địa chỉ mặc định");
      fetchAddresses();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi thiết lập mặc định");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvince || !selectedDistrict || !selectedWard || !recipientName || !phone || !streetDetail) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    const provinceName = provinces.find(p => p.ProvinceID.toString() === selectedProvince)?.ProvinceName || "";
    const districtName = districts.find(d => d.DistrictID.toString() === selectedDistrict)?.DistrictName || "";
    const wardName = wards.find(w => w.WardCode === selectedWard)?.WardName || "";

    const addressData: AddressRequest = {
      recipientName,
      phone,
      provinceId: selectedProvince,
      provinceName,
      districtId: selectedDistrict,
      districtName,
      wardId: selectedWard,
      wardName,
      streetDetail,
      isDefault: addresses.length === 0 ? true : isDefault
    };

    try {
      setIsSubmitting(true);
      if (editingId) {
        await updateAddress(editingId, addressData);
        toast.success("Cập nhật địa chỉ thành công!");
      } else {
        await createAddress(addressData);
        toast.success("Thêm địa chỉ thành công!");
      }
      resetForm();
      fetchAddresses();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu địa chỉ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-zinc-300" /></div>;
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl border border-zinc-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">Sổ địa chỉ</h2>
        {!showForm && (
          <button 
            onClick={handleAddNew}
            className="flex items-center text-sm font-semibold text-white bg-black px-4 py-2 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Thêm địa chỉ mới
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-zinc-50 p-6 rounded-lg border border-zinc-200">
          <h3 className="font-bold text-zinc-900 border-b border-zinc-200 pb-3">{editingId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Tên người nhận <span className="text-red-500">*</span></label>
              <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded focus:ring-black focus:border-black" placeholder="Nhập họ và tên" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded focus:ring-black focus:border-black" placeholder="Nhập số điện thoại" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Tỉnh/Thành phố <span className="text-red-500">*</span></label>
              <select value={selectedProvince} onChange={handleProvinceChange} className="w-full px-3 py-2 border border-zinc-300 rounded focus:ring-black focus:border-black" required>
                <option value="">Chọn Tỉnh/Thành</option>
                {provinces.map(p => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Quận/Huyện <span className="text-red-500">*</span></label>
              <select value={selectedDistrict} onChange={handleDistrictChange} disabled={!selectedProvince} className="w-full px-3 py-2 border border-zinc-300 rounded focus:ring-black focus:border-black" required>
                <option value="">Chọn Quận/Huyện</option>
                {districts.map(d => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Phường/Xã <span className="text-red-500">*</span></label>
              <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)} disabled={!selectedDistrict} className="w-full px-3 py-2 border border-zinc-300 rounded focus:ring-black focus:border-black" required>
                <option value="">Chọn Phường/Xã</option>
                {wards.map(w => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Địa chỉ cụ thể (Số nhà, tên đường) <span className="text-red-500">*</span></label>
            <input type="text" value={streetDetail} onChange={e => setStreetDetail(e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded focus:ring-black focus:border-black" placeholder="Ví dụ: Số 12, Ngõ 10" required />
          </div>

          <div className="flex items-center">
            <input type="checkbox" id="isDefault" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} disabled={addresses.length === 0} className="h-4 w-4 text-black focus:ring-black border-zinc-300 rounded" />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-zinc-700">Đặt làm địa chỉ mặc định</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-black text-white text-sm font-bold uppercase tracking-widest rounded-md hover:bg-zinc-800 disabled:bg-zinc-400 transition-colors">
              {isSubmitting ? "Đang lưu..." : "Lưu Địa Chỉ"}
            </button>
            <button type="button" onClick={resetForm} disabled={isSubmitting} className="px-5 py-2.5 bg-white border border-zinc-300 text-zinc-700 text-sm font-bold uppercase tracking-widest rounded-md hover:bg-zinc-50 transition-colors">
              Hủy
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 rounded-lg border border-zinc-200 border-dashed">
              <MapPin className="mx-auto h-12 w-12 text-zinc-300 mb-3" />
              <p className="text-zinc-500 font-medium">Bạn chưa có địa chỉ nào trong sổ.</p>
            </div>
          ) : (
            addresses.map(address => (
              <div key={address.id} className="p-5 rounded-lg border border-zinc-200 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center hover:border-zinc-300 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-zinc-900 text-lg">{address.recipientName}</span>
                    <span className="text-zinc-400">|</span>
                    <span className="text-zinc-600 font-mono">{address.phone}</span>
                    {address.isDefault && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-widest rounded flex items-center">
                        <Check className="w-3 h-3 mr-1" /> Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-600 mt-2">{address.streetDetail}</p>
                  <p className="text-zinc-600">{address.wardName}, {address.districtName}, {address.provinceName}</p>
                </div>
                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(address)} className="flex-1 md:flex-none text-center px-3 py-1.5 text-sm font-semibold text-zinc-600 border border-zinc-300 rounded hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                      Sửa
                    </button>
                    {!address.isDefault && (
                      <button onClick={() => handleDelete(address.id)} className="flex-1 md:flex-none text-center px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-200 bg-red-50 rounded hover:bg-red-100 transition-colors">
                        Xóa
                      </button>
                    )}
                  </div>
                  {!address.isDefault && (
                    <button onClick={() => handleSetDefault(address)} className="w-full text-center px-3 py-1.5 text-sm font-semibold text-zinc-600 bg-zinc-100 rounded hover:bg-zinc-200 transition-colors">
                      Thiết lập mặc định
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

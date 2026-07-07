import { useState } from "react";
import { AuthService, type UserResponse } from "../../services/authService";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface AccountSettingsTabProps {
  user: UserResponse;
  onUpdateUser: () => void;
}

export default function AccountSettingsTab({ user, onUpdateUser }: AccountSettingsTabProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (user.hasPassword && !oldPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải dài ít nhất 6 ký tự.");
      return;
    }

    try {
      setLoading(true);
      await AuthService.changePassword({
        oldPassword: user.hasPassword ? oldPassword : undefined,
        newPassword,
        confirmPassword
      });

      toast.success(user.hasPassword ? "Đổi mật khẩu thành công!" : "Thiết lập mật khẩu thành công!");
      
      // Xóa form
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Nếu người dùng vừa thiết lập mật khẩu, reload thông tin user để update hasPassword = true
      if (!user.hasPassword) {
        onUpdateUser();
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-8">
      <h2 className="text-xl font-bold uppercase text-zinc-900 mb-6">
        {user.hasPassword ? "Đổi Mật Khẩu" : "Thiết Lập Mật Khẩu"}
      </h2>
      
      {!user.hasPassword && (
        <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-md text-sm">
          Bạn đang sử dụng tài khoản đăng nhập bằng Google. Hãy thiết lập mật khẩu để có thể đăng nhập bằng Email / Mật khẩu ở những lần sau.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        
        {user.hasPassword && (
          <div>
            <label className="block text-sm font-medium text-zinc-700">Mật khẩu hiện tại</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors sm:text-sm"
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700">Mật khẩu mới</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors sm:text-sm"
            placeholder="Nhập mật khẩu mới"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors sm:text-sm"
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold uppercase text-white bg-black hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
          {user.hasPassword ? "Đổi Mật Khẩu" : "Lưu Mật Khẩu"}
        </button>
      </form>
    </div>
  );
}

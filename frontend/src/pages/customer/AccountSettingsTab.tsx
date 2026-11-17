import { useState } from "react";
import { AuthService, type UserResponse } from "../../services/authService";
import toast from "react-hot-toast";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";

interface AccountSettingsTabProps {
  user: UserResponse;
  onUpdateUser: () => void;
}

export default function AccountSettingsTab({ user, onUpdateUser }: AccountSettingsTabProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tiêu chí bảo mật cho mật khẩu mới
  const hasMinLength = newPassword.length >= 8 && newPassword.length <= 72;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[@#$%^&+=!._*~-]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (user.hasPassword && !oldPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (!isPasswordValid) {
      toast.error("Mật khẩu mới chưa đáp ứng đầy đủ tiêu chuẩn bảo mật.");
      return;
    }

    if (user.hasPassword && oldPassword === newPassword) {
      toast.error("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
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
            <div className="relative mt-1">
              <input
                type={showOldPassword ? "text" : "password"}
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="block w-full px-4 py-3 pr-10 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors sm:text-sm"
                placeholder="Nhập mật khẩu hiện tại"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700">Mật khẩu mới</label>
          <div className="relative mt-1">
            <input
              type={showNewPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full px-4 py-3 pr-10 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors sm:text-sm"
              placeholder="Nhập mật khẩu mới an toàn"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Checklist độ mạnh mật khẩu */}
          {newPassword.length > 0 && (
            <div className="mt-2.5 p-3 bg-zinc-50 border border-zinc-200/80 rounded-lg text-xs space-y-1.5">
              <p className="font-semibold text-zinc-700">Yêu cầu bảo mật mật khẩu mới:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                <span className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-600 font-medium" : "text-zinc-500"}`}>
                  {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-zinc-400" />} Từ 8 - 72 ký tự
                </span>
                <span className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-600 font-medium" : "text-zinc-500"}`}>
                  {hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-zinc-400" />} Chữ cái in hoa (A-Z)
                </span>
                <span className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-600 font-medium" : "text-zinc-500"}`}>
                  {hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-zinc-400" />} Chữ cái in thường (a-z)
                </span>
                <span className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-600 font-medium" : "text-zinc-500"}`}>
                  {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-zinc-400" />} Chữ số (0-9)
                </span>
                <span className={`flex items-center gap-1.5 col-span-1 sm:col-span-2 ${hasSpecial ? "text-emerald-600 font-medium" : "text-zinc-500"}`}>
                  {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-zinc-400" />} Ký tự đặc biệt (@#$%^&+=!._*~-)
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Xác nhận mật khẩu mới</label>
          <div className="relative mt-1">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-4 py-3 pr-10 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors sm:text-sm"
              placeholder="Nhập lại mật khẩu mới"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="mt-1.5 text-xs text-red-500">Mật khẩu xác nhận không khớp.</p>
          )}
          {confirmPassword && newPassword === confirmPassword && (
            <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Mật khẩu khớp
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !isPasswordValid || (confirmPassword !== "" && newPassword !== confirmPassword)}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold uppercase text-white bg-black hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
          {user.hasPassword ? "Đổi Mật Khẩu" : "Lưu Mật Khẩu"}
        </button>
      </form>
    </div>
  );
}

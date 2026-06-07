import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthService } from "../../services/authService";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    setLoading(true);

    try {
      await AuthService.register(email, password, firstName, lastName, phone);
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-zinc-100">
        <div className="text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900">Tạo Tài Khoản</h2>
          <p className="mt-2 text-sm text-zinc-500">Điền thông tin của bạn để tiếp tục</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-zinc-700">Họ</label>
                <input id="lastName" name="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nguyễn" className="mt-1 appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 rounded-md placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" />
              </div>

              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-zinc-700">Tên</label>
                <input id="firstName" name="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Văn A" className="mt-1 appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 rounded-md placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 rounded-md placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
                placeholder="Nhập địa chỉ email"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">Số Điện Thoại</label>
              <input
                id="phone"
                name="phone"
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 rounded-md placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">Mật khẩu</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 rounded-md placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
                placeholder="Tạo mật khẩu"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700">Nhập lại mật khẩu</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu" className={`mt-1 appearance-none relative block w-full px-3 py-2.5 border rounded-md placeholder-zinc-400 focus:outline-none focus:ring-1 sm:text-sm ${confirmPassword && password !== confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"}`} />
              {confirmPassword && password !== confirmPassword && <p className="mt-1 text-sm text-red-500">Mật khẩu không khớp</p>}
              {confirmPassword && password === confirmPassword && <p className="mt-1 text-sm text-green-600">Mật khẩu khớp</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-black hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Đăng Ký"}
            </button>
          </div>

          <p className="mt-2 text-center text-sm text-zinc-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-black hover:underline">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { AuthService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await AuthService.login(email, password);
      
      // Use AuthContext login instead of manual localStorage
      await login(data.token);

      // Redirect to previous page or home
      const from = location.state?.from?.pathname || "/";
      toast.success("Đăng nhập thành công!");
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-zinc-100">
        <div className="text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900">Đăng Nhập</h2>
          <p className="mt-2 text-sm text-zinc-500">Chào mừng bạn quay lại PeakSneaker</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
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
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">Mật khẩu</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 rounded-md placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" 
                placeholder="Nhập mật khẩu" 
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-zinc-900 focus:ring-zinc-900 border-zinc-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-700">Ghi nhớ đăng nhập</label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-black hover:underline">Quên mật khẩu?</Link>
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-black hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Đăng Nhập"}
            </button>
          </div>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-zinc-500">Hoặc tiếp tục với</span>
              </div>
            </div>

            <div className="mt-6">
              <button type="button" className="w-full flex items-center justify-center px-4 py-2.5 border border-zinc-300 rounded-md shadow-sm bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </div>
          </div>
          
          <p className="mt-2 text-center text-sm text-zinc-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-medium text-black hover:underline">Đăng ký ngay</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

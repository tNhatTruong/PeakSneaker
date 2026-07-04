import { DollarSign, Package, Users, Activity, AlertTriangle, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from "react";
import { AdminDashboardService, type DashboardSummaryResponse, type RevenueChartResponse } from "../../services/admin/adminDashboardService";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueChartResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, chartRes] = await Promise.all([
        AdminDashboardService.getSummary(),
        AdminDashboardService.getRevenueChart()
      ]);
      setSummary(summaryRes);
      setRevenueData(chartRes);
    } catch (err: any) {
      console.error("Lỗi khi tải dữ liệu dashboard:", err);
      setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatChange = (change: number) => {
    return change >= 0 ? `+${change}%` : `${change}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-9 w-48 bg-zinc-200 rounded"></div>
          <div className="h-9 w-24 bg-zinc-200 rounded"></div>
        </div>
        
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2 w-2/3">
                  <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
                  <div className="h-8 bg-zinc-200 rounded"></div>
                </div>
                <div className="w-10 h-10 bg-zinc-100 rounded-md"></div>
              </div>
              <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg border border-zinc-200 p-6 shadow-sm min-h-[400px] flex flex-col justify-between">
            <div className="h-6 bg-zinc-200 rounded w-1/3 mb-4"></div>
            <div className="w-full h-72 bg-zinc-50 rounded"></div>
          </div>
          <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm space-y-4">
            <div className="h-6 bg-zinc-200 rounded w-1/2 mb-4"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-zinc-100 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-zinc-200 rounded w-24"></div>
                    <div className="h-3 bg-zinc-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-zinc-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-zinc-200 rounded-lg p-8 shadow-sm space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h3 className="text-lg font-semibold text-zinc-900">Đã xảy ra lỗi</h3>
        <p className="text-zinc-500 text-center max-w-md">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center space-x-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition shadow-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  const metrics = [
    { title: "Tổng Doanh Thu", value: formatVND(summary.totalRevenue), change: formatChange(summary.revenueChange), isPositive: summary.revenueChange >= 0, icon: DollarSign },
    { title: "Đơn Hàng Mới", value: String(summary.totalOrders), change: formatChange(summary.ordersChange), isPositive: summary.ordersChange >= 0, icon: Package },
    { title: "Khách Hàng Mới", value: String(summary.newCustomers), change: formatChange(summary.customersChange), isPositive: summary.customersChange >= 0, icon: Users },
    { title: "Tỷ Lệ Chuyển Đổi", value: `${summary.conversionRate}%`, change: formatChange(summary.conversionRateChange), isPositive: summary.conversionRateChange >= 0, icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
        <button
          onClick={fetchData}
          className="flex items-center space-x-2 px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-50 transition shadow-sm text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Tải lại</span>
        </button>
      </div>

      {/* Stock warning notification */}
      {summary.lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-center space-x-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Cảnh báo tồn kho:</span> Có <span className="font-bold underline">{summary.lowStockCount}</span> sản phẩm sắp hết hàng (tồn kho &le; 10). Hãy kiểm tra và nhập thêm hàng!
          </div>
        </div>
      )}
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-zinc-500 mb-1">{item.title}</p>
                  <h3 className="text-2xl font-bold text-zinc-900">{item.value}</h3>
                </div>
                <div className="p-2 bg-zinc-50 rounded-md text-zinc-400">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={`font-medium ${item.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change}
                </span>
                <span className="text-zinc-500 ml-2">so với tháng trước</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-zinc-200 p-6 shadow-sm min-h-[400px]">
          <h3 className="font-semibold text-zinc-900 mb-4">Biểu đồ doanh thu (7 ngày qua)</h3>
          <div className="w-full h-72">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18181b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#71717a', fontSize: 12}}
                    tickFormatter={(value) => `${value / 1000000}tr`}
                    dx={-10}
                  />
                  <Tooltip 
                    formatter={(value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#18181b" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
                Không có dữ liệu biểu đồ doanh thu
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
          <h3 className="font-semibold text-zinc-900 mb-4">Top Sản Phẩm Bán Chạy</h3>
          <div className="space-y-4">
             {summary.topProducts && summary.topProducts.length > 0 ? (
               summary.topProducts.map((prod) => (
                  <div key={prod.productId} className="flex items-center justify-between">
                     <div className="flex items-center min-w-0 mr-2">
                       <div className="w-12 h-12 bg-zinc-100 rounded flex items-center justify-center mr-3 p-1 flex-shrink-0">
                         {prod.imageUrl ? (
                           <img src={prod.imageUrl} alt={prod.productName} className="object-contain max-h-full max-w-full mix-blend-multiply" />
                         ) : (
                           <Package className="w-6 h-6 text-zinc-300" />
                         )}
                       </div>
                       <div className="min-w-0">
                         <p className="text-sm font-medium text-zinc-900 truncate">{prod.productName}</p>
                         <p className="text-xs text-zinc-500">Đã bán: {prod.quantitySold}</p>
                       </div>
                     </div>
                     <span className="text-sm font-bold text-zinc-900 flex-shrink-0">
                       {new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(prod.price)}
                     </span>
                  </div>
               ))
             ) : (
               <div className="flex items-center justify-center min-h-[200px] text-zinc-400 text-sm">
                 Chưa có dữ liệu bán hàng
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}

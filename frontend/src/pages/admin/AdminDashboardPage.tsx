import { DollarSign, Package, Users, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboardPage() {
  const metrics = [
    { title: "Tổng Doanh Thu", value: "324,500,000 ₫", change: "+12.5%", isPositive: true, icon: DollarSign },
    { title: "Đơn Hàng Mới", value: "142", change: "+5.2%", isPositive: true, icon: Package },
    { title: "Khách Hàng Mới", value: "86", change: "-2.4%", isPositive: false, icon: Users },
    { title: "Tỷ Lệ Chuyển Đổi", value: "3.2%", change: "+1.1%", isPositive: true, icon: Activity },
  ];

  const revenueData = [
    { name: 'T2', revenue: 120000000 },
    { name: 'T3', revenue: 150000000 },
    { name: 'T4', revenue: 180000000 },
    { name: 'T5', revenue: 140000000 },
    { name: 'T6', revenue: 210000000 },
    { name: 'T7', revenue: 250000000 },
    { name: 'CN', revenue: 324500000 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
      
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

      {/* Charts & Tables Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-zinc-200 p-6 shadow-sm min-h-[400px]">
          <h3 className="font-semibold text-zinc-900 mb-4">Biểu đồ doanh thu (7 ngày qua)</h3>
          <div className="w-full h-72">
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
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
          <h3 className="font-semibold text-zinc-900 mb-4">Top Sản Phẩm Bán Chạy</h3>
          <div className="space-y-4">
             {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center">
                     <div className="w-12 h-12 bg-zinc-100 rounded flex items-center justify-center mr-3 p-1">
                        <img src="https://images.unsplash.com/photo-1605340537586-0a5a228fdd64?auto=format&fit=crop&q=80&w=100" alt="product" className="mix-blend-multiply" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-zinc-900">Air Jordan 1 Retro {i}</p>
                       <p className="text-xs text-zinc-500">Đã bán: 12{i}</p>
                     </div>
                   </div>
                   <span className="text-sm font-bold text-zinc-900">5,490k</span>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}

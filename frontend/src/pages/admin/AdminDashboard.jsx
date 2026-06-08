import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Users, Package, UtensilsCrossed, IndianRupee } from "lucide-react";
import { motion } from "framer-motion";
import Card from "../../components/ui/Card";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    foods: 0,
    revenue: 0,
  });
  const [chartData, setChartData] = useState({
    revenueByMonth: [],
    ordersByDay: [],
    topFoods: []
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = await getToken();
      if (window.diagnostics) {
        window.diagnostics.adminDashboardMounted = "YES";
        window.diagnostics.loadingState = "AdminDashboard: loading stats";
        window.diagnostics.addLog(`AdminDashboard: Mounting. Token exists = ${!!token}`);
      }

      if (!token) {
        if (window.diagnostics) {
          window.diagnostics.addError("AdminDashboard: No token found. Aborting fetch.");
        }
        return;
      }

      if (window.diagnostics) {
        window.diagnostics.addLog(`AdminDashboard: Fetching dashboard-stats from VITE_API_URL = ${import.meta.env.VITE_API_URL}`);
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/analytics/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      // Fetch admin user info to show current role & object in overlay
      let userData = { role: "unknown" };
      try {
        if (window.diagnostics) {
          window.diagnostics.addLog(`AdminDashboard: Fetching admin info from /api/users/me`);
        }
        const resMe = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resMe.ok) {
          userData = await resMe.json();
        }
      } catch (meErr) {
        console.error("Failed to load admin user details", meErr);
        if (window.diagnostics) {
          window.diagnostics.addError(`AdminDashboard load admin details error: ${meErr.message}`);
        }
      }

      if (window.diagnostics) {
        window.diagnostics.userObject = userData;
        window.diagnostics.addLog(`AdminDashboard: Loaded. Stats payload keys = ${Object.keys(data).join(", ")}`);
        window.diagnostics.loadingState = "AdminDashboard: complete";
      }

      setStats({
        users: data.totalCustomers || 0,
        orders: data.totalOrders || 0,
        foods: data.totalFoods || 0,
        revenue: data.totalRevenue || 0,
      });
      if(data.chartData) {
        setChartData({
          revenueByMonth: data.chartData.revenueByMonth.map(d => ({ name: `Month ${d._id}`, revenue: d.revenue })),
          ordersByDay: data.chartData.ordersByDay.map(d => ({ name: `Day ${d._id}`, orders: d.orders })),
          topFoods: data.chartData.topFoods || []
        });
      }
    } catch (err) {
      console.error("Failed to load admin dashboard stats", err);
      if (window.diagnostics) {
        window.diagnostics.addError(`AdminDashboard load error: ${err.message}\nStack: ${err.stack}`);
      }
    }
  };

  const cards = [
    {
      label: "Total Users",
      value: stats.users,
      icon: <Users size={28} className="text-blue-600" />,
      bg: "bg-blue-100",
      accent: "from-blue-500 to-blue-600"
    },
    {
      label: "Total Orders",
      value: stats.orders,
      icon: <Package size={28} className="text-emerald-600" />,
      bg: "bg-emerald-100",
      accent: "from-emerald-500 to-emerald-600"
    },
    {
      label: "Food Items",
      value: stats.foods,
      icon: <UtensilsCrossed size={28} className="text-orange-600" />,
      bg: "bg-orange-100",
      accent: "from-orange-500 to-orange-600"
    },
    {
      label: "Total Revenue",
      value: `₹${stats.revenue}`,
      icon: <IndianRupee size={28} className="text-purple-600" />,
      bg: "bg-purple-100",
      accent: "from-purple-500 to-purple-600"
    },
  ];

  return (
    <div className="w-full pb-10">
      {/* Header section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 md:mt-2 text-sm sm:text-base md:text-lg font-medium max-w-xl">Here is the latest snapshot of your business today.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
        {cards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="relative overflow-hidden group border-slate-100 p-4 sm:p-5 md:p-6 min-h-[132px] sm:min-h-[150px]">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl ${card.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6 md:[&>svg]:w-7 md:[&>svg]:h-7`}>
                  {card.icon}
                </div>
                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${card.accent} animate-pulse`}></div>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider md:tracking-widest mb-1 leading-tight">{card.label}</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight break-words">{card.value}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${card.accent} group-hover:w-full transition-all duration-500`}></div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-5 md:p-8 border-slate-100 h-full">
            <h2 className="text-base md:text-xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
              <IndianRupee size={20} className="text-purple-500" /> Monthly Revenue
            </h2>
            <div className="h-72">
              {chartData.revenueByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}}
                      cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">📈</div>
                  <span className="font-medium text-sm">No revenue data yet</span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Orders Chart */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-5 md:p-8 border-slate-100 h-full">
            <h2 className="text-base md:text-xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
              <Package size={20} className="text-emerald-500" /> Orders Per Day
            </h2>
            <div className="h-72">
              {chartData.ordersByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.ordersByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} 
                      cursor={{fill: '#f8fafc'}} 
                    />
                    <Bar dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">📊</div>
                  <span className="font-medium text-sm">No orders data yet</span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
      
    </div>
  );
}

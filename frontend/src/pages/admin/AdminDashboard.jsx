import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Bike, CheckCircle2, Clock3, IndianRupee, Package, Truck, UtensilsCrossed, Users, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import Card from "../../components/ui/Card";

// Framer Motion helper for animated layout divisions
const MotionDiv = motion.div;

/**
 * AdminDashboard Component
 * Renders the dashboard page containing business performance analytics,
 * daily order statistics, interactive charts for monthly revenue and daily orders,
 * and a modal for active delivery boys tracking.
 */
export default function AdminDashboard() {
  
  // ==========================================
  // STATE DECLARATIONS
  // ==========================================
  
  // State for holding core dashboard statistics
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    foods: 0,
    revenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
    todayPendingOrders: 0,
    todayPreparingOrders: 0,
    todayOutForDeliveryOrders: 0,
    todayDeliveredOrders: 0,
    todayCancelledOrders: 0,
    totalCancelledOrders: 0,
  });

  // State to hold details of active delivery boys currently on duty
  const [activeDeliveryBoys, setActiveDeliveryBoys] = useState([]);

  // State to control visibility of the Active Delivery Boys details Modal
  const [showDeliveryBoys, setShowDeliveryBoys] = useState(false);

  // State for Recharts data inputs (Revenue per month, orders per day, and top food items)
  const [chartData, setChartData] = useState({
    revenueByMonth: [],
    ordersByDay: [],
    topFoods: []
  });

  // ==========================================
  // DATA FETCHING & EVENT HANDLERS
  // ==========================================

  /**
   * Fetch dashboard statistics and analytics data from the backend APIs.
   * Utilizes utility function 'getToken' for authentication.
   */
  const loadStats = useCallback(async () => {
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

      // Populate dashboard counts and daily summaries
      setStats({
        users: data.totalCustomers || 0,
        orders: data.totalOrders || 0,
        foods: data.totalFoods || 0,
        revenue: data.totalRevenue || 0,
        todayOrders: data.today?.orders || 0,
        todayRevenue: data.today?.revenue || 0,
        todayPendingOrders: data.today?.pendingOrders || 0,
        todayPreparingOrders: data.today?.preparingOrders || 0,
        todayOutForDeliveryOrders: data.today?.outForDeliveryOrders || 0,
        todayDeliveredOrders: data.today?.deliveredOrders || 0,
        todayCancelledOrders: data.today?.cancelledOrders || 0,
        totalCancelledOrders: data.totalCancelledOrders || 0,
      });
      setActiveDeliveryBoys(data.activeDeliveryBoys || []);
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
  }, []);

  // Fetch dashboard data on component mount
  useEffect(() => {
    Promise.resolve().then(loadStats);
  }, [loadStats]);

  // Static list configuration for generic high-level stats cards (not rendered but defined)
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

  // Daily statistics card configuration including labels, icons, gradient badges and interactions
  const dailyCards = [
    { label: "Today's Orders", value: stats.todayOrders, icon: <Package size={28} className="text-blue-600" />, bg: "bg-blue-100", accent: "from-blue-500 to-blue-600" },
    { label: "Today's Revenue", value: `Rs.${stats.todayRevenue}`, icon: <IndianRupee size={28} className="text-emerald-600" />, bg: "bg-emerald-100", accent: "from-emerald-500 to-emerald-600" },
    { label: "Pending Orders", value: stats.todayPendingOrders, icon: <Clock3 size={28} className="text-orange-600" />, bg: "bg-orange-100", accent: "from-orange-500 to-orange-600" },
    { label: "Preparing Orders", value: stats.todayPreparingOrders, icon: <UtensilsCrossed size={28} className="text-purple-600" />, bg: "bg-purple-100", accent: "from-purple-500 to-purple-600" },
    { label: "Out For Delivery", value: stats.todayOutForDeliveryOrders, icon: <Truck size={28} className="text-cyan-600" />, bg: "bg-cyan-100", accent: "from-cyan-500 to-cyan-600" },
    { label: "Delivered Orders", value: stats.todayDeliveredOrders, icon: <CheckCircle2 size={28} className="text-teal-600" />, bg: "bg-teal-100", accent: "from-teal-500 to-teal-600" },
    { label: "Today's Cancelled", value: stats.todayCancelledOrders, icon: <XCircle size={28} className="text-red-600" />, bg: "bg-red-100", accent: "from-red-500 to-red-600" },
    { label: "Total Cancelled", value: stats.totalCancelledOrders, icon: <XCircle size={28} className="text-red-600" />, bg: "bg-red-100", accent: "from-red-500 to-red-600" },
    { label: "Active Delivery Boys", value: activeDeliveryBoys.length, icon: <Bike size={28} className="text-slate-700" />, bg: "bg-slate-100", accent: "from-slate-500 to-slate-700", action: () => setShowDeliveryBoys(true) },
  ];
  void cards;

  return (
    // Main Container styling: Full width with bottom padding
    <div className="w-full pb-10">
      
      {/* --- HEADER SECTION --- */}
      {/* Tailwind classes: mb-6 md:mb-10 controls bottom margin spacing; tracking-tight enhances text aesthetics */}
      <MotionDiv initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 md:mt-2 text-sm sm:text-base md:text-lg font-medium max-w-xl">Here is the latest snapshot of your business today.</p>
      </MotionDiv>
      {/* --- END HEADER SECTION --- */}

      {/* --- STATS GRID SECTION --- */}
      {/* Tailwind classes: grid grid-cols-2 lg:grid-cols-4 sets a responsive layout with 2 columns on small screens and 4 columns on large screens. gap sizes ensure consistent spacing between cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
        {dailyCards.map((card, i) => (
          <MotionDiv key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            {/* Card component acts as the layout container with custom group states and pulse indicator badges */}
            <Card className="relative overflow-hidden group border-slate-100 p-3.5 sm:p-5 md:p-6 min-h-[124px] sm:min-h-[150px] h-full">
              {card.action && (
                <button type="button" onClick={card.action} className="absolute inset-0 z-10" aria-label={card.label} />
              )}
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl ${card.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6 md:[&>svg]:w-7 md:[&>svg]:h-7`}>
                  {card.icon}
                </div>
                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${card.accent} animate-pulse`}></div>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide md:tracking-widest mb-1 leading-tight">{card.label}</p>
                <p className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight break-words leading-tight">{card.value}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${card.accent} group-hover:w-full transition-all duration-500`}></div>
            </Card>
          </MotionDiv>
        ))}
      </div>
      {/* --- END STATS GRID SECTION --- */}

      {/* --- CHARTS SECTION --- */}
      {/* Tailwind classes: grid grid-cols-1 lg:grid-cols-2 changes layouts from 1 column on screens below 'lg' breakpoint to 2 columns on larger screens */}
      <div className="mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
        
        {/* --- MONTHLY REVENUE CHART --- */}
        <MotionDiv initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
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
        </MotionDiv>
        {/* --- END MONTHLY REVENUE CHART --- */}

        {/* --- DAILY ORDERS CHART --- */}
        <MotionDiv initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
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
        </MotionDiv>
        {/* --- END DAILY ORDERS CHART --- */}

      </div>
      {/* --- END CHARTS SECTION --- */}

      {/* --- ACTIVE DELIVERY BOYS MODAL --- */}
      {/* Modal is displayed contextually overlaying screen using 'fixed' and high z-index 'z-[3000]' */}
      {showDeliveryBoys && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Active Delivery Boys</h3>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  {activeDeliveryBoys.length} rider currently assigned to live orders
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeliveryBoys(false)}
                className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-5">
              {activeDeliveryBoys.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
                  <Bike className="mx-auto text-slate-400" size={34} />
                  <p className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-400">No active delivery boys right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeDeliveryBoys.map((boy) => (
                    <div key={boy.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-black text-slate-900 dark:text-white">{boy.name}</h4>
                          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {boy.phone || boy.email || "No contact"} | {boy.orderStatus}
                          </p>
                        </div>
                        <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-black uppercase text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                          {boy.location?.source || "profile"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                        {boy.location?.lat != null && boy.location?.lng != null
                          ? `Lat ${boy.location.lat}, Lng ${boy.location.lng}`
                          : boy.location?.address || "Location not available"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* --- END ACTIVE DELIVERY BOYS MODAL --- */}
      
    </div>
  );
}

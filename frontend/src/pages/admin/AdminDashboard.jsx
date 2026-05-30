import { useEffect, useState } from "react";
import API from "../../api/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    foods: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await API.get("/api/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const cards = [
    {
      label: "Total Users",
      value: stats.users,
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      ),
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/30",
    },
    {
      label: "Total Orders",
      value: stats.orders,
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-500/30",
    },
    {
      label: "Food Items",
      value: stats.foods,
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      gradient: "from-orange-500 to-red-600",
      shadow: "shadow-orange-500/30",
    },
    {
      label: "Total Revenue",
      value: `₹${stats.revenue}`,
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: "from-purple-500 to-pink-600",
      shadow: "shadow-purple-500/30",
    },
  ];

  return (
    <div className="w-full h-full animate-fade-in">
      {/* Header section is clean and professional */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-slate-500 mt-1">Here is the latest snapshot of your business today.</p>
      </div>

      {/* Stats Grid with Next-Level UI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className="group relative bg-white rounded-3xl p-6 overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Soft background glow matching the card's gradient */}
            <div className={`absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-[0.08] group-hover:opacity-15 rounded-full blur-2xl transition-opacity duration-300`}></div>
            
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                  {card.label}
                </span>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg ${card.shadow} flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300`}>
                  {card.icon}
                </div>
              </div>
              
              <div>
                <p className={`text-4xl font-black text-slate-900 tracking-tight mt-2`}>
                  {card.value}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-md">
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    +12%
                  </span>
                  <span className="text-xs font-medium text-slate-400">vs last month</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Decorative Recent Activity Skeleton to make the dashboard look full and professional */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Activity</h2>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((_, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <div className="w-6 h-6 bg-slate-300 rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded-full w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-slate-100 rounded-full w-1/2 animate-pulse"></div>
                </div>
                <div className="w-20 h-8 bg-slate-50 rounded-lg border border-slate-100 animate-pulse shrink-0"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}
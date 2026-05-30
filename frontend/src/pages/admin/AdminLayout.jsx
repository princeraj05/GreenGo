import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => { loadAdmin(); }, []);

  const loadAdmin = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("http://localhost:5000/api/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setName(data.name);
  };

  const navLinks = [
    {
      to: "/admin", end: true, label: "Dashboard",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
    {
      to: "/admin/foods", label: "Manage Foods",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
    },
    {
      to: "/admin/orders", label: "Orders",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    },
    {
      to: "/admin/users", label: "Users",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z" /></svg>
    },
    {
      to: "/admin/contacts", label: "Messages",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[900] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 bottom-0 w-72 z-[1000] flex flex-col transition-transform duration-300 ease-in-out
        bg-[#0f172a] border-r border-slate-800 shadow-2xl shadow-emerald-900/20
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>

        {/* Brand */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-white text-xl font-black">B</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tight">ByteBite</span>
          </div>
        </div>

        {/* Admin Profile */}
        <div className="px-8 py-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-emerald-500/50 flex items-center justify-center relative">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f172a]"></div>
            </div>
            <div>
              <p className="text-white text-sm font-bold truncate w-32">{name || "Admin"}</p>
              <p className="text-emerald-400 text-xs font-semibold tracking-wide uppercase mt-0.5">Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          {navLinks.map(({ to, end, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 translate-x-1"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-6 pb-8">
          <button
            onClick={() => navigate("/login")}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-800/50 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 text-slate-300 hover:text-red-400 font-bold text-sm transition-all duration-200 group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full md:pl-72 min-h-screen transition-all duration-300 relative">
        
        {/* Topbar */}
        <div className="sticky top-0 z-50 h-20 flex items-center justify-between px-6 lg:px-10 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpen(!open)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600 md:hidden"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-slate-800 hidden sm:block">Control Panel</h2>
          </div>

          <div className="flex items-center gap-4">
             {/* Notification Bell (Decorative) */}
             <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors relative">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-100"></span>
             </button>
             
             {/* Profile Avatar (Small) */}
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm border-2 border-white flex items-center justify-center cursor-pointer">
                <span className="text-white font-bold text-sm">{name ? name.charAt(0).toUpperCase() : 'A'}</span>
             </div>
          </div>
        </div>

        {/* Dynamic Page Content */}
        <div className="flex-1 p-6 lg:p-10 relative overflow-hidden">
           {/* Decorative Background Elements */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-400/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
           
           {/* Outlet container to keep it above the decorative elements */}
           <div className="relative z-10 w-full h-full max-w-7xl mx-auto">
             <Outlet />
           </div>
        </div>

      </div>
    </div>
  );
}
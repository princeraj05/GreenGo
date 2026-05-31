import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, UtensilsCrossed, Package, Users, 
  MessageSquare, Ticket, Bell, LineChart, Settings, 
  LogOut, Menu, X
} from "lucide-react";
import { getToken } from "../../utils/getToken";
import { cn } from "../../utils/cn";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => { loadAdmin(); }, []);

  const loadAdmin = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res.ok) {
        const data = await res.json();
        setName(data.name);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const navLinks = [
    { to: "/admin", end: true, label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { to: "/admin/foods", label: "Manage Foods", icon: <UtensilsCrossed size={20} /> },
    { to: "/admin/orders", label: "Orders", icon: <Package size={20} /> },
    { to: "/admin/users", label: "Users", icon: <Users size={20} /> },
    { to: "/admin/contacts", label: "Messages", icon: <MessageSquare size={20} /> },
    { to: "/admin/coupons", label: "Coupons", icon: <Ticket size={20} /> },
    { to: "/admin/notifications", label: "Notifications", icon: <Bell size={20} /> },
    { to: "/admin/analytics", label: "Analytics", icon: <LineChart size={20} /> },
    { to: "/admin/settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[900] md:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 bottom-0 w-72 z-[1000] flex flex-col transition-transform duration-300 ease-in-out",
        "bg-slate-950 border-r border-slate-800 shadow-2xl",
        open ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0"
      )}>
        {/* Brand */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <span className="text-white text-xl font-black">B</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tight">ByteBite</span>
          </div>
        </div>

        {/* Admin Profile */}
        <div className="px-8 py-6 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-brand-500/50 flex items-center justify-center relative">
              <UserAvatar name={name} />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-brand-500 rounded-full border-2 border-slate-950"></div>
            </div>
            <div>
              <p className="text-white text-sm font-bold truncate w-32">{name || "Admin"}</p>
              <p className="text-brand-400 text-xs font-semibold tracking-wide uppercase mt-0.5">Administrator</p>
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
                cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200",
                  isActive
                    ? "bg-brand-500/10 text-brand-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-6 pb-8 pt-4">
          <button
            onClick={() => navigate("/login")}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-800/30 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 font-bold text-sm transition-all duration-200 group"
          >
            <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full md:pl-72 min-h-screen transition-all duration-300 relative bg-slate-50">
        
        {/* Topbar */}
        <div className="sticky top-0 z-50 h-20 flex items-center justify-between px-6 lg:px-10 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpen(!open)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 md:hidden shadow-sm"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-xl font-bold text-slate-800 hidden sm:block tracking-tight">Admin Portal</h2>
          </div>

          <div className="flex items-center gap-4">
             {/* Notification Bell */}
             <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition-colors relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             
             {/* Profile Avatar (Small) */}
             <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 shadow-sm flex items-center justify-center cursor-pointer">
                <span className="font-bold text-sm">{name ? name.charAt(0).toUpperCase() : 'A'}</span>
             </div>
          </div>
        </div>

        {/* Dynamic Page Content */}
        <div className="flex-1 p-6 lg:p-10 relative overflow-hidden">
           {/* Decorative Background Elements */}
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
           
           <div className="relative z-10 w-full h-full max-w-7xl mx-auto">
             <Outlet />
           </div>
        </div>

      </div>
    </div>
  );
}

function UserAvatar({name}) {
  return <span className="text-brand-400 font-bold">{name ? name.charAt(0).toUpperCase() : 'A'}</span>;
}
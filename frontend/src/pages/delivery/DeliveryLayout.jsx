import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Bell, ClipboardList, Home, LogOut, Moon, Sun, User, Wallet } from "lucide-react";
import { clearSession } from "../../utils/authStorage";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../utils/cn";
import API from "../../api/axios";

const isDeliveryProfileComplete = (user = {}) => Boolean(
  user?.deliveryDetails?.profileCompleted &&
  String(user?.name || "").trim() &&
  String(user?.phone || "").trim() &&
  String(user?.deliveryDetails?.address || user?.address || "").trim()
);

export default function DeliveryLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const res = await API.get("/api/users/me");
      const user = res.data || {};
      setProfile(user);
      if (!isDeliveryProfileComplete(user) && location.pathname !== "/delivery/profile") {
        navigate("/delivery/profile", { replace: true });
      }
    } catch (err) {
      console.error("Failed to load delivery profile:", err);
    }
  }, [location.pathname, navigate]);

  async function loadNotifications() {
    try {
      const res = await API.get("/api/notifications/my");
      const items = Array.isArray(res.data) ? res.data : [];
      setUnreadCount(items.filter((item) => !(item.read || item.isRead)).length);
    } catch (err) {
      console.error("Failed to load delivery notifications:", err);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      loadProfile();
      loadNotifications();
    });
    const timer = setInterval(loadNotifications, 15000);
    window.addEventListener("delivery-profile-updated", loadProfile);
    return () => {
      clearInterval(timer);
      window.removeEventListener("delivery-profile-updated", loadProfile);
    };
  }, [loadProfile]);

  useEffect(() => {
    if (profile?._id && !isDeliveryProfileComplete(profile) && location.pathname !== "/delivery/profile") {
      navigate("/delivery/profile", { replace: true });
    }
  }, [profile, location.pathname, navigate]);

  const logout = async () => {
    await clearSession();
    navigate("/login", { replace: true });
  };

  const links = [
    { to: "/delivery", end: true, label: "Home", icon: <Home size={20} /> },
    { to: "/delivery/orders", label: "Orders", icon: <ClipboardList size={20} /> },
    { to: "/delivery/earnings", label: "Earnings", icon: <Wallet size={20} /> },
    { to: "/delivery/profile", label: "Profile", icon: <User size={20} /> },
  ];

  const profileComplete = isDeliveryProfileComplete(profile);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white transition-colors">
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 md:pl-64">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">Delivery Panel</p>
            <h1 className="text-lg font-black truncate">Hi, {profile.name || "Delivery Partner"}</h1>
            {!profileComplete && (
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-300">Complete profile first</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button type="button" onClick={() => navigate("/delivery/orders")} className="relative w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <Bell size={17} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-brand-500 text-white text-[10px] font-black flex items-center justify-center">{unreadCount}</span>}
            </button>
            <button type="button" onClick={logout} className="hidden sm:flex h-10 px-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold items-center gap-2">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 pb-28 md:ml-64">
        <Outlet />
      </main>

      <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-white/30 dark:border-slate-800/70 shadow-xl rounded-2xl flex items-center justify-around px-2 py-2">
        {links.map(({ to, end, label, icon }) => {
          const locked = !profileComplete && to !== "/delivery/profile";
          return (
          <NavLink
            key={to}
            to={locked ? "/delivery/profile" : to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center min-w-0 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all",
                isActive ? "text-brand-600 bg-brand-500/10 dark:text-brand-300" : "text-slate-500 dark:text-slate-300"
              )
            }
          >
            {icon}
            <span className="mt-1">{label}</span>
          </NavLink>
          );
        })}
      </nav>

      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-950 text-white border-r border-slate-800 pt-24 px-4 flex-col gap-2">
        {links.map(({ to, end, label, icon }) => {
          const locked = !profileComplete && to !== "/delivery/profile";
          return (
          <NavLink
            key={to}
            to={locked ? "/delivery/profile" : to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors",
                isActive ? "bg-brand-500/15 text-brand-300" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              )
            }
          >
            {icon} {label}
          </NavLink>
          );
        })}
      </aside>
    </div>
  );
}

import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, UtensilsCrossed, Package, Users, 
  MessageSquare, Ticket, Bell, LineChart, Settings, 
  LogOut, Menu, X, Star, Plus, MoreHorizontal, Sun, Moon, Image
} from "lucide-react";
import { getToken } from "../../utils/getToken";
import { clearSession } from "../../utils/authStorage";
import { cn } from "../../utils/cn";
import { useTheme } from "../../context/ThemeContext";

const MotionDiv = motion.div;

export default function AdminLayout() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await clearSession();
    navigate("/login", { replace: true });
  };

  // Mobile Bottom Navigation and Drawer State
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        if (window.scrollY > lastScrollY && window.scrollY > 80) {
          setShowBottomNav(false);
        } else {
          setShowBottomNav(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const loadAdmin = useCallback(async () => {
    const token = await getToken();
    if (window.diagnostics) {
      window.diagnostics.addLog(`AdminLayout loadAdmin: Token found = ${!!token}`);
      window.diagnostics.loadingState = "AdminLayout: loading admin";
    }
    if (!token) return;
    try {
      if (window.diagnostics) {
        window.diagnostics.addLog(`AdminLayout loadAdmin: Fetching GET /api/users/me`);
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (window.diagnostics) {
        window.diagnostics.addLog(`AdminLayout loadAdmin: GET /api/users/me status = ${res.status}`);
      }
      if(res.ok) {
        const data = await res.json();
        setName(data.name);
        if (window.diagnostics) {
          window.diagnostics.userObject = data;
          window.diagnostics.addLog(`AdminLayout loadAdmin: Loaded admin "${data.name}" (role: ${data.role})`);
          window.diagnostics.loadingState = "AdminLayout: admin loaded";
        }
      } else {
        if (window.diagnostics) {
          window.diagnostics.addError(`AdminLayout loadAdmin failed: status ${res.status}`);
        }
      }
    } catch(e) {
      console.error("Failed to load admin profile:", e);
      if (window.diagnostics) {
        window.diagnostics.addError(`AdminLayout loadAdmin exception: ${e.message}`);
      }
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res.ok) {
        const data = await res.json();
        const unreadNotifications = Array.isArray(data)
          ? data.filter((item) => item.audience === "admin" && !(item.isRead || item.read)).length
          : 0;
        setUnreadCount(unreadNotifications);
      }
    } catch(e) {
      console.error("Failed to load admin unread count:", e);
    }
  }, []);

  useEffect(() => { 
    if (window.diagnostics) {
      window.diagnostics.adminLayoutMounted = "YES";
      window.diagnostics.loadingState = "AdminLayout Mounting";
      window.diagnostics.addLog("AdminLayout: mounted successfully");
    }
    Promise.resolve().then(() => {
      loadAdmin(); 
      loadAlerts();
    });
    const timer = setInterval(loadAlerts, 15000);
    return () => clearInterval(timer);
  }, [loadAdmin, loadAlerts]);

  const desktopNavLinks = [
    { to: "/admin", end: true, label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { to: "/admin/foods", label: "Manage Foods", icon: <UtensilsCrossed size={20} /> },
    { to: "/admin/orders", label: "Orders", icon: <Package size={20} /> },
    { to: "/admin/users", label: "Users", icon: <Users size={20} /> },
    { to: "/admin/contacts", label: "Messages", icon: <MessageSquare size={20} /> },
    { to: "/admin/coupons", label: "Coupons", icon: <Ticket size={20} /> },
    { to: "/admin/banners", label: "Banners", icon: <Image size={20} /> },
    { to: "/admin/notifications", label: "Notifications", icon: <Bell size={20} /> },
    { to: "/admin/analytics", label: "Analytics", icon: <LineChart size={20} /> },
    { to: "/admin/reviews", label: "Reviews", icon: <Star size={20} /> },
    { to: "/admin/settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  // Mobile navigation bottom bar buttons (max 5 buttons, with last one being 'More')
  const mobileNavLinks = [
    { to: "/admin", end: true, label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { to: "/admin/orders", label: "Orders", icon: <Package size={20} /> },
    { to: "/admin/analytics", label: "Analytics", icon: <LineChart size={20} /> },
    { to: "/admin/users", label: "Users", icon: <Users size={20} /> },
  ];

  const handleLogout = () => {
    setMoreOpen(false);
    setShowLogoutConfirm(true);
  };

  // List of links in the Mobile Bottom Sheet
  const moreSheetLinks = [
    { to: "/admin/contacts", label: "Messages", icon: <MessageSquare size={20} />, badge: unreadCount },
    { to: "/admin/notifications", label: "Notifications", icon: <Bell size={20} />, badge: unreadCount },
    { to: "/admin/foods", label: "Products", icon: <UtensilsCrossed size={20} /> },
    { to: "/admin/coupons", label: "Coupons", icon: <Ticket size={20} /> },
    { to: "/admin/banners", label: "Banners", icon: <Image size={20} /> },
    { to: "/admin/reviews", label: "Reviews", icon: <Star size={20} /> },
    { to: "/admin/settings", label: "Settings", icon: <Settings size={20} /> },
    { label: "Sign Out", icon: <LogOut size={20} />, action: handleLogout, danger: true },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Mobile Overlay (drawer closing toggle fallback) */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[900] md:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Desktop Sidebar (Always hidden on mobile, visible from md up) */}
      <div className="fixed top-0 left-0 bottom-0 w-72 z-[1000] hidden md:flex flex-col bg-slate-950 border-r border-slate-800 shadow-2xl">
        {/* Brand */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <span className="text-white text-xl font-black">G</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tight">GreenGo</span>
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
          {desktopNavLinks.map(({ to, end, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-800/30 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 font-bold text-sm transition-all duration-200 group"
          >
            <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full md:pl-72 min-h-screen transition-all duration-300 relative bg-slate-50 dark:bg-slate-950">
        
        {/* Mobile Topbar */}
        <div className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 md:hidden transition-colors duration-300">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-md shrink-0">
              <span className="text-white text-sm font-black">G</span>
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg truncate">GreenGo Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-800 shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button 
              onClick={() => navigate("/admin/notifications")}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-800 shadow-sm relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Topbar for Desktop viewports */}
        <div className="sticky top-0 z-30 h-20 hidden md:flex items-center justify-between px-6 lg:px-10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-colors duration-300">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Admin Portal</h2>

          <div className="flex items-center gap-4">
             {/* Theme Toggle Button */}
             <button
               onClick={toggleTheme}
               className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-slate-850 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
               title="Toggle Theme"
             >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             
             {/* Notification Bell */}
             <button 
               onClick={() => navigate("/admin/notifications")}
               className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors relative"
               title={unreadCount > 0 ? `${unreadCount} unread notifications` : "No new notifications"}
             >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
             </button>
             
             {/* Profile Avatar (Small) */}
             <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/55 text-brand-600 dark:text-brand-400 shadow-sm flex items-center justify-center cursor-pointer">
                <span className="font-bold text-sm">{name ? name.charAt(0).toUpperCase() : 'A'}</span>
             </div>
          </div>
        </div>

        {/* Dynamic Page Content - adjusted padding at the bottom for mobile */}
        <div className="flex-1 p-4 sm:p-6 lg:p-10 pb-24 md:pb-10 relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
           {/* Decorative Background Elements */}
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-50 dark:bg-brand-950/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 dark:bg-blue-950/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
           
           <div className="relative z-10 w-full h-full max-w-7xl mx-auto">
             <Outlet />
           </div>
        </div>

      </div>

      {/* Admin Mobile Floating Bottom Navigation */}
      <div className={cn(
        "fixed bottom-4 left-4 right-4 z-[800] transition-all duration-300 transform md:hidden",
        showBottomNav ? "translate-y-0 opacity-100" : "translate-y-28 opacity-0 pointer-events-none"
      )}>
        <nav className="bg-slate-900 border border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl flex items-center justify-around py-2 px-2">
          {mobileNavLinks.map(({ to, end, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center relative py-1.5 px-2.5 rounded-xl transition-all duration-300 active:scale-90 min-w-0",
                isActive 
                  ? "text-brand-400 scale-105 bg-slate-800/80 font-black" 
                  : "text-slate-500 hover:text-slate-300 font-bold"
              )}
            >
              {icon}
              <span className="text-[9px] sm:text-[10px] mt-1 tracking-tight select-none">{label}</span>
            </NavLink>
          ))}

          {/* Plus / More Options Button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center relative py-1.5 px-2.5 rounded-xl transition-all duration-300 active:scale-90 min-w-0",
              moreOpen ? "text-brand-400 bg-slate-800/80" : "text-slate-500 hover:text-slate-300 font-bold"
            )}
          >
            <Plus size={20} />
            <span className="text-[9px] sm:text-[10px] mt-1 tracking-tight select-none">More</span>
          </button>
        </nav>
      </div>

      {/* Mobile Drawer (Bottom Sheet Options) */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-[900] md:hidden"
            />

            {/* Bottom Sheet Drawer */}
            <MotionDiv
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 rounded-t-[2rem] z-[1000] p-6 pb-12 shadow-2xl md:hidden text-white"
            >
              {/* Drag Handle Decoration */}
              <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-6" />

              {/* Header */}
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <span className="text-brand-400">⚡</span> More Functions
                </h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-3 gap-y-8 gap-x-4 mb-4">
                {moreSheetLinks.map(({ label, icon, to, action, badge, danger }) => {
                  const content = (
                    <div className="flex flex-col items-center justify-center relative p-3 rounded-2xl bg-slate-900/60 border border-slate-900/80 hover:border-slate-800 hover:bg-slate-900 active:scale-95 transition-all text-center">
                      <div className="relative text-slate-300">
                        {icon}
                        {badge !== undefined && badge > 0 && (
                          <span className="absolute -top-1.5 -right-2 bg-brand-500 text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-slate-950">
                            {badge}
                          </span>
                        )}
                      </div>
                      <span className={cn(
                        "text-[11px] font-semibold mt-2 tracking-tight select-none truncate w-full",
                        danger ? "text-red-400" : "text-slate-200"
                      )}>
                        {label}
                      </span>
                    </div>
                  );

                  if (action) {
                    return (
                      <button key={label} onClick={action} className="w-full">
                        {content}
                      </button>
                    );
                  }

                  return (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMoreOpen(false)}
                      className="w-full block"
                    >
                      {content}
                    </NavLink>
                  );
                })}
              </div>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          {/* Dialog */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fade-in text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto mb-6">
              <LogOut size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Logout</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">
              Are you sure you want to logout?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all duration-200 active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserAvatar({name}) {
  return <span className="text-brand-400 font-bold">{name ? name.charAt(0).toUpperCase() : 'A'}</span>;
}


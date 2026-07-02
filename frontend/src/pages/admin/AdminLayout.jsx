import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, UtensilsCrossed, LayoutGrid, Package, Users, 
  MessageSquare, Ticket, Bell, LineChart, Settings, 
  LogOut, Menu, X, Star, Plus, MoreHorizontal, Sun, Moon, Image, ShieldCheck
} from "lucide-react";
import { getToken } from "../../utils/getToken";
import { getApiUrl } from "../../utils/getApiUrl";
import { clearSession } from "../../utils/authStorage";
import { cn } from "../../utils/cn";
import { useTheme } from "../../context/ThemeContext";
import { speakText } from "../../utils/ttsService";

// Framer Motion helper for animated layout divisions
const MotionDiv = motion.div;

/**
 * AdminLayout Component
 * Serves as the overarching template frame for the Admin portal.
 * Houses the Desktop Sidebar, Mobile Topbar/Bottom Navigation,
 * responsive theme management, and authenticates & tracks active admin info.
 */
export default function AdminLayout() {
  const navigate = useNavigate();

  // ==========================================
  // STATE DECLARATIONS
  // ==========================================

  // Admin user's name display state
  const [name, setName] = useState("");

  // Drawer / Mobile sidebar opening toggle state
  const [open, setOpen] = useState(false);

  // Tracks count of unread admin notifications
  const [unreadCount, setUnreadCount] = useState(0);

  // Application theme hooks context (dark vs light mode toggle)
  const { theme, toggleTheme } = useTheme();

  // Flag to reveal or hide Logout Confirmation dialog popup
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Mobile Bottom Navigation display flags on scroll triggers
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Mobile bottom-sheet 'More' options drawer toggle
  const [moreOpen, setMoreOpen] = useState(false);

  // States to track new orders and cancellation requests for TTS announcements
  const [knownOrderIds, setKnownOrderIds] = useState(new Set());
  const [knownCancellationIds, setKnownCancellationIds] = useState(new Set());

  // ==========================================
  // EVENT HANDLERS & ROUTINES
  // ==========================================

  /**
   * Finalizes the admin logout procedure. Clears state session keys
   * and redirects user back to Login page.
   */
  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await clearSession();
    navigate("/login", { replace: true });
  };

  // Listens to scroll events to hide the Mobile Bottom Nav bar on scroll-down
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

  /**
   * Loads authenticated admin details (e.g. name, role) from API
   */
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
      const res = await fetch(`${getApiUrl()}/api/users/me`, {
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

  /**
   * Fetches admin notifications to update unread badge counts
   */
  const loadAlerts = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/notifications/all`, {
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

  const checkNewOrdersAndCancellations = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const orders = await res.json();
        if (!Array.isArray(orders)) return;

        setKnownOrderIds((prevOrderIds) => {
          setKnownCancellationIds((prevCancellationIds) => {
            const isFirstLoad = prevOrderIds.size === 0;

            const currentOrderIds = new Set(orders.map(o => o._id));
            const currentCancellationIds = new Set(
              orders.filter(o => o.status === "CancellationRequested").map(o => o._id)
            );

            if (!isFirstLoad) {
              let hasNewCancellation = false;
              for (const id of currentCancellationIds) {
                if (!prevCancellationIds.has(id)) {
                  hasNewCancellation = true;
                  break;
                }
              }

              let hasNewOrder = false;
              for (const id of currentOrderIds) {
                if (!prevOrderIds.has(id)) {
                  hasNewOrder = true;
                  break;
                }
              }

              if (hasNewCancellation) {
                speakText("New cancellation order request received.");
              } else if (hasNewOrder) {
                speakText("New order received.");
              }
            }

            return currentCancellationIds;
          });

          return new Set(orders.map(o => o._id));
        });
      }
    } catch (err) {
      console.error("Failed to check new orders/cancellations:", err);
    }
  }, []);

  // Poll notifications periodically and load basic profiles on mount
  useEffect(() => { 
    if (window.diagnostics) {
      window.diagnostics.adminLayoutMounted = "YES";
      window.diagnostics.loadingState = "AdminLayout Mounting";
      window.diagnostics.addLog("AdminLayout: mounted successfully");
    }
    Promise.resolve().then(() => {
      loadAdmin(); 
      loadAlerts();
      checkNewOrdersAndCancellations();
    });
    const timer = setInterval(loadAlerts, 15000);
    const orderTimer = setInterval(checkNewOrdersAndCancellations, 10000);
    return () => {
      clearInterval(timer);
      clearInterval(orderTimer);
    };
  }, [loadAdmin, loadAlerts, checkNewOrdersAndCancellations]);

  // Sidebar Links config (Desktop layout views)
  const desktopNavLinks = [
    { to: "/admin", end: true, label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { to: "/admin/foods", label: "Foods", icon: <UtensilsCrossed size={20} /> },
    { to: "/admin/categories", label: "Categories", icon: <LayoutGrid size={20} /> },
    { to: "/admin/orders", label: "Orders", icon: <Package size={20} /> },
    { to: "/admin/cancelled-orders", label: "Cancelled", icon: <X size={20} /> },
    { to: "/admin/users", label: "Users", icon: <Users size={20} /> },
    { to: "/admin/contacts", label: "Contacts", icon: <MessageSquare size={20} /> },
    { to: "/admin/coupons", label: "Coupons", icon: <Ticket size={20} /> },
    { to: "/admin/banners", label: "Banners", icon: <Image size={20} /> },
    { to: "/admin/notifications", label: "Alerts", icon: <Bell size={20} /> },
    { to: "/admin/analytics", label: "Analytics", icon: <LineChart size={20} /> },
    { to: "/admin/reviews", label: "Reviews", icon: <Star size={20} /> },
    { to: "/admin/settings", label: "Settings", icon: <Settings size={20} /> },
    { to: "/admin/security-logs", label: "Logs", icon: <ShieldCheck size={20} /> },
  ];

  // Primary bottom navigation links config (Mobile viewport)
  const mobileNavLinks = [
    { to: "/admin", end: true, label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { to: "/admin/orders", label: "Orders", icon: <Package size={20} /> },
    { to: "/admin/analytics", label: "Analytics", icon: <LineChart size={20} /> },
    { to: "/admin/users", label: "Users", icon: <Users size={20} /> },
  ];

  // Helper trigger to handle logging out from the interface
  const handleLogout = () => {
    setMoreOpen(false);
    setShowLogoutConfirm(true);
  };

  // Additional drawer sheet options list configuration for mobile viewport overflow
  const moreSheetLinks = [
    { to: "/admin/contacts", label: "Contacts", icon: <MessageSquare size={20} />, badge: unreadCount },
    { to: "/admin/notifications", label: "Alerts", icon: <Bell size={20} />, badge: unreadCount },
    { to: "/admin/foods", label: "Foods", icon: <UtensilsCrossed size={20} /> },
    { to: "/admin/categories", label: "Categories", icon: <LayoutGrid size={20} /> },
    { to: "/admin/cancelled-orders", label: "Cancelled", icon: <X size={20} /> },
    { to: "/admin/coupons", label: "Coupons", icon: <Ticket size={20} /> },
    { to: "/admin/banners", label: "Banners", icon: <Image size={20} /> },
    { to: "/admin/reviews", label: "Reviews", icon: <Star size={20} /> },
    { to: "/admin/settings", label: "Settings", icon: <Settings size={20} /> },
    { label: "Sign Out", icon: <LogOut size={20} />, action: handleLogout, danger: true },
  ];

  return (
    // Outer Layout Frame: grid fallback with custom dark/light theme switching variables
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* --- MOBILE DRAWER BACKDROP OVERLAY --- */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[900] md:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* --- DESKTOP SIDEBAR --- */}
      {/* Tailwind details: hidden md:flex forces display only on screens above MD breakpoint */}
      <div className="fixed top-0 left-0 bottom-0 w-72 z-[1000] hidden md:flex flex-col bg-slate-950 border-r border-slate-800 shadow-2xl">
        {/* Brand */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-brand-100/50 dark:border-brand-900/50 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <img src="/greengo-logo.png" alt="GreenGo" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">GreenGo</span>
          </div>
        </div>

        {/* Admin Profile */}
        <div className="px-8 py-6 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-brand-500/50 flex items-center justify-center relative shadow-inner">
              <UserAvatar name={name} />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-brand-400 rounded-full border-2 border-slate-950"></div>
            </div>
            <div>
              <p className="text-white text-sm font-bold truncate w-32">{name || "Admin"}</p>
              <p className="text-brand-400 text-xs font-semibold tracking-wide uppercase mt-0.5">Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 flex flex-col gap-1.5 overflow-y-auto">
          {desktopNavLinks.map(({ to, end, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-l-4",
                  isActive
                    ? "bg-brand-500/10 text-brand-400 border-brand-500 shadow-sm pl-4"
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40 hover:pl-5"
                )
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout button at bottom of Sidebar */}
        <div className="px-5 pb-8 pt-4">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800/20 hover:bg-red-500/10 border border-slate-800/80 hover:border-red-500/20 text-slate-400 hover:text-red-400 font-bold text-sm transition-all duration-200 group"
          >
            <LogOut size={16} className="transition-transform group-hover:-translate-x-1" />
            Sign Out
          </button>
        </div>
      </div>
      {/* --- END DESKTOP SIDEBAR --- */}

      {/* --- MAIN CONTENT FRAME --- */}
      {/* Tailwind details: md:pl-72 pushes the section to match the sidebar width on desktop */}
      <div className="flex-1 flex flex-col w-full md:pl-72 min-h-screen transition-all duration-300 relative bg-slate-50 dark:bg-slate-950">
        
        {/* --- MOBILE TOPBAR --- */}
        {/* Hidden on desktop using md:hidden */}
        <div 
          className="sticky top-0 z-40 flex items-center justify-between px-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 md:hidden transition-colors duration-300"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            height: "calc(4rem + env(safe-area-inset-top))"
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-brand-100/50 dark:border-brand-900/50 flex items-center justify-center shadow-md shrink-0">
              <img src="/greengo-logo.png" alt="GreenGo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-slate-950 dark:text-white text-base sm:text-lg truncate">GreenGo Admin</span>
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
        {/* --- END MOBILE TOPBAR --- */}

        {/* --- DESKTOP TOPBAR --- */}
        {/* Visible only on screens above MD breakpoint */}
        <div className="sticky top-0 z-30 h-20 hidden md:flex items-center justify-between px-6 lg:px-10 bg-white/70 dark:bg-slate-950 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-950 shadow-sm dark:shadow-none transition-colors duration-300">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Admin Portal</h2>

          <div className="flex items-center gap-4">
             {/* Theme Toggle Button */}
             <button
               onClick={toggleTheme}
               className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
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
             
             {/* Profile Avatar Display */}
             <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/55 text-brand-600 dark:text-brand-400 shadow-sm flex items-center justify-center cursor-pointer">
                <span className="font-bold text-sm">{name ? name.charAt(0).toUpperCase() : 'A'}</span>
             </div>
          </div>
        </div>
        {/* --- END DESKTOP TOPBAR --- */}

        {/* --- DYNAMIC PAGE OUTLET --- */}
        {/* Relative placement containing backdrop blobs */}
        <div className="flex-1 p-4 sm:p-6 lg:p-10 pb-24 md:pb-10 relative overflow-x-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
           {/* Decorative Background Elements */}
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-50 dark:bg-transparent rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 dark:bg-transparent rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
           
           <div className="relative z-10 w-full min-h-full max-w-7xl mx-auto">
             <Outlet />
           </div>
        </div>
        {/* --- END DYNAMIC PAGE OUTLET --- */}

      </div>
      {/* --- END MAIN CONTENT FRAME --- */}

      {/* --- MOBILE FLOATING BOTTOM NAVIGATION --- */}
      {/* Uses translate-y transition logic for showing/hiding bottom nav elements during active scrolls */}
      <div className={cn(
        "fixed bottom-4 left-4 right-4 z-[800] transition-all duration-300 transform md:hidden",
        showBottomNav ? "translate-y-0 opacity-100" : "translate-y-28 opacity-0 pointer-events-none"
      )}>
        <nav className="bg-slate-900/85 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-800/70 shadow-[0_8px_32px_rgba(15,23,42,0.35)] rounded-2xl flex items-center justify-around py-2.5 px-2">
          {mobileNavLinks.map(({ to, end, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center relative py-1.5 px-2.5 rounded-xl transition-all duration-300 active:scale-95 min-w-0",
                isActive 
                  ? "text-brand-400 scale-105 bg-slate-800/60 dark:bg-slate-900/50 font-black" 
                  : "text-slate-500 hover:text-slate-300 font-bold"
              )}
            >
              {icon}
              <span className="text-[9px] sm:text-[10px] mt-1 tracking-tight select-none">{label}</span>
            </NavLink>
          ))}

          {/* Plus / More Options trigger */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center relative py-1.5 px-2.5 rounded-xl transition-all duration-300 active:scale-95 min-w-0",
              moreOpen ? "text-brand-400 bg-slate-800/60 dark:bg-slate-900/50" : "text-slate-500 hover:text-slate-300 font-bold"
            )}
          >
            <Plus size={20} />
            <span className="text-[9px] sm:text-[10px] mt-1 tracking-tight select-none">More</span>
          </button>
        </nav>
      </div>
      {/* --- END MOBILE FLOATING BOTTOM NAVIGATION --- */}

      {/* --- MOBILE MORE OPTIONS DRAWER / BOTTOM SHEET --- */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Dark sheet background mask overlay */}
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-[900] md:hidden"
            />

            {/* Slide up panel sheet container */}
            <MotionDiv
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 rounded-t-[2rem] z-[1000] p-6 pb-12 shadow-2xl md:hidden text-white"
            >
              {/* Drag Handle Decoration */}
              <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-6" />

              {/* Header inside drawer */}
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

              {/* Grid content displaying links in a 3-column layout */}
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
      {/* --- END MOBILE MORE OPTIONS DRAWER / BOTTOM SHEET --- */}

      {/* --- CONFIRMATION DIALOG MODAL --- */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop element click-dismissible */}
          <div 
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          {/* Main prompt box container */}
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
      {/* --- END CONFIRMATION DIALOG MODAL --- */}
    </div>
  );
}

/**
 * UserAvatar Helper Component
 * Simply yields the uppercase initial letter of the active admin's name
 */
function UserAvatar({name}) {
  return <span className="text-brand-400 font-bold">{name ? name.charAt(0).toUpperCase() : 'A'}</span>;
}

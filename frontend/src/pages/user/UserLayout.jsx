import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, UtensilsCrossed, ShoppingCart, 
  Clock, User, Phone, LogOut, X, Home, Sun, Moon, Heart, MessageCircle, Bell, MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getToken } from "../../utils/getToken";
import { clearSession } from "../../utils/authStorage";
import { cn } from "../../utils/cn";
import { useTheme } from "../../context/ThemeContext";

const MotionDiv = motion.div;

/**
 * UserLayout Component
 * 
 * Provides layout wrapper for storefront modules. Manages desktop sidebars,
 * scroll-reactive mobile bottom nav bars, user profiles name lookups, and session management.
 */
export default function UserLayout() {
  const navigate = useNavigate();

  /* --- STATE DECLARATIONS --- */
  // name: Logged-in profile user's name
  const [name, setName] = useState("");
  // open: Triggers mobile slide-up sheets
  const [open, setOpen] = useState(false);
  // theme: Current dark/light context state
  const { theme, toggleTheme } = useTheme();
  // showLogoutConfirm: Triggers logout confirmation dialog box
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // isLoggedIn: Authenticated flag matching active sessions in local storage
  const isLoggedIn = Boolean(localStorage.getItem("token") && localStorage.getItem("auth_state") === "logged_in");

  // Bottom Navigation state & badges
  // showBottomNav: Toggles bottom nav on scrolls
  const [showBottomNav, setShowBottomNav] = useState(true);
  // lastScrollY: Remembers previous window scroll pixel offset
  const [lastScrollY, setLastScrollY] = useState(0);
  // cartCount: Quantity totals shown above Cart icons
  const [cartCount, setCartCount] = useState(0);
  // pendingCount: Active order quantities shown above Orders icons
  const [pendingCount, setPendingCount] = useState(0);

  /* --- EFFECTS & LIFECYCLE --- */

  // Scroll listener tracking scroll direction: hides bottom navigation on scroll down, reveals it on scroll up
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
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  // Performs user details downloads, loads cart quantities, registers custom event triggers
  useEffect(() => {
    if (window.diagnostics) {
      window.diagnostics.userLayoutMounted = "YES";
      window.diagnostics.loadingState = "UserLayout Mounting";
      window.diagnostics.addLog("UserLayout: mounted successfully");
    }
    queueMicrotask(() => {
      loadUser();
      updateCartCount();
      loadPendingOrdersCount();
    });

    // Listen to custom cart updates
    window.addEventListener("cart-updated", updateCartCount);

    // Poll pending orders count
    const interval = setInterval(loadPendingOrdersCount, 15000);

    return () => {
      window.removeEventListener("cart-updated", updateCartCount);
      clearInterval(interval);
    };
  }, []);

  /* --- SERVICE ACTION HANDLERS --- */

  /**
   * confirmLogout: Triggers session deletion logic.
   */
  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await clearSession();
    navigate("/login", { replace: true });
  };

  /**
   * loadUser: Fetches active account information.
   */
  const loadUser = async () => {
    const token = await getToken();
    if (window.diagnostics) {
      window.diagnostics.addLog(`UserLayout loadUser: Token found = ${!!token}`);
      window.diagnostics.loadingState = "UserLayout: loading user";
    }
    if (!token) return;
    try {
      if (window.diagnostics) {
        window.diagnostics.addLog(`UserLayout loadUser: Fetching GET /api/users/me`);
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (window.diagnostics) {
        window.diagnostics.addLog(`UserLayout loadUser: GET /api/users/me status = ${res.status}`);
      }
      if (res.ok) {
        const data = await res.json();
        setName(data.name);
        if (window.diagnostics) {
          window.diagnostics.userObject = data;
          window.diagnostics.addLog(`UserLayout loadUser: Loaded user "${data.name}" (role: ${data.role})`);
          window.diagnostics.loadingState = "UserLayout: user loaded";
        }
      } else {
        if (window.diagnostics) {
          window.diagnostics.addError(`UserLayout loadUser failed: status ${res.status}`);
        }
      }
    } catch (e) {
      console.error("Failed to load user info:", e);
      if (window.diagnostics) {
        window.diagnostics.addError(`UserLayout loadUser exception: ${e.message}`);
      }
    }
  };

  /**
   * updateCartCount: Counts items inside the customer's cart list.
   */
  const updateCartCount = () => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = data.reduce((sum, item) => sum + (item.qty || 0), 0);
    setCartCount(totalItems);
  };

  /**
   * loadPendingOrdersCount: Evaluates orders still in transit to display on nav badges.
   */
  const loadPendingOrdersCount = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const pending = data.filter(order => order.status !== "Delivered").length;
        setPendingCount(pending);
      }
    } catch (e) {
      console.error("Failed to load pending orders count in nav:", e);
    }
  };

  /* --- NAVIGATION LINKS CONFIGS --- */
  const desktopNavLinks = [
    { to: "/user/menu", label: "Home", icon: <Home size={20} /> },
    { to: "/user/wishlist", label: "Wishlist", icon: <Heart size={20} /> },
    { to: "/user/cart", label: "Cart", icon: <ShoppingCart size={20} /> },
    { to: "/user/orders", label: "Orders", icon: <Clock size={20} /> },
    { to: "/user/notifications", label: "Notifications", icon: <Bell size={20} /> },
    { to: "/user/contact", label: "Support", icon: <MessageCircle size={20} /> },
  ];

  const bottomNavLinks = [
    { to: "/user/menu", label: "Home", icon: <Home size={20} /> },
    { to: "/user/orders", label: "Orders", icon: <Clock size={20} />, badge: pendingCount },
    { to: "/user/cart", label: "Cart", icon: <ShoppingCart size={20} />, badge: cartCount },
    { to: "/user/profile", label: "Profile", icon: <User size={20} /> },
  ];

  const moreLinks = [
    { to: "/user/wishlist", label: "Wishlist", icon: <Heart size={20} /> },
    { to: "/user/notifications", label: "Notifications", icon: <Bell size={20} /> },
    { to: "/user/contact", label: "Support", icon: <MessageCircle size={20} /> },
    ...(isLoggedIn ? [{ label: "Sign Out", icon: <LogOut size={20} />, action: () => { setOpen(false); setShowLogoutConfirm(true); }, danger: true }] : [])
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* --- 1. DESKTOP SIDEBAR NAVIGATION --- */}
      {/* Tailwind: hidden md:flex holds sidebar drawer visible on larger desktop displays only */}
      <div className="fixed top-0 left-0 bottom-0 w-72 z-[1000] hidden md:flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        
        {/* Brand Banner */}
        <div className="px-6 h-20 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shadow-brand-500/20 overflow-hidden bg-white border border-brand-100 dark:border-brand-900 [&>span]:hidden">
              <img src="/greengo-logo.svg" alt="GreenGo" className="w-full h-full object-cover" />
              <span className="text-white text-xl">🍔</span>
            </div>
            <span className="text-slate-900 dark:text-white font-extrabold text-xl tracking-tight"><span className="text-brand-500">Green</span>GO</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* User profile identity header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800">
              <User size={24} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-slate-900 dark:text-white font-bold">{name || (isLoggedIn ? "User" : "Guest")}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{isLoggedIn ? "Food Lover" : "Browse freely"}</p>
            </div>
          </div>
        </div>

        {/* Desktop navigation link block */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          {desktopNavLinks.map(({ to, end, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300",
                isActive
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout toolbar CTA */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50">
          {isLoggedIn ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-bold transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          ) : (
            <button
              onClick={() => navigate("/", { state: { loginRequired: true, from: { pathname: "/user/menu" } } })}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-colors shadow-md shadow-brand-500/20"
            >
              <User size={18} />
              Login
            </button>
          )}
        </div>
      </div>

      {/* --- 2. MAIN WORKSPACE CONTAINER --- */}
      {/* Tailwind: md:pl-72 shifts container content to prevent occlusion by the fixed desktop sidebar */}
      <div className="flex-1 flex flex-col w-full md:pl-72 min-h-screen transition-all duration-300">
        
        {/* Mobile Topbar */}
        <div className="hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <span className="text-white text-sm">🍔</span>
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white text-lg"><span className="text-brand-500">Green</span>GO</span>
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
              onClick={() => navigate("/user/profile")}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-800 shadow-sm"
            >
              <User size={18} />
            </button>
          </div>
        </div>

        {/* Page Content Panel */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 overflow-x-hidden">
          <div className="w-full h-full max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </div>
      </div>

      {/* --- 3. FLOATING BOTTOM NAVIGATION BAR (MOBILE ONLY) --- */}
      {/* Tailwind: fixed bottom-4 pins floating bar above bottom margins. md:hidden removes layout on larger displays */}
      <div className={cn(
        "fixed bottom-4 left-4 right-4 z-50 transition-all duration-300 transform md:hidden",
        showBottomNav ? "translate-y-0 opacity-100" : "translate-y-28 opacity-0 pointer-events-none"
      )}>
        <nav className="bg-white/80 dark:bg-slate-950/85 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl flex items-center justify-around py-2.5 px-2">
          {bottomNavLinks.map(({ to, end, label, icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                "flex min-w-[58px] flex-col items-center justify-center relative py-1.5 px-2 rounded-xl transition-all duration-300 active:scale-90",
                isActive 
                  ? "text-brand-500 scale-105 bg-brand-500/10 dark:bg-brand-500/20 font-black" 
                  : "text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white font-bold"
              )}
            >
              <div className="relative">
                {icon}
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-brand-500 text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight select-none">{label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-w-[58px] flex-col items-center justify-center relative py-1.5 px-2 rounded-xl text-slate-500 dark:text-slate-300 font-bold transition-all active:scale-90"
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] mt-1 tracking-tight select-none">More</span>
          </button>
        </nav>
      </div>

      {/* --- 4. MORE NAV LINKS SLIDE UP PANEL --- */}
      <AnimatePresence>
        {open && (
          <>
            {/* Dark sheet background mask overlay */}
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
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
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Grid content displaying links in a 3-column layout */}
              <div className="grid grid-cols-3 gap-y-8 gap-x-4 mb-4">
                {moreLinks.map(({ label, icon, to, action, danger }) => {
                  const content = (
                    <div className="flex flex-col items-center justify-center relative p-3 rounded-2xl bg-slate-900/60 border border-slate-900/80 hover:border-slate-800 hover:bg-slate-900 active:scale-95 transition-all text-center">
                      <div className="relative text-slate-300">
                        {icon}
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
                      onClick={() => setOpen(false)}
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

      {/* --- 5. LOGOUT CONFIRMATION DIALOG MODAL --- */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          {/* Action Dialog Container */}
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


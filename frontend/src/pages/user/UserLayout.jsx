import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, UtensilsCrossed, ShoppingCart, 
  Clock, User, Phone, LogOut, X, Home, Sun, Moon, Heart, MessageCircle, Bell, MoreHorizontal, MapPin, ChevronDown, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getToken } from "../../utils/getToken";
import { getApiUrl } from "../../utils/getApiUrl";
import { clearSession } from "../../utils/authStorage";
import { cn } from "../../utils/cn";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "../../context/LanguageContext";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

const MotionDiv = motion.div;

/**
 * UserLayout Component
 * 
 * Provides layout wrapper for storefront modules. Manages desktop sidebars,
 * scroll-reactive mobile bottom nav bars, user profiles name lookups, and session management.
 */
export default function UserLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
  // cartCount: Quantity totals shown above Cart icons
  const [cartCount, setCartCount] = useState(0);
  // pendingCount: Active order quantities shown above Orders icons
  const [pendingCount, setPendingCount] = useState(0);
  // unreadCount: Total unread notifications count
  const [unreadCount, setUnreadCount] = useState(0);
  // activePushToast: Banner toast shown at top matching native Android push appearance
  const [activePushToast, setActivePushToast] = useState(null);
  const [user, setUser] = useState({});
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "Home", details: "", city: "", state: "" });

  /* --- EFFECTS & LIFECYCLE --- */

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
      loadNotifications();
    });

    // Background push notifications sync
    if (Capacitor.isNativePlatform() && isLoggedIn) {
      PushNotifications.checkPermissions().then((permission) => {
        if (permission.receive === "granted") {
          PushNotifications.addListener('registration', async (token) => {
            console.log('[NOTIFICATIONS] Background token sync success, token:', token.value);
            localStorage.setItem("fcm_token", token.value);
            try {
              await fetch(`${getApiUrl()}/api/users/fcm-token`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${getToken()}`
                },
                body: JSON.stringify({ token: token.value })
              });
            } catch (err) {
              console.error("[NOTIFICATIONS] Background token sync fetch error:", err);
            }
          });
          PushNotifications.register();
        }
      });
    }

    // Listen to custom cart updates
    window.addEventListener("cart-updated", updateCartCount);
    window.addEventListener("address-updated", loadUser);

    // Poll pending orders count
    const interval = setInterval(loadPendingOrdersCount, 60000);
    const notifInterval = setInterval(loadNotifications, 60000);

    return () => {
      window.removeEventListener("cart-updated", updateCartCount);
      window.removeEventListener("address-updated", loadUser);
      clearInterval(interval);
      clearInterval(notifInterval);
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
      const res = await fetch(`${getApiUrl()}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (window.diagnostics) {
        window.diagnostics.addLog(`UserLayout loadUser: GET /api/users/me status = ${res.status}`);
      }
      if (res.ok) {
        const data = await res.json();
        setName(data.name);
        if (!Array.isArray(data.addresses) || data.addresses.length === 0) {
          data.addresses = data.address
            ? [{ label: "Home", details: data.address, city: "", state: "", isPrimary: true }]
            : [{ label: "Home", details: "", city: "", state: "", isPrimary: true }];
        }
        setUser(data);
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

  const cleanAddressPart = (value = "") => String(value)
    .replace(/\b(?:Khagaria|)\b/gi, "")
    .replace(/\s*,\s*,/g, ",")
    .replace(/^[\s,.-]+|[\s,.-]+$/g, "")
    .trim();

  const formatAddressLine = (addr) => {
    if (!addr) return "";
    return [addr.details, addr.city, addr.state].map(cleanAddressPart).filter(Boolean).join(", ");
  };

  const saveAddresses = async (addresses) => {
    const token = await getToken();
    const res = await fetch(`${getApiUrl()}/api/users/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ addresses })
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      window.dispatchEvent(new Event("address-updated"));
    }
  };

  const setPrimaryAddress = async (index) => {
    const addresses = (user.addresses || []).map((addr, i) => ({ ...addr, isPrimary: i === index }));
    setUser({ ...user, addresses });
    await saveAddresses(addresses);
  };

  const addAddress = async () => {
    if (!newAddress.details.trim()) return;
    const addresses = [...(user.addresses || []), { ...newAddress, isPrimary: !(user.addresses || []).length }];
    setNewAddress({ label: "Home", details: "", city: "", state: "" });
    await saveAddresses(addresses);
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
      const res = await fetch(`${getApiUrl()}/api/orders/my`, {
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

  /**
   * loadNotifications: Fetches unread notifications count
   */
  const loadNotifications = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/notifications/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const items = await res.json();
        const unreadItems = Array.isArray(items) ? items.filter((item) => !(item.read || item.isRead)) : [];
        setUnreadCount(unreadItems.length);

        // Check if there is an unread birthday notification to show as a push toast
        const birthdayNotif = unreadItems.find(item => item.data?.event === "user_birthday_today" || item.title.includes("Birthday") || item.title.includes("🎂"));
        if (birthdayNotif) {
          const shownKey = `bday_toast_shown_${birthdayNotif._id}`;
          if (!sessionStorage.getItem(shownKey)) {
            sessionStorage.setItem(shownKey, "true");
            setActivePushToast(birthdayNotif);
            setTimeout(() => {
              setActivePushToast(null);
            }, 8000);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load user notifications:", err);
    }
  };

  /* --- NAVIGATION LINKS CONFIGS --- */
  const desktopNavLinks = [
    { to: "/user/menu", label: t("menu"), icon: <Home size={20} /> },
    { to: "/user/wishlist", label: t("wishlist"), icon: <Heart size={20} /> },
    { to: "/user/cart", label: t("cart"), icon: <ShoppingCart size={20} /> },
    { to: "/user/orders", label: t("orders"), icon: <Clock size={20} /> },
    { to: "/user/notifications", label: t("notifications"), icon: <Bell size={20} /> },
    { to: "/user/contact", label: t("contact"), icon: <MessageCircle size={20} /> },
  ];

  const bottomNavLinks = [
    { to: "/user/menu", label: t("menu"), icon: <Home size={20} /> },
    { to: "/user/orders", label: t("orders"), icon: <Clock size={20} />, badge: pendingCount },
    { to: "/user/cart", label: t("cart"), icon: <ShoppingCart size={20} />, badge: cartCount },
    { to: "/user/profile", label: t("profile"), icon: <User size={20} /> },
  ];

  const moreLinks = [
    { to: "/user/wishlist", label: t("wishlist"), icon: <Heart size={20} /> },
    { to: "/user/notifications", label: t("notifications"), icon: <Bell size={20} /> },
    { to: "/user/contact", label: t("contact"), icon: <MessageCircle size={20} /> },
    ...(isLoggedIn ? [{ label: t("logout"), icon: <LogOut size={20} />, action: () => { setOpen(false); setShowLogoutConfirm(true); }, danger: true }] : [])
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
              <img src="/logo/final-logo.png" alt="GreenGo" className="w-full h-full object-cover" />
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
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
          {desktopNavLinks.map(({ to, end, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4.5 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                isActive
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-white hover:pl-6"
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
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100/80 dark:hover:bg-red-950/30 text-red-650 dark:text-red-400 font-bold transition-colors"
            >
              <LogOut size={16} />
              {t("logout")}
            </button>
          ) : (
            <button
              onClick={() => navigate("/", { state: { loginRequired: true, from: { pathname: "/user/menu" } } })}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-colors shadow-md shadow-brand-500/20"
            >
              <User size={16} />
              Login
            </button>
          )}
        </div>
      </div>

      {/* --- 2. MAIN WORKSPACE CONTAINER --- */}
      {/* Tailwind: md:pl-72 shifts container content to prevent occlusion by the fixed desktop sidebar */}
      <div className="flex-1 flex flex-col w-full md:pl-72 min-h-screen transition-all duration-300">
        
        {/* --- MOBILE TOPBAR (FIXED HEADER) --- */}
        {/* Hidden on desktop. Sticky top-0 pins it at the top of the mobile screen. */}
        <div 
          className="sticky top-0 z-40 flex items-center justify-between px-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 md:hidden transition-colors duration-300 shadow-sm"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            height: "calc(4rem + env(safe-area-inset-top))"
          }}
        >
          {/* Brand Logo & Location selector */}
          <div className="flex flex-1 items-center gap-2 min-w-0 relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md overflow-hidden bg-white border border-brand-100 dark:border-brand-900 shrink-0 select-none pointer-events-none [&>span]:hidden">
              <img src="/logo/final-logo.png" alt="GreenGo" className="w-full h-full object-cover" />
              <span className="text-white text-sm">🍔</span>
            </div>
            
            <div className="min-w-0 relative flex-1">
              <div className="flex items-center gap-0.5">
                <span className="font-extrabold text-brand-500 text-base tracking-tight leading-none">Green</span>
                <span className="font-extrabold text-slate-950 dark:text-white text-base tracking-tight leading-none">GO</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isLoggedIn) {
                    setShowAddressPicker(!showAddressPicker);
                  } else {
                    navigate("/", { state: { loginRequired: true, from: { pathname: "/user/menu" } } });
                  }
                }}
                className="flex items-center gap-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-bold max-w-[130px] sm:max-w-[200px]"
              >
                <MapPin size={10} className="text-brand-500 shrink-0" />
                <span className="truncate">{(user.addresses || []).find(addr => addr.isPrimary) || (user.addresses || [])[0] ? [(user.addresses || []).find(addr => addr.isPrimary) || (user.addresses || [])[0]].map(addr => [addr.label, formatAddressLine(addr)].filter(Boolean).join(" - ")) : "Select address"}</span>
                <ChevronDown size={11} className="shrink-0" />
              </button>

              {/* Address Picker Popover */}
              {showAddressPicker && (
                <div className="absolute left-0 top-full mt-2 w-[280px] bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] p-3 text-slate-900 dark:text-white">
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(user.addresses || []).map((addr, index) => (
                      <button key={index} type="button" onClick={() => { setPrimaryAddress(index); setShowAddressPicker(false); }} className={`w-full text-left p-2.5 rounded-xl border transition-all ${addr.isPrimary ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">{addr.label || "Address"}</span>
                          {addr.isPrimary && <span className="text-[8px] font-black text-brand-600 dark:text-brand-400 uppercase">Primary</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold line-clamp-2 mt-0.5">{formatAddressLine(addr) || "Address details required"}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} placeholder="Home" className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-900 dark:text-white outline-none" />
                      <input value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="City" className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-900 dark:text-white outline-none" />
                    </div>
                    <input value={newAddress.details} onChange={(e) => setNewAddress({ ...newAddress, details: e.target.value })} placeholder="Full address" className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-900 dark:text-white outline-none" />
                    <button type="button" onClick={addAddress} className="w-full py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-extrabold flex items-center justify-center gap-1">
                      <Plus size={11} /> Add Address
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button 
              onClick={() => {
                navigate("/user/notifications");
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 shadow-sm relative"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-500 rounded-full border border-white dark:border-slate-900" />
              )}
            </button>
            <button
              onClick={() => {
                navigate("/user/profile");
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-500 text-white font-extrabold text-sm shadow-sm"
              aria-label="Profile"
            >
              {name ? name.charAt(0).toUpperCase() : "U"}
            </button>
          </div>
        </div>

        {/* Page Content Panel */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8 overflow-x-hidden">
          <div className="w-full min-h-full max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </div>
      </div>

      {/* --- 3. FIXED BOTTOM NAVIGATION BAR (MOBILE ONLY) --- */}
      {/* Pinned permanently to bottom viewport edge. Respects safe area bottom inset. */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom)] transition-all duration-300">
        <nav className="flex items-center justify-around py-2.5 px-2 h-16">
          {bottomNavLinks.map(({ to, end, label, icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                "flex min-w-[58px] flex-col items-center justify-center relative py-1.5 px-2 rounded-xl transition-all duration-300 active:scale-95",
                isActive 
                  ? "text-brand-600 scale-105 bg-brand-500/10 dark:text-brand-300 dark:bg-brand-500/15 font-black" 
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
            className="flex min-w-[58px] flex-col items-center justify-center relative py-1.5 px-2 rounded-xl text-slate-500 dark:text-slate-300 font-bold transition-all active:scale-95"
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

      {/* --- GOOGLE/ANDROID SYSTEM PUSH TOAST --- */}
      <AnimatePresence>
        {activePushToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/95 dark:bg-slate-900/95 border border-slate-200/85 dark:border-slate-800 shadow-2xl rounded-2xl p-4 z-[99999] backdrop-blur-md flex gap-3 cursor-pointer select-none"
            onClick={() => {
              navigate("/user/notifications");
              setActivePushToast(null);
            }}
          >
            {/* App Logo */}
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md border border-brand-105 dark:border-brand-900 shrink-0 bg-white">
              <img src="/logo/final-logo.png" alt="GreenGo" className="w-full h-full object-cover" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GreenGo • Just Now</span>
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
              </div>
              <h4 className="font-extrabold text-slate-950 dark:text-white text-sm leading-snug">
                {activePushToast.title}
              </h4>
              <p className="text-xs font-semibold text-slate-650 dark:text-slate-350 leading-relaxed mt-0.5 line-clamp-3">
                {activePushToast.message}
              </p>
            </div>
          </motion.div>
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


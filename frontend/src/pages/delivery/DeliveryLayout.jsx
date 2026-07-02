import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Bell, ClipboardList, Home, LogOut, Moon, Sun, User, Wallet, MoreHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clearSession } from "../../utils/authStorage";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../utils/cn";
import API from "../../api/axios";

const MotionDiv = motion.div;

// Helper utility to evaluate whether the delivery boy's profile contains all essential credentials.
const isDeliveryProfileComplete = (user = {}) => Boolean(
  user?.deliveryDetails?.profileCompleted &&
  String(user?.name || "").trim() &&
  String(user?.phone || "").trim() &&
  String(user?.deliveryDetails?.address || user?.address || "").trim()
);

export default function DeliveryLayout() {
  // --- REACT STATE & CUSTOM HOOKS ---
  
  // Navigation utility to transition between routes
  const navigate = useNavigate();
  
  // Hook to retrieve current URL pathname
  const location = useLocation();
  
  // Context hook supplying light/dark theme values and toggles
  const { theme, toggleTheme } = useTheme();
  
  // State storing the logged-in delivery user profile model
  const [profile, setProfile] = useState({});
  
  // State mapping the count of unread alert notifications
  const [unreadCount, setUnreadCount] = useState(0);

  // State to control visibility of More drawer in mobile viewport
  const [open, setOpen] = useState(false);

  // State to toggle logout confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // --- BUSINESS LOGIC & DATA FETCHING ---

  // Fetches authenticated delivery agent user profile
  const loadProfile = useCallback(async () => {
    try {
      const res = await API.get("/api/users/me");
      const user = res.data || {};
      setProfile(user);
      // Automatically enforces redirecting to /delivery/profile if profile details are incomplete
      if (!isDeliveryProfileComplete(user) && location.pathname !== "/delivery/profile") {
        navigate("/delivery/profile", { replace: true });
      }
    } catch (err) {
      console.error("Failed to load delivery profile:", err);
    }
  }, [location.pathname, navigate]);

  // Fetches user-specific notifications to compute unread counts
  async function loadNotifications() {
    try {
      const res = await API.get("/api/notifications/my");
      const items = Array.isArray(res.data) ? res.data : [];
      // Calculate total notifications which don't have read set to true
      setUnreadCount(items.filter((item) => !(item.read || item.isRead)).length);
    } catch (err) {
      console.error("Failed to load delivery notifications:", err);
    }
  }

  // Handles initialization, polling schedules, and custom update event listeners
  useEffect(() => {
    Promise.resolve().then(() => {
      loadProfile();
      loadNotifications();
    });
    
    // Set up a polling interval to periodically check for new notifications every 15 seconds
    const timer = setInterval(loadNotifications, 15000);
    
    // Custom event listener triggered when updating fields within the DeliveryProfile component
    window.addEventListener("delivery-profile-updated", loadProfile);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener("delivery-profile-updated", loadProfile);
    };
  }, [loadProfile]);

  // Enforces profile redirect constraints whenever the profile or location pathname updates
  useEffect(() => {
    if (profile?._id && !isDeliveryProfileComplete(profile) && location.pathname !== "/delivery/profile") {
      navigate("/delivery/profile", { replace: true });
    }
  }, [profile, location.pathname, navigate]);

  // Performs session teardown, cookie/storage clearance and pushes back to /login
  const logout = async () => {
    await clearSession();
    navigate("/login", { replace: true });
  };

  // Sidebar and mobile tab bar navigation items configuration
  const links = [
    { to: "/delivery", end: true, label: "Dashboard", icon: <Home size={20} /> },
    { to: "/delivery/orders", label: "Orders", icon: <ClipboardList size={20} /> },
    { to: "/delivery/earnings", label: "Earnings", icon: <Wallet size={20} /> },
    { to: "/delivery/profile", label: "Profile", icon: <User size={20} /> },
  ];

  const bottomLinks = [
    { to: "/delivery", end: true, label: "Dashboard", icon: <Home size={20} /> },
    { to: "/delivery/orders", label: "Orders", icon: <ClipboardList size={20} /> },
    { to: "/delivery/earnings", label: "Earnings", icon: <Wallet size={20} /> },
  ];

  const moreLinks = [
    { to: "/delivery/profile", label: "Profile", icon: <User size={20} /> },
    { label: "Sign Out", icon: <LogOut size={20} />, action: () => { setOpen(false); setShowLogoutConfirm(true); }, danger: true },
  ];

  const profileComplete = isDeliveryProfileComplete(profile);

  return (
    // Main container configuration: matches responsive background colours and handles theme transition styling.
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white transition-colors duration-300">
      
      {/* --- DESKTOP SIDEBAR --- */}
      {/* Visible only on medium screens and larger ('hidden md:flex'). Employs static layout positioning ('fixed left-0 top-0 bottom-0 z-[1000] w-72'). */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-[1000] w-72 bg-slate-950 text-white border-r border-slate-800 shadow-2xl flex-col">
        
        {/* --- LOGO HEADER SECTION --- */}
        {/* Displays brand icon logo and panel metadata */}
        <div className="px-6 h-20 flex items-center gap-3 border-b border-slate-800/70">
          <div className="w-10 h-10 rounded-xl bg-white border border-brand-900/40 shadow-md shadow-brand-500/15 overflow-hidden flex items-center justify-center [&>span]:hidden">
            <img src="/greengo-logo.png" alt="GreenGo" className="w-full h-full object-cover" />
            <span className="font-black text-brand-500">G</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-black text-xl leading-none">GreenGo</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-400 mt-1">Delivery Panel</p>
          </div>
        </div>

        {/* --- PARTNER BRIEF SECTION --- */}
        {/* Shows avatar with name initials and verification status beacon */}
        <div className="px-6 py-5 border-b border-slate-800/70">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full bg-slate-900 border-2 border-brand-500/50 flex items-center justify-center">
              <span className="text-brand-300 font-black">{profile.name ? profile.name.charAt(0).toUpperCase() : "D"}</span>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-brand-500 border-2 border-slate-950" />
            </div>
            <div className="min-w-0">
              <p className="font-black truncate">{profile.name || "Delivery Partner"}</p>
              <p className="text-xs font-bold text-slate-400">Delivery Partner</p>
            </div>
          </div>
        </div>

        {/* --- SIDEBAR NAVIGATION LINKS --- */}
        {/* Iterates links array. Restricts navigation to profile completion route if mandatory parameters are missing */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          {links.map(({ to, end, label, icon }) => {
            const locked = !profileComplete && to !== "/delivery/profile";
            return (
              <NavLink
                key={to}
                to={locked ? "/delivery/profile" : to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200",
                    isActive
                      ? "bg-brand-500/15 text-brand-300 shadow-sm"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  )
                }
              >
                {icon} {label}
              </NavLink>
            );
          })}
        </nav>

        {/* --- LOGOUT BUTTON SECTION --- */}
        <div className="p-4 border-t border-slate-800/70">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900/70 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-300 hover:text-red-400 font-bold transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN WRAPPER & MOBILE COMPATIBLE SECTION --- */}
      {/* Offsets desktop viewports to compensate for fixed sidebar ('md:pl-72') */}
      <div className="flex-1 min-h-screen md:pl-72">
        
        {/* --- TOP BAR HEADER --- */}
        {/* Floating navbar featuring dark mode toggles, notification indicators and profile alerts */}
        <header 
          className="sticky top-0 z-40 h-auto min-h-16 md:min-h-20 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800 transition-colors"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <div className="md:hidden w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-md shrink-0">
                <span className="text-white text-sm font-black">G</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">Delivery Panel</p>
                <h1 className="text-base sm:text-lg md:text-xl font-black truncate">Hi, {profile.name || "Delivery Partner"}</h1>
              </div>
            </div>
            {!profileComplete && (
              <p className="hidden sm:block text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-300">Complete profile first</p>
            )}
            <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-800 shadow-sm" aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button type="button" onClick={() => navigate("/delivery/orders")} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-800 shadow-sm relative" aria-label="Open orders">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>
            <button type="button" onClick={() => navigate("/delivery/profile")} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-800 shadow-sm" aria-label="Open profile">
              <User size={18} />
            </button>
            <button type="button" onClick={() => setShowLogoutConfirm(true)} className="hidden sm:flex h-10 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-bold items-center gap-2 transition-colors">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

        {/* Dynamic Route Content Rendering Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 pb-28 md:pb-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* --- MOBILE TAB NAVIGATION BAR --- */}
      {/* Displayed only on screens smaller than medium width ('md:hidden') fixed at bottom screen border */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden bg-white/85 dark:bg-slate-950/90 backdrop-blur-xl border border-white/40 dark:border-slate-800/70 shadow-[0_8px_32px_rgba(15,23,42,0.16)] rounded-2xl flex items-center justify-around px-2 py-2.5">
        {bottomLinks.map(({ to, end, label, icon }) => {
          const locked = !profileComplete && to !== "/delivery/profile";
          return (
          <NavLink
            key={to}
            to={locked ? "/delivery/profile" : to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex min-w-[58px] flex-col items-center justify-center px-2 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-95",
                isActive ? "text-brand-600 bg-brand-500/10 dark:text-brand-300 dark:bg-brand-500/15 scale-105" : "text-slate-500 dark:text-slate-300"
              )
            }
          >
            {icon}
            <span className="mt-1">{label}</span>
          </NavLink>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-w-[58px] flex-col items-center justify-center relative py-1.5 px-2 rounded-xl text-slate-500 dark:text-slate-300 font-black transition-all active:scale-95"
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] mt-1 tracking-tight select-none">More</span>
        </button>
      </nav>

      {/* --- MOBILE MORE OPTIONS DRAWER / BOTTOM SHEET --- */}
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

                  const locked = !profileComplete && to !== "/delivery/profile";

                  return (
                    <NavLink
                      key={to}
                      to={locked ? "/delivery/profile" : to}
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

      {/* Premium Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 font-sans">
            {/* Backdrop Mask */}
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0"
            />
            
            {/* Modal Card */}
            <MotionDiv
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center text-slate-950 dark:text-white"
            >
              {/* Warning/Door Icon Container */}
              <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-3xl mb-4 shadow-inner">
                🚪
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-black tracking-tight mb-2">
                Confirm Logout
              </h3>
              
              {/* Message */}
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold leading-relaxed mb-6">
                Aap confirm hain ki logout karna chahte hain?
              </p>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all outline-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all outline-none"
                >
                  Yes, Logout
                </button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

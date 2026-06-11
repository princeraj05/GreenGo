import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Bell, ClipboardList, Home, LogOut, Moon, Sun, User, Wallet } from "lucide-react";
import { clearSession } from "../../utils/authStorage";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../utils/cn";
import API from "../../api/axios";

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
    { to: "/delivery", end: true, label: "Home", icon: <Home size={20} /> },
    { to: "/delivery/orders", label: "Orders", icon: <ClipboardList size={20} /> },
    { to: "/delivery/earnings", label: "Earnings", icon: <Wallet size={20} /> },
    { to: "/delivery/profile", label: "Profile", icon: <User size={20} /> },
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
            <img src="/greengo-logo.svg" alt="GreenGo" className="w-full h-full object-cover" />
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
            onClick={logout}
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
        <header className="sticky top-0 z-40 h-auto min-h-16 md:min-h-20 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <div className="md:hidden w-9 h-9 rounded-xl bg-white border border-brand-100 dark:border-brand-900 overflow-hidden shadow-sm flex items-center justify-center [&>span]:hidden">
                <img src="/greengo-logo.svg" alt="GreenGo" className="w-full h-full object-cover" />
                <span className="font-black text-brand-500">G</span>
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
            <button type="button" onClick={toggleTheme} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors" aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button type="button" onClick={() => navigate("/delivery/orders")} className="relative w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors" aria-label="Open orders">
              <Bell size={17} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-brand-500 text-white text-[10px] font-black flex items-center justify-center">{unreadCount}</span>}
            </button>
            <button type="button" onClick={logout} className="hidden sm:flex h-10 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-bold items-center gap-2 transition-colors">
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
        {links.map(({ to, end, label, icon }) => {
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
      </nav>
    </div>
  );
}

import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, UtensilsCrossed, ShoppingCart, 
  Clock, User, Phone, LogOut, Menu, X, Home 
} from "lucide-react";
import { getToken } from "../../utils/getToken";
import { cn } from "../../utils/cn";

export default function UserLayout() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  // Bottom Navigation state & badges
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadUser();
    updateCartCount();
    loadPendingOrdersCount();

    // Listen to custom cart updates
    window.addEventListener("cart-updated", updateCartCount);

    // Listen to scroll events to hide/show bottom nav
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

    // Poll pending orders count
    const interval = setInterval(loadPendingOrdersCount, 15000);

    return () => {
      window.removeEventListener("cart-updated", updateCartCount);
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, [lastScrollY]);

  const loadUser = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setName(data.name);
      }
    } catch (e) {
      console.error("Failed to load user info:", e);
    }
  };

  const updateCartCount = () => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = data.reduce((sum, item) => sum + (item.qty || 0), 0);
    setCartCount(totalItems);
  };

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

  const desktopNavLinks = [
    { to: "/user", end: true, label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { to: "/user/menu", label: "Menu", icon: <UtensilsCrossed size={20} /> },
    { to: "/user/cart", label: "Cart", icon: <ShoppingCart size={20} /> },
    { to: "/user/orders", label: "My Orders", icon: <Clock size={20} /> },
    { to: "/user/profile", label: "Profile", icon: <User size={20} /> },
    { to: "/user/contact", label: "Contact", icon: <Phone size={20} /> },
  ];

  const bottomNavLinks = [
    { to: "/user", end: true, label: "Home", icon: <Home size={20} /> },
    { to: "/user/menu", label: "Menu", icon: <UtensilsCrossed size={20} /> },
    { to: "/user/cart", label: "Cart", icon: <ShoppingCart size={20} />, badge: cartCount },
    { to: "/user/orders", label: "Orders", icon: <Clock size={20} />, badge: pendingCount },
    { to: "/user/profile", label: "Profile", icon: <User size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Overlay (Only for desktop-fallback drawer click, but not used by main mobile flow anymore) */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[900] md:hidden transition-all duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Desktop Sidebar (Hidden on mobile) */}
      <div className="fixed top-0 left-0 bottom-0 w-72 z-[1000] hidden md:flex flex-col bg-white border-r border-slate-200 shadow-sm">
        {/* Brand */}
        <div className="px-6 h-20 flex items-center border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-md shadow-brand-500/20">
              <span className="text-white text-xl">🍔</span>
            </div>
            <span className="text-slate-900 font-extrabold text-xl tracking-tight">ByteBite</span>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <User size={24} className="text-slate-500" />
            </div>
            <div>
              <p className="text-slate-900 font-bold">{name || "User"}</p>
              <p className="text-slate-500 text-sm font-medium">Food Lover</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
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
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => navigate("/login")}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full md:pl-72 min-h-screen transition-all duration-300">
        
        {/* Mobile Topbar */}
        <div className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 bg-white/80 backdrop-blur-md border-b border-slate-200 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <span className="text-white text-sm">🍔</span>
            </div>
            <span className="font-extrabold text-slate-900 text-lg">ByteBite</span>
          </div>
          {/* Right avatar or profile button for mobile topbar instead of hamburger */}
          <button 
            onClick={() => navigate("/user/profile")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-100 shadow-sm"
          >
            <User size={18} />
          </button>
        </div>

        {/* Page Content - with additional padding-bottom on mobile to prevent occlusion by bottom nav */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 overflow-x-hidden">
          <div className="w-full h-full max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Modern Glassmorphic Bottom Navigation Bar (Mobile View) */}
      <div className={cn(
        "fixed bottom-4 left-4 right-4 z-50 transition-all duration-300 transform md:hidden",
        showBottomNav ? "translate-y-0 opacity-100" : "translate-y-28 opacity-0 pointer-events-none"
      )}>
        <nav className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl flex items-center justify-around py-2.5 px-3">
          {bottomNavLinks.map(({ to, end, label, icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center relative py-1.5 px-4 rounded-xl transition-all duration-300 active:scale-90",
                isActive 
                  ? "text-brand-500 scale-105 bg-brand-500/10 font-black" 
                  : "text-slate-400 hover:text-slate-600 font-bold"
              )}
            >
              <div className="relative">
                {icon}
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-brand-500 text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-white">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight select-none">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
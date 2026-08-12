import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";
import { getApiUrl } from "../../utils/getApiUrl";
import { Link } from "react-router-dom";
import { Bell, Sparkles, AlertTriangle, X, Calendar } from "lucide-react";

import DashboardHero from "../../components/dashboard/DashboardHero";
import QuickActions from "../../components/dashboard/QuickActions";
import ActiveOrdersCard from "../../components/dashboard/ActiveOrdersCard";
import UserStats from "../../components/dashboard/UserStats";
import ActivityTimeline from "../../components/dashboard/ActivityTimeline";
import RecommendedFoods from "../../components/dashboard/RecommendedFoods";
import OffersSection from "../../components/dashboard/OffersSection";

/**
 * UserDashboard Component
 * 
 * Aggregates client metrics, lists ongoing orders, recommends food categories,
 * displays promo banners, and lists alerts. Includes developer diagnostics reporting.
 */
export default function UserDashboard() {
  
  /* --- STATE DECLARATIONS --- */
  // orders: Previous checkout history of the user
  const [orders, setOrders] = useState([]);
  // foods: Curated dishes recommended for the dashboard stream
  const [foods, setFoods] = useState([]);
  // user: Information matching profile record of the client
  const [user, setUser] = useState({});
  // stats: Summary metrics (orders count, total price sum, loyal reward points)
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, rewardPoints: 0 });
  // offers: Active coupons and deals
  const [offers, setOffers] = useState([]);
  // notifications: Alerts and broadcasts from administration
  const [notifications, setNotifications] = useState([]);
  // dismissedNotifs: Local storage reference tracking closed alerts
  const [dismissedNotifs, setDismissedNotifs] = useState(
    JSON.parse(localStorage.getItem("dismissedNotifs")) || []
  );
  // loading: Page spinner toggle
  const [loading, setLoading] = useState(true);

  /* --- DATA FETCHING & EFFECTS --- */

  // Triggers API pipeline on dashboard mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  /**
   * loadDashboardData: Parallel queries fetching all dashboard-related resources.
   * Includes diagnostics logs for debugging purposes.
   */
  const loadDashboardData = async () => {
    try {
      const token = await getToken();
      if (window.diagnostics) {
        window.diagnostics.userDashboardMounted = "YES";
        window.diagnostics.loadingState = "UserDashboard: loading data";
        window.diagnostics.addLog(`UserDashboard: Mounting. Token exists = ${!!token}`);
      }

      if (!token) {
        if (window.diagnostics) {
          window.diagnostics.addError("UserDashboard: No token found. Aborting fetch.");
        }
        return;
      }

      if (window.diagnostics) {
        window.diagnostics.addLog(`UserDashboard: Fetching dashboard APIs from VITE_API_URL = ${getApiUrl()}`);
      }
      
      // Parallel network fetches for dashboard data
      const [ordersRes, recommendedRes, userRes, statsRes, offersRes, notifRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/orders/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiUrl()}/api/dashboard/recommended`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiUrl()}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiUrl()}/api/dashboard/user-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiUrl()}/api/dashboard/offers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiUrl()}/api/notifications/my`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (window.diagnostics) {
        window.diagnostics.addLog(`UserDashboard: API fetches returned status codes: orders=${ordersRes.status}, user=${userRes.status}`);
      }

      const [ordersData, recommendedData, userData, statsData, offersData, notifData] = await Promise.all([
        ordersRes.json(),
        recommendedRes.json(),
        userRes.json(),
        statsRes.json(),
        offersRes.json(),
        notifRes.json()
      ]);

      if (window.diagnostics) {
        window.diagnostics.userObject = userData;
        window.diagnostics.addLog(`UserDashboard: Dashboard data successfully parsed. User = "${userData?.name}"`);
        window.diagnostics.loadingState = "UserDashboard: complete";
      }

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setFoods(Array.isArray(recommendedData) ? recommendedData : []);
      setUser(userData || {});
      setStats(statsData || { totalOrders: 0, totalSpent: 0, rewardPoints: 0 });
      setOffers(Array.isArray(offersData) ? offersData : []);
      setNotifications(Array.isArray(notifData) ? notifData : []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      if (window.diagnostics) {
        window.diagnostics.addError(`UserDashboard load error: ${err.message}\nStack: ${err.stack}`);
      }
    } finally {
      setLoading(false);
    }
  };

  /* --- MEMOIZED / DERIVED VARIABLES --- */
  const activeOrders = orders.filter(o => ["Pending", "RestaurantAccepted", "Preparing", "AcceptedByDeliveryBoy", "Out for Delivery", "CancellationRequested"].includes(o.status));
  const activeOrdersCount = activeOrders.length;
  const mostRecentActiveOrder = activeOrders.length > 0 ? activeOrders[0] : null;
  
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  // Filters out expired and user-dismissed alerts
  const activeNotifications = notifications.filter(n => {
    const isDismissed = dismissedNotifs.includes(n._id);
    const isExpired = n.expiresAt && new Date(n.expiresAt) <= new Date();
    return !isDismissed && !isExpired;
  });

  /* --- BIRTHDAY LOGIC --- */
  const today = new Date();
  const isBirthdayToday = user.birthDate && (
    new Date(user.birthDate).getMonth() === today.getMonth() &&
    new Date(user.birthDate).getDate() === today.getDate()
  );
  
  const birthdayOffer = offers.find(o => o.code === "BIRTHDAY");
  const birthdayDiscountAmount = birthdayOffer ? birthdayOffer.discountValue : 50;
  const birthdayMinOrder = birthdayOffer ? birthdayOffer.minimumOrder : 0;

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">Preparing your dashboard...</p>
      </div>
    );
  }

  return (
    /* --- MAIN DASHBOARD VIEW --- */
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-10 min-h-screen">
      
      {/* --- NOTIFICATIONS BANNER LIST --- */}
      {activeNotifications.length > 0 && (
        <div className="flex flex-col gap-4 mx-4 sm:mx-0 mt-6 mb-2">
          {activeNotifications.map(n => {
            const isSuccess = n.type === 'success';
            const isWarning = n.type === 'warning';
            
            return (
              <div 
                key={n._id} 
                className={`p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/60 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md flex items-start justify-between gap-4 transition-all hover:shadow-md animate-fade-in ${
                  isSuccess ? 'border-l-4 border-l-emerald-500' : 
                  isWarning ? 'border-l-4 border-l-amber-500' : 
                  'border-l-4 border-l-sky-500'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    isSuccess ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' :
                    isWarning ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' :
                    'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400'
                  }`}>
                    {isSuccess ? <Sparkles size={20} /> : isWarning ? <AlertTriangle size={20} /> : <Bell size={20} />}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight truncate">
                      {n.title}
                    </h4>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                      {n.message}
                    </p>
                    {n.expiresAt && (
                      <div className="flex items-center gap-1 text-[10px] font-extrabold text-rose-500 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-md w-fit mt-1.5">
                        <Calendar size={10} />
                        <span>Valid until: {new Date(n.expiresAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    const updated = [...dismissedNotifs, n._id];
                    setDismissedNotifs(updated);
                    localStorage.setItem("dismissedNotifs", JSON.stringify(updated));
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all shrink-0 cursor-pointer"
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* --- BIRTHDAY CELEBRATION BANNER --- */}
      {isBirthdayToday && (
        <div className="mx-4 sm:mx-0 mb-6 p-6 rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-xl relative overflow-hidden group">
          {/* Confetti & Background Sparkles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl pointer-events-none -translate-x-1/4 translate-y-1/4" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
              <span className="text-5xl md:text-6xl animate-bounce select-none">🎂</span>
              <div className="space-y-1 flex-1 min-w-0">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm">
                  Happy Birthday, {user.name || "Customer"}! 🎉
                </h2>
                <p className="text-sm md:text-base font-semibold text-pink-100 max-w-lg leading-relaxed">
                  {birthdayDiscountAmount > 0 
                    ? `GreenGo wishes you a wonderful day filled with joy and delicious food! 🥳 To celebrate, we have credited a special birthday coupon just for you!`
                    : `GreenGo wishes you a wonderful day filled with joy, love, and delicious food! 🥳 Have a fantastic birthday celebration! 🍰`
                  }
                </p>
              </div>
            </div>
            
            {/* Special Coupon Details Box */}
            {birthdayDiscountAmount > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col items-center justify-center shrink-0 min-w-[200px] shadow-inner text-center">
                <span className="text-[10px] font-extrabold tracking-widest text-pink-200 uppercase">Your Gift Code</span>
                <span className="text-2xl font-black tracking-wider text-yellow-350 select-all my-1">BIRTHDAY</span>
                <span className="text-xs font-bold text-white bg-pink-600/50 px-2.5 py-0.5 rounded-full mt-1">₹{birthdayDiscountAmount} Flat Discount</span>
                <span className="text-[10px] text-pink-100 font-semibold mt-1.5 opacity-90">
                  {birthdayMinOrder > 0 ? `Valid on orders above ₹${birthdayMinOrder}` : "No minimum order limit"}
                </span>
                <span className="text-[10px] text-pink-100 font-semibold opacity-75 mt-0.5">Expires at 11:59 PM tonight</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- DASHBOARD HERO COMPONENT --- */}
      <DashboardHero userName={user.name} />
      
      {/* --- QUICK ACTION BUTTONS --- */}
      <QuickActions />
      
    </div>
  );
}


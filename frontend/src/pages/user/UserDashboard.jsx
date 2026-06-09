import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";
import { Link } from "react-router-dom";
import { Bell, Sparkles, AlertTriangle, X, Calendar } from "lucide-react";

import DashboardHero from "../../components/dashboard/DashboardHero";
import QuickActions from "../../components/dashboard/QuickActions";
import ActiveOrdersCard from "../../components/dashboard/ActiveOrdersCard";
import UserStats from "../../components/dashboard/UserStats";
import ActivityTimeline from "../../components/dashboard/ActivityTimeline";
import RecommendedFoods from "../../components/dashboard/RecommendedFoods";
import OffersSection from "../../components/dashboard/OffersSection";

export default function UserDashboard() {
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]); // Recommended Foods
  const [user, setUser] = useState({});
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, rewardPoints: 0 });
  const [offers, setOffers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dismissedNotifs, setDismissedNotifs] = useState(
    JSON.parse(localStorage.getItem("dismissedNotifs")) || []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

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
        window.diagnostics.addLog(`UserDashboard: Fetching dashboard APIs from VITE_API_URL = ${import.meta.env.VITE_API_URL}`);
      }
      const [ordersRes, recommendedRes, userRes, statsRes, offersRes, notifRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/orders/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/recommended`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/user-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/offers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/api/notifications/my`, { headers: { Authorization: `Bearer ${token}` } })
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

  const activeOrders = orders.filter(o => o.status === "Pending" || o.status === "Preparing" || o.status === "Out for Delivery");
  const activeOrdersCount = activeOrders.length;
  const mostRecentActiveOrder = activeOrders.length > 0 ? activeOrders[0] : null;
  
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const activeNotifications = notifications.filter(n => {
    const isDismissed = dismissedNotifs.includes(n._id);
    const isExpired = n.expiresAt && new Date(n.expiresAt) <= new Date();
    return !isDismissed && !isExpired;
  });

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">Preparing your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-10 min-h-screen">
      
      {/* Notifications Bar */}
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

      <DashboardHero userName={user.name} />
      
      <QuickActions />
      
    </div>
  );
}

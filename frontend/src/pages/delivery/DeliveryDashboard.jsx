import { createElement, useEffect, useState } from "react";
import { CheckCircle, Clock, CreditCard, Package, User, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import Button from "../../components/ui/Button";

// Styling configuration: defines the background, border, padding, and shadow for dashboard cards.
// Responsive design: uses 'p-4 sm:p-5' for adaptive padding.
const cardClass = "rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-sm";

export default function DeliveryDashboard() {
  // --- REACT STATE & NAVIGATION HOOKS ---
  
  // Navigation hook to redirect the user to different pages
  const navigate = useNavigate();
  
  // State to store dashboard metrics and statistics
  const [stats, setStats] = useState(null);
  
  // Loading state to toggle between skeleton loaders and the actual stats grid
  const [loading, setLoading] = useState(true);
  
  // State indicating whether the delivery agent needs to complete their profile first
  const [profileRequired, setProfileRequired] = useState(false);

  // --- DATA FETCHING & SIDE EFFECTS ---
  
  // Fetches statistics when the dashboard component mounts
  useEffect(() => {
    loadStats();
  }, []);

  // Async function to load delivery partner dashboard metrics from the backend
  const loadStats = async () => {
    try {
      const res = await API.get("/api/orders/delivery/dashboard");
      setStats(res.data);
      setProfileRequired(false);
    } catch (err) {
      console.error("Failed to load delivery dashboard:", err);
      // If profile completion is missing, redirect/prompt the user to update their profile
      if (err.response?.data?.code === "DELIVERY_PROFILE_INCOMPLETE") {
        setProfileRequired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- STATIC METRIC CARD CONFIGURATIONS ---
  // Mapping the fetched stats data to individual metric configurations (labels, values, icons, and theme classes)
  const cards = [
    { label: "Total Assigned Orders", value: stats?.totalAssignedOrders || 0, icon: Package, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
    { label: "Pending Orders", value: stats?.pendingOrders || 0, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
    { label: "Delivered Orders", value: stats?.deliveredOrders || 0, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "COD Earnings", value: `Rs. ${stats?.codEarnings || 0}`, icon: Wallet, color: "text-brand-600 bg-brand-50 dark:bg-brand-950/30" },
    { label: "UPI/Banking Orders", value: `${stats?.onlinePaidOrders || 0} | Rs. ${stats?.onlinePaymentAmount || 0}`, icon: CreditCard, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30" },
  ];

  return (
    // Outer container: 'space-y-5 sm:space-y-6' manages responsive vertical gap spacing between child layout blocks.
    <div className="space-y-5 sm:space-y-6">
      {/* --- HEADER SECTION --- */}
      {/* Displays the page title and description with responsive fonts ('text-2xl sm:text-3xl lg:text-4xl') */}
      <div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">Delivery Dashboard</h2>
        <p className="text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">Track assignments, delivery progress, COD credit, and online paid deliveries.</p>
      </div>

      {profileRequired ? (
        /* --- PROFILE COMPLETION ALERT SECTION --- */
        /* Prompts delivery agents to complete details like name, phone, and address to unlock orders */
        <div className="rounded-2xl bg-white dark:bg-slate-950 border border-amber-100 dark:border-amber-900/40 p-6 sm:p-8 text-center shadow-sm">
          <User className="mx-auto text-amber-500" size={38} />
          <h3 className="mt-4 text-xl font-black">Complete delivery profile first</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Name, phone number aur address save karne ke baad orders dashboard unlock hoga.</p>
          <Button onClick={() => navigate("/delivery/profile")} className="mt-5 rounded-2xl">Complete Profile</Button>
        </div>
      ) : loading ? (
        /* --- LOADING SKELETON CARDS SECTION --- */
        /* Temporary layout shown during data retrieval. Uses CSS animation ('animate-pulse') */
        /* Responsive Grid: spans 1 col by default, 2 cols on mobile view, 3 cols on large tablets, and 5 cols on desktop view */
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((item) => <div key={item} className={`${cardClass} h-32 animate-pulse bg-slate-100 dark:bg-slate-900`} />)}
        </div>
      ) : (
        /* --- STATISTICS CARDS SECTION --- */
        /* Main metric cards. Employs a responsive grid ('grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5') */
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {cards.map(({ label, value, icon, color }) => (
            /* Individual Metric Card: flex column configuration with 'justify-between' for top-bottom alignment */
            <div key={label} className={`${cardClass} min-h-[132px] sm:min-h-[142px] flex flex-col justify-between`}>
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                {createElement(icon, { size: 23 })}
              </span>
              <div className="mt-4 min-w-0">
                <p className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white break-words leading-tight">{value}</p>
                <p className="mt-1 text-[10px] sm:text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

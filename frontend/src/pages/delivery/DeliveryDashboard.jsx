import { createElement, useEffect, useState } from "react";
import { CheckCircle, Clock, CreditCard, Package, User, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import Button from "../../components/ui/Button";

const cardClass = "rounded-3xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-5 shadow-sm";

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileRequired, setProfileRequired] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await API.get("/api/orders/delivery/dashboard");
      setStats(res.data);
      setProfileRequired(false);
    } catch (err) {
      console.error("Failed to load delivery dashboard:", err);
      if (err.response?.data?.code === "DELIVERY_PROFILE_INCOMPLETE") {
        setProfileRequired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { label: "Total Assigned Orders", value: stats?.totalAssignedOrders || 0, icon: Package, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
    { label: "Pending Orders", value: stats?.pendingOrders || 0, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
    { label: "Delivered Orders", value: stats?.deliveredOrders || 0, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "COD Earnings", value: `₹${stats?.codEarnings || 0}`, icon: Wallet, color: "text-brand-600 bg-brand-50 dark:bg-brand-950/30" },
    { label: "UPI/Banking Orders", value: `${stats?.onlinePaidOrders || 0} | ₹${stats?.onlinePaymentAmount || 0}`, icon: CreditCard, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Delivery Dashboard</h2>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Track assignments, delivery progress, COD credit, and online paid deliveries.</p>
      </div>

      {profileRequired ? (
        <div className="rounded-3xl bg-white dark:bg-slate-950 border border-amber-100 dark:border-amber-900/40 p-8 text-center shadow-sm">
          <User className="mx-auto text-amber-500" size={38} />
          <h3 className="mt-4 text-xl font-black">Complete delivery profile first</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Name, phone number aur address save karne ke baad orders dashboard unlock hoga.</p>
          <Button onClick={() => navigate("/delivery/profile")} className="mt-5 rounded-2xl">Complete Profile</Button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-5">
          {[1, 2, 3, 4, 5].map((item) => <div key={item} className={`${cardClass} h-32 animate-pulse bg-slate-100 dark:bg-slate-900`} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-5">
          {cards.map(({ label, value, icon, color }) => (
            <div key={label} className={`${cardClass} min-h-[142px]`}>
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                {createElement(icon, { size: 23 })}
              </span>
              <p className="mt-4 text-xl sm:text-2xl font-black text-slate-950 dark:text-white break-words leading-tight">{value}</p>
              <p className="mt-1 text-[10px] sm:text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

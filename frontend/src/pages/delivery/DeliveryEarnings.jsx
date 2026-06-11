import { createElement, useEffect, useState } from "react";
import { Package, User, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

export default function DeliveryEarnings() {
  // --- REACT STATE & NAVIGATION HOOKS ---
  
  // Navigation hook to redirect the user to different pages
  const navigate = useNavigate();
  
  // State to store COD earnings and order history data
  const [data, setData] = useState(null);
  
  // Loading state to display skeleton screen when loading data
  const [loading, setLoading] = useState(true);
  
  // State indicating whether the delivery agent needs to complete their profile first
  const [profileRequired, setProfileRequired] = useState(false);

  // --- DATA FETCHING & SIDE EFFECTS ---
  
  // Fetches earnings when the component mounts
  useEffect(() => {
    loadEarnings();
  }, []);

  // Async function to load delivery partner earnings metrics and transaction rows
  const loadEarnings = async () => {
    try {
      const res = await API.get("/api/orders/delivery/earnings");
      setData(res.data);
      setProfileRequired(false);
    } catch (err) {
      console.error("Failed to load earnings:", err);
      // Handles incomplete profile error case
      if (err.response?.data?.code === "DELIVERY_PROFILE_INCOMPLETE") {
        setProfileRequired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- STATIC METRIC CARD CONFIGURATIONS ---
  // Mapping the fetched earnings data to array key-value pairs for render mapping
  const cards = [
    { label: "Total COD Orders", value: data?.totalCodOrders || 0, icon: Package, color: "text-blue-600 bg-blue-100 dark:bg-blue-950/30", accent: "from-blue-500 to-blue-600" },
    { label: "Delivery Pay", value: `Rs. ${data?.totalDeliveryBoyAmount || 0}`, icon: Wallet, color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-950/30", accent: "from-cyan-500 to-cyan-600" },
    { label: "Total COD Amount", value: `Rs. ${data?.totalCodAmount || 0}`, icon: Wallet, color: "text-amber-600 bg-amber-100 dark:bg-amber-950/30", accent: "from-amber-500 to-amber-600" },
    { label: "Delivered COD Orders", value: data?.deliveredCodOrders || 0, icon: Package, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30", accent: "from-emerald-500 to-emerald-600" },
    { label: "Current Credit", value: `Rs. ${data?.currentCredit || 0}`, icon: Wallet, color: "text-brand-600 bg-brand-100 dark:bg-brand-950/30", accent: "from-brand-500 to-brand-600" },
  ];

  return (
    // Outer container: spacing utility 'space-y-5 sm:space-y-6' for vertical item grouping.
    <div className="space-y-5 sm:space-y-6">
      {/* --- HEADER SECTION --- */}
      {/* Displays the page title and localized subtitle info */}
      <div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">COD Earnings</h2>
        <p className="text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400 mt-1">Only COD delivered orders add to your credit.</p>
      </div>

      {profileRequired ? (
        /* --- PROFILE COMPLETION ALERT SECTION --- */
        /* Prompt showing when delivery agent configuration is incomplete */
        <div className="rounded-2xl bg-white dark:bg-slate-950 border border-amber-100 dark:border-amber-900/40 p-6 sm:p-10 text-center shadow-sm">
          <User className="mx-auto text-amber-500" size={36} />
          <h3 className="mt-4 text-xl font-black">Complete delivery profile first</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Please complete your profile to view your earnings.</p>
          <Button onClick={() => navigate("/delivery/profile")} className="mt-5 rounded-2xl">Complete Profile</Button>
        </div>
      ) : loading ? (
        /* --- LOADING SKELETON SECTION --- */
        /* Simple pulse animation block when fetching content */
        <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
      ) : (
        <>
          {/* --- EARNING METRIC CARDS SECTION --- */}
          {/* Grid layout with dynamic columns: 1 on mobile, 2 on min-420px, 3 on large screens, 5 on wide desktops */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            {cards.map(({ label, value, icon, color, accent }) => (
              <div key={label} className="relative overflow-hidden group rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-sm min-h-[132px] sm:min-h-[142px] flex flex-col justify-between transition-all duration-300 hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${color}`}>
                    {createElement(icon, { size: 22 })}
                  </span>
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${accent} animate-pulse`}></div>
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-black break-words leading-tight tracking-tight">{value}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 leading-tight">{label}</p>
                </div>
                <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${accent} group-hover:w-full transition-all duration-500`}></div>
              </div>
            ))}
          </div>

          {/* --- ORDER HISTORY SECTION --- */}
          {/* Container holding historical delivery order details with rounded borders and responsive viewports */}
          <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* History Table Header Title Bar */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Package size={18} className="text-brand-600" />
              <h3 className="font-black">COD Order History</h3>
            </div>

            {/* --- RESPONSIVE MOBILE LIST CARD VIEW --- */}
            {/* Shows on mobile devices, hidden on medium screens (md:hidden) */}
            <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
              {(data?.rows || []).map((row) => (
                <div key={row.orderId} className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order ID</p>
                      <p className="font-black">#{String(row.orderId).slice(-6).toUpperCase()}</p>
                    </div>
                    <Badge variant={row.status === "Delivered" ? "success" : "warning"}>{row.status}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <Info label="Date" value={new Date(row.date).toLocaleDateString()} />
                    <Info label="Delivery Pay" value={`Rs. ${row.deliveryBoyAmount || 0}`} />
                    <Info label="Distance" value={`${row.distance || 0} km`} />
                    <Info label="Amount" value={`Rs. ${row.amount}`} />
                    <Info label="Customer" value={row.customer} />
                  </div>
                </div>
              ))}
              {(data?.rows || []).length === 0 && (
                <div className="p-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">No COD earnings yet.</div>
              )}
            </div>

            {/* --- TABLE VIEW FOR LARGER SCREENS --- */}
            {/* Shows on tablet/desktop devices, hidden on mobile screens (hidden md:block) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[640px] w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/60">
                  <tr>
                    {["Date", "Order ID", "Customer", "Amount", "Delivery Pay", "Distance", "Status"].map((head) => (
                      <th key={head} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(data?.rows || []).map((row) => (
                    <tr key={row.orderId}>
                      <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-black">#{String(row.orderId).slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3 font-semibold">{row.customer}</td>
                      <td className="px-4 py-3 font-black">Rs. {row.amount}</td>
                      <td className="px-4 py-3 font-black">Rs. {row.deliveryBoyAmount || 0}</td>
                      <td className="px-4 py-3 font-semibold">{row.distance || 0} km</td>
                      <td className="px-4 py-3"><Badge variant={row.status === "Delivered" ? "success" : "warning"}>{row.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(data?.rows || []).length === 0 && (
                <div className="p-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">No COD earnings yet.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper presentation component to format individual items inside mobile grid rows
function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-950 dark:text-white break-words">{value}</p>
    </div>
  );
}

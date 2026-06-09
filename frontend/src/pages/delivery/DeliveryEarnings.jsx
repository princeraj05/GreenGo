import { useEffect, useState } from "react";
import { Package, User, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

export default function DeliveryEarnings() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileRequired, setProfileRequired] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const res = await API.get("/api/orders/delivery/earnings");
      setData(res.data);
      setProfileRequired(false);
    } catch (err) {
      console.error("Failed to load earnings:", err);
      if (err.response?.data?.code === "DELIVERY_PROFILE_INCOMPLETE") {
        setProfileRequired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    ["Total COD Orders", data?.totalCodOrders || 0],
    ["Total COD Amount", `₹${data?.totalCodAmount || 0}`],
    ["Delivered COD Orders", data?.deliveredCodOrders || 0],
    ["Current Credit", `₹${data?.currentCredit || 0}`],
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">COD Earnings</h2>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Only COD delivered orders add to your credit.</p>
      </div>

      {profileRequired ? (
        <div className="rounded-3xl bg-white dark:bg-slate-950 border border-amber-100 dark:border-amber-900/40 p-10 text-center">
          <User className="mx-auto text-amber-500" size={36} />
          <h3 className="mt-4 text-xl font-black">Complete delivery profile first</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Earnings dekhne ke liye profile complete karo.</p>
          <Button onClick={() => navigate("/delivery/profile")} className="mt-5 rounded-2xl">Complete Profile</Button>
        </div>
      ) : loading ? (
        <div className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map(([label, value]) => (
              <div key={label} className="rounded-3xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                <Wallet size={23} className="text-brand-600" />
                <p className="mt-4 text-2xl font-black">{value}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Package size={18} className="text-brand-600" />
              <h3 className="font-black">COD Order History</h3>
            </div>
            <div className="grid gap-3 p-4 md:hidden">
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
                    <Info label="Amount" value={`₹${row.amount}`} />
                    <Info label="Customer" value={row.customer} />
                  </div>
                </div>
              ))}
              {(data?.rows || []).length === 0 && (
                <div className="p-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">No COD earnings yet.</div>
              )}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[640px] w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/60">
                  <tr>
                    {["Date", "Order ID", "Customer", "Amount", "Status"].map((head) => (
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
                      <td className="px-4 py-3 font-black">₹{row.amount}</td>
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

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-950 dark:text-white break-words">{value}</p>
    </div>
  );
}

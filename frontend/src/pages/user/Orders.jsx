import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    const t = setInterval(loadOrders, 10000);
    return () => clearInterval(t);
  }, []);

  const loadOrders = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (status) => {
    if (status === "Delivered") return 100;
    if (status === "Out for Delivery") return 75;
    if (status === "Preparing") return 50;
    return 25; // Pending
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-5xl mx-auto w-full animate-fade-in pb-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <span className="text-4xl">📦</span> My Orders
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Track your delicious food.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-6xl mb-4 block">😢</span>
          <h3 className="text-xl font-bold text-slate-900">No orders yet</h3>
          <p className="text-slate-500 mt-2">Time to order some tasty food!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(o => (
            <div key={o._id} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Order <span className="text-orange-500">#{o._id.slice(-6)}</span></h3>
                  <p className="text-slate-500 text-sm mt-1">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                    o.status === "Delivered" ? "bg-emerald-100 text-emerald-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>
                    {o.status}
                  </span>
                </div>
              </div>

              {/* TRACKER */}
              <div className="mb-10 relative">
                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-100">
                  <div style={{ width: `${getProgress(o.status)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000"></div>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400 px-1">
                  <span className={getProgress(o.status) >= 25 ? "text-orange-600" : ""}>Placed</span>
                  <span className={getProgress(o.status) >= 50 ? "text-orange-600" : ""}>Preparing</span>
                  <span className={getProgress(o.status) >= 75 ? "text-orange-600" : ""}>On the way</span>
                  <span className={getProgress(o.status) >= 100 ? "text-emerald-600" : ""}>Delivered</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                {o.items.map((i, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-3 border-b border-slate-200 last:border-0">
                    <img 
                      src={i.image?.startsWith('http') ? i.image : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/${i.image}`}
                      className="w-16 h-16 rounded-xl object-cover" 
                      onError={(e) => e.target.style.display="none"}
                    />
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{i.name}</p>
                      <p className="text-slate-500 text-sm">Qty: {i.qty}</p>
                    </div>
                    <p className="font-bold text-slate-900">₹{i.price * i.qty}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-6">
                <p className="text-slate-500 font-medium">Payment: <span className="text-slate-800 font-bold">{o.paymentMethod || "COD"}</span></p>
                <h3 className="text-2xl font-black text-slate-900">Total: <span className="text-orange-500">₹{o.total}</span></h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
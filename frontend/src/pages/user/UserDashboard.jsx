import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";
import { Link } from "react-router-dom";

export default function UserDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "Pending").length;
  const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
  const recentOrders = orders.slice(0, 5);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in pb-10">
      
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="text-4xl">👋</span> Welcome Back!
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Here is a quick overview of your delicious history.</p>
        </div>
        <Link to="/user/menu" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95 text-center">
          Browse Menu
        </Link>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="Total Orders" value={totalOrders} icon="🛍️" colorClass="bg-blue-50 text-blue-600" borderClass="border-blue-200" />
        <StatCard title="Pending" value={pendingOrders} icon="⏳" colorClass="bg-amber-50 text-amber-600" borderClass="border-amber-200" />
        <StatCard title="Delivered" value={deliveredOrders} icon="🎉" colorClass="bg-emerald-50 text-emerald-600" borderClass="border-emerald-200" />
      </div>

      {/* RECENT ORDERS */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Recent Orders
          </h3>
          {totalOrders > 5 && (
            <Link to="/user/orders" className="text-sm font-bold text-orange-500 hover:text-orange-600">View All</Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="text-6xl mb-4">🍔</div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">No orders yet</h4>
            <p className="text-slate-500">Looks like you haven't ordered anything yet. Let's fix that!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Order ID</th>
                  <th className="py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Items</th>
                  <th className="py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Status</th>
                  <th className="py-4 font-bold text-slate-400 uppercase tracking-wider text-xs text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, idx) => (
                  <tr key={order._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="py-4 font-medium text-slate-600">
                      <span className="text-slate-400">#</span>{order._id.slice(-6)}
                    </td>
                    <td className="py-4 text-slate-800 font-medium">
                      {order.items.map(i => i.name).join(", ")}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        order.status === "Delivered" ? "bg-emerald-100 text-emerald-700" :
                        order.status === "Pending" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 font-black text-slate-900 text-right">
                      ₹{order.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, colorClass, borderClass }) {
  return (
    <div className={`p-6 rounded-3xl border ${borderClass} ${colorClass} bg-opacity-30 backdrop-blur-sm transition-transform hover:scale-[1.02]`}>
      <div className="flex justify-between items-start mb-4">
        <p className="font-bold opacity-80 uppercase tracking-wider text-sm">{title}</p>
        <div className="text-2xl">{icon}</div>
      </div>
      <h2 className="text-4xl font-black">{value}</h2>
    </div>
  );
}
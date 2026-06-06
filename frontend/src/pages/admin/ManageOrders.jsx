import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Clock, CheckCircle, MapPin, Search } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [etaInput, setEtaInput] = useState({});

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const token = await getToken();
      const res = await API.get("/api/orders", { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data);
    } catch (err) { console.log(err); }
  };

  const setETA = async (id, status) => {
    try {
      const token = await getToken();
      await API.put(`/api/orders/${id}/status`,
        { status, etaMinutes: Number(etaInput[id]) || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEtaInput({});
      loadOrders();
    } catch (err) { console.log(err); }
  };

  const remaining = (o) => {
    if (o.status === "Delivered") return "Delivered";
    if (!o.etaMinutes || !o.etaSetAt) return "Not Set";
    const diff = o.etaMinutes * 60000 - (Date.now() - new Date(o.etaSetAt).getTime());
    if (diff <= 0) return "Delivered Soon";
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}m ${s}s`;
  };

  return (
    <div className="w-full pb-10">

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Package size={28} />
            </div>
            Manage Orders
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium">Track and update all customer orders in real-time.</p>
        </div>
      </motion.div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {orders.map((o, i) => (
            <motion.div 
              key={o._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card hover className="p-6 h-full flex flex-col border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">

                {/* Order ID + Status */}
                <div className="flex items-center justify-between mb-6">
                  <p className="font-extrabold text-slate-900 dark:text-white text-lg">
                    #<span className="text-emerald-600 dark:text-emerald-400">{o._id.slice(-6).toUpperCase()}</span>
                  </p>
                  <Badge variant={o.status === 'Delivered' ? 'success' : o.status === 'Preparing' ? 'warning' : 'default'} className="uppercase tracking-wider">
                    {o.status}
                  </Badge>
                </div>

                {/* Status Selector */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Update Status</label>
                  <select 
                    value={o.status} 
                    onChange={(e) => setETA(o._id, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer focus:bg-white dark:focus:bg-slate-950"
                  >
                    <option value="Pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pending</option>
                    <option value="Preparing" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Preparing</option>
                    <option value="Out for Delivery" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Out for Delivery</option>
                    <option value="Delivered" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Delivered</option>
                  </select>
                </div>

                {/* Address & ETA */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50 space-y-3 mb-6">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-tight">
                    <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5" /> 
                    {o.address}
                  </p>
                  {o.distance !== undefined && o.distance !== null && (
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <span className="text-base">📏</span> 
                      Distance: <span className="font-bold text-slate-900 dark:text-white">{o.distance} km</span>
                      {o.latitude && o.longitude && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          ({o.latitude.toFixed(4)}, {o.longitude.toFixed(4)})
                        </span>
                      )}
                    </p>
                  )}
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Clock size={16} className="text-emerald-500 shrink-0" /> 
                    Remaining: <span className="font-bold text-slate-900 dark:text-white">{remaining(o)}</span>
                  </p>
                </div>

                {/* ETA Input */}
                {o.status !== "Delivered" && (
                  <div className="flex gap-2 mb-6">
                    <input type="number" placeholder="ETA (min)"
                      value={etaInput[o._id] || ""}
                      onChange={(e) => setEtaInput({ ...etaInput, [o._id]: e.target.value })}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all focus:bg-white dark:focus:bg-slate-950" />
                    <Button onClick={() => setETA(o._id, o.status)} className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20">
                      Set
                    </Button>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2 mb-6 flex-1">
                  {o.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400 py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                      <span>{i.name} <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">×{i.qty}</span></span>
                      <span className="font-bold text-slate-900 dark:text-white font-black">₹{i.price * i.qty}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Amount</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    ₹{o.total}
                  </span>
                </div>

              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
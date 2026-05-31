import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, ChefHat, Truck, ShoppingBag } from "lucide-react";
import { getToken } from "../../utils/getToken";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

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
      if(res.ok) setOrders(await res.json());
    } catch(e) {
      console.error(e);
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

  const getStatusIcon = (status) => {
    if (status === "Delivered") return <CheckCircle size={16} />;
    if (status === "Out for Delivery") return <Truck size={16} />;
    if (status === "Preparing") return <ChefHat size={16} />;
    return <Clock size={16} />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full pb-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
            <Package size={28} />
          </div>
          My Orders
        </h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">Track your delicious food journey.</p>
      </motion.div>

      {orders.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="text-center py-20 border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <ShoppingBag size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No orders yet</h3>
            <p className="text-slate-500 font-medium">Time to order some tasty food!</p>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {orders.map((o, idx) => (
            <motion.div 
              key={o._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-6 md:p-8 border-slate-100">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Order <span className="text-brand-500">#{o._id.slice(-6).toUpperCase()}</span>
                    </h3>
                    <p className="text-slate-500 text-sm mt-1 font-medium">{new Date(o.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge variant={o.status === "Delivered" ? "success" : "brand"} className="px-4 py-2 text-sm gap-2 uppercase tracking-wide">
                    {getStatusIcon(o.status)}
                    {o.status}
                  </Badge>
                </div>

                {/* TRACKER */}
                <div className="mb-10 relative">
                  <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-100 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgress(o.status)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-brand-400 to-brand-600" 
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
                    <span className={getProgress(o.status) >= 25 ? "text-brand-600" : ""}>Placed</span>
                    <span className={getProgress(o.status) >= 50 ? "text-brand-600" : ""}>Preparing</span>
                    <span className={getProgress(o.status) >= 75 ? "text-brand-600" : ""}>On the way</span>
                    <span className={getProgress(o.status) >= 100 ? "text-emerald-600" : ""}>Delivered</span>
                  </div>
                </div>

                <div className="bg-slate-50/50 rounded-2xl p-2 mb-6 border border-slate-100">
                  {o.items.map((i, iIdx) => (
                    <div key={iIdx} className="flex items-center gap-4 p-3 border-b border-slate-100 last:border-0 hover:bg-white rounded-xl transition-colors">
                      <img 
                        src={i.image?.startsWith('http') ? i.image : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/${i.image}`}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-100" 
                        onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                        alt={i.name}
                      />
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{i.name}</p>
                        <p className="text-slate-500 text-sm font-medium mt-1">Qty: {i.qty}</p>
                      </div>
                      <p className="font-bold text-slate-900 text-lg">₹{i.price * i.qty}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-6">
                  <div>
                    <p className="text-slate-500 font-medium text-sm">Payment Method</p>
                    <p className="text-slate-900 font-bold">{o.paymentMethod || "COD"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 font-medium text-sm mb-1">Total Amount</p>
                    <h3 className="text-3xl font-black text-brand-600">₹{o.total}</h3>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
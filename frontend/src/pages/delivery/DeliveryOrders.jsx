import { useEffect, useState } from "react";
import { CheckCircle, Clock, MapPin, Package, Phone, RefreshCw, XCircle } from "lucide-react";
import API from "../../api/axios";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

export default function DeliveryOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/orders/delivery/assigned");
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to load assigned orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (orderId, action, body = {}) => {
    setActionLoading(`${orderId}-${action}`);
    try {
      await API.put(`/api/orders/delivery/${orderId}/${action}`, body);
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading("");
    }
  };

  const openMaps = (address) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "")}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Assigned Orders</h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Accept, reject, navigate, and complete deliveries.</p>
        </div>
        <button type="button" onClick={loadOrders} className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
          <RefreshCw size={18} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((item) => <div key={item} className="h-72 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-10 text-center">
          <Package className="mx-auto text-slate-400" size={36} />
          <h3 className="mt-4 text-xl font-black">No assigned orders</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">New assignments will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map((order) => (
            <div key={order._id} className="rounded-3xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black">#{String(order._id).slice(-6).toUpperCase()}</h3>
                <Badge variant={order.status === "Delivered" ? "success" : order.status === "RejectedByDeliveryBoy" ? "danger" : "warning"}>
                  {order.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <InfoLine label="Customer" value={order.customerName || "GreenGO Customer"} />
                <InfoLine label="Amount" value={`₹${order.total || 0}`} />
                <InfoLine label="Payment" value={order.paymentMethod || "COD"} />
                <InfoLine label="Order Time" value={new Date(order.createdAt).toLocaleString()} />
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
                <p className="text-sm font-bold flex items-center gap-2">
                  <Phone size={15} className="text-brand-500" />
                  {order.phone || "No phone"}
                </p>
                <p className="text-sm font-bold flex items-start gap-2 leading-relaxed">
                  <MapPin size={16} className="text-brand-500 mt-0.5 shrink-0" />
                  {order.address || "No address"}
                </p>
              </div>

              <div className="space-y-2">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex justify-between gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>{item.name} x {item.qty}</span>
                    <span>₹{Number(item.price || 0) * Number(item.qty || 0)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {order.assignmentStatus === "Assigned" && (
                  <>
                    <Button disabled={actionLoading === `${order._id}-accept`} onClick={() => runAction(order._id, "accept")} className="rounded-xl gap-2">
                      <CheckCircle size={16} /> Accept Order
                    </Button>
                    <button type="button" onClick={() => runAction(order._id, "reject", { reason: prompt("Reject reason (optional)") || "" })} className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-black text-sm flex items-center gap-2">
                      <XCircle size={16} /> Reject
                    </button>
                  </>
                )}
                {order.status === "AcceptedByDeliveryBoy" && (
                  <>
                    <button type="button" onClick={() => openMaps(order.address)} className="px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-300 font-black text-sm flex items-center gap-2">
                      <MapPin size={16} /> Open In Google Maps
                    </button>
                    <Button disabled={actionLoading === `${order._id}-delivered`} onClick={() => runAction(order._id, "delivered")} className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700">
                      <Clock size={16} /> Mark As Delivered
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-900 dark:text-white break-words">{value}</p>
    </div>
  );
}

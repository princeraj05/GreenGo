import { useEffect, useRef, useState } from "react";
import { CheckCircle, Clock, MapPin, Navigation, Package, Phone, RefreshCw, User, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

export default function DeliveryOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileRequired, setProfileRequired] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [sharingOrders, setSharingOrders] = useState({});
  const shareTimers = useRef({});

  useEffect(() => {
    loadOrders();
    return () => {
      Object.values(shareTimers.current).forEach((timer) => clearInterval(timer));
      shareTimers.current = {};
    };
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/orders/delivery/assigned");
      setOrders(res.data || []);
      setProfileRequired(false);
    } catch (err) {
      console.error("Failed to load assigned orders:", err);
      if (err.response?.data?.code === "DELIVERY_PROFILE_INCOMPLETE") {
        setProfileRequired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (orderId, action, body = {}) => {
    setActionLoading(`${orderId}-${action}`);
    try {
      const res = await API.put(`/api/orders/delivery/${orderId}/${action}`, body);
      await loadOrders();
      return res.data?.order;
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
      return null;
    } finally {
      setActionLoading("");
    }
  };

  const updateLocalRiderLocation = (orderId, coords) => {
    setOrders((current) => current.map((order) => (
      order._id === orderId
        ? {
            ...order,
            tracking: {
              ...(order.tracking || {}),
              riderLocation: {
                lat: coords.lat,
                lng: coords.lng,
                updatedAt: new Date().toISOString()
              }
            }
          }
        : order
    )));
  };

  const sendLocation = (orderId) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      stopSharing(orderId);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        try {
          await API.post(`/api/orders/${orderId}/location`, coords);
          updateLocalRiderLocation(orderId, coords);
        } catch (err) {
          console.error("Failed to share location:", err);
        }
      },
      () => alert("Unable to access your GPS location. Please allow location permission."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  const startSharing = (orderId) => {
    if (shareTimers.current[orderId]) return;
    setSharingOrders((current) => ({ ...current, [orderId]: true }));
    sendLocation(orderId);
    shareTimers.current[orderId] = setInterval(() => sendLocation(orderId), 10000);
  };

  const stopSharing = (orderId) => {
    if (shareTimers.current[orderId]) {
      clearInterval(shareTimers.current[orderId]);
      delete shareTimers.current[orderId];
    }
    setSharingOrders((current) => ({ ...current, [orderId]: false }));
  };

  const acceptAndShare = async (order) => {
    const updated = await runAction(order._id, "accept");
    if (updated) startSharing(order._id);
  };

  const markDelivered = async (orderId) => {
    stopSharing(orderId);
    await runAction(orderId, "delivered");
  };

  const openMaps = (order) => {
    if (order.latitude != null && order.longitude != null) {
      window.open(`https://www.openstreetmap.org/?mlat=${order.latitude}&mlon=${order.longitude}#map=16/${order.latitude}/${order.longitude}`, "_blank", "noopener,noreferrer");
      return;
    }
    window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(order.address || "")}`, "_blank", "noopener,noreferrer");
  };

  const distanceToCustomer = (order) => {
    const rider = order.tracking?.riderLocation;
    if (!rider || order.latitude == null || order.longitude == null) return null;
    const R = 6371;
    const dLat = (Number(order.latitude) - Number(rider.lat)) * Math.PI / 180;
    const dLng = (Number(order.longitude) - Number(rider.lng)) * Math.PI / 180;
    const lat1 = Number(rider.lat) * Math.PI / 180;
    const lat2 = Number(order.latitude) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
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

      {profileRequired ? (
        <div className="rounded-3xl bg-white dark:bg-slate-950 border border-amber-100 dark:border-amber-900/40 p-10 text-center">
          <User className="mx-auto text-amber-500" size={36} />
          <h3 className="mt-4 text-xl font-black">Complete delivery profile first</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Assigned orders dekhne ke liye name, phone aur address save karo.</p>
          <Button onClick={() => navigate("/delivery/profile")} className="mt-5 rounded-2xl">Complete Profile</Button>
        </div>
      ) : loading ? (
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
                <InfoLine label="Customer" value={order.customerName || "GreenGo Customer"} />
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
                <p className="text-sm font-bold flex items-center gap-2">
                  <Navigation size={15} className="text-brand-500" />
                  Distance to customer: {distanceToCustomer(order) == null ? "Start sharing to calculate" : `${distanceToCustomer(order).toFixed(2)} km`}
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
                    <Button disabled={actionLoading === `${order._id}-accept`} onClick={() => acceptAndShare(order)} className="min-h-11 rounded-xl gap-2">
                      <CheckCircle size={16} /> Accept & Start Delivery
                    </Button>
                    <button type="button" onClick={() => runAction(order._id, "reject", { reason: prompt("Reject reason (optional)") || "" })} className="min-h-11 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-black text-sm flex items-center gap-2">
                      <XCircle size={16} /> Reject
                    </button>
                  </>
                )}
                {order.status === "AcceptedByDeliveryBoy" && (
                  <>
                    {!sharingOrders[order._id] ? (
                      <Button onClick={() => startSharing(order._id)} className="min-h-11 rounded-xl gap-2">
                        <Navigation size={16} /> Start Delivery
                      </Button>
                    ) : (
                      <button type="button" onClick={() => stopSharing(order._id)} className="min-h-11 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-black text-sm flex items-center gap-2">
                        <Navigation size={16} /> Stop Sharing
                      </button>
                    )}
                    <button type="button" onClick={() => openMaps(order)} className="min-h-11 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-300 font-black text-sm flex items-center gap-2">
                      <MapPin size={16} /> Open Map
                    </button>
                    <Button disabled={actionLoading === `${order._id}-delivered`} onClick={() => markDelivered(order._id)} className="min-h-11 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700">
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


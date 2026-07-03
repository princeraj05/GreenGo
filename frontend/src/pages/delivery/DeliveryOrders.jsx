import { memo, useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, Clock, MapPin, Navigation, Package, Phone, RefreshCw, User, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

export default function DeliveryOrders() {
  // --- REACT STATE, REFS & ROUTER HOOKS ---
  
  // React Router navigate hook for switching paths
  const navigate = useNavigate();
  
  // State storing the list of all orders currently assigned to the rider
  const [orders, setOrders] = useState([]);
  
  // Main loader flag indicating whether background order lists are fetching
  const [loading, setLoading] = useState(true);
  
  // Validation status indicator enforcing user profile setup
  const [profileRequired, setProfileRequired] = useState(false);
  
  // Flag indicating which action is running (contains formatted string `${orderId}-${action}`) to disable buttons during requests
  const [actionLoading, setActionLoading] = useState("");
  
  // Object mapping order IDs to boolean flags checking if location sharing is active
  const [sharingOrders, setSharingOrders] = useState({});
  
  // Mutable reference holding active intervals for geolocation sharing timers
  const shareTimers = useRef({});

  // --- DATA FETCHING & SIDE EFFECTS ---

  // Fetches assigned delivery orders list from the backend
  const loadOrders = useCallback(async () => {
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
  }, []);

  // Initializes assigned orders list and triggers cleanup of active intervals on unmount
  useEffect(() => {
    loadOrders();
    return () => {
      // Cleanup all active timers to prevent memory leaks when navigating away
      Object.values(shareTimers.current).forEach((timer) => clearInterval(timer));
      shareTimers.current = {};
    };
  }, [loadOrders]);

  // --- ORDER WORKFLOW HANDLERS (PUT REQUESTS) ---

  // Executes order transitions (e.g. "accept", "reject", "delivered")
  const runAction = useCallback(async (orderId, action, body = {}) => {
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
  }, [loadOrders]);

  // --- LIVE GEOLOCATION SHARING CONTROLLERS ---

  // Optimistically updates rider coordinate values directly inside the React state
  const updateLocalRiderLocation = useCallback((orderId, coords) => {
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
  }, []);

  // Stops location sharing for a specific order and clears its interval timer
  const stopSharing = useCallback((orderId) => {
    if (shareTimers.current[orderId]) {
      clearInterval(shareTimers.current[orderId]);
      delete shareTimers.current[orderId];
    }
    setSharingOrders((current) => ({ ...current, [orderId]: false }));
  }, []);

  // Grabs browser geolocation and posts coordinates to the tracking API
  const sendLocation = useCallback((orderId) => {
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
          // Locally store rider coordinate metrics to recalculate distance dynamically
          updateLocalRiderLocation(orderId, coords);
        } catch (err) {
          console.error("Failed to share location:", err);
        }
      },
      () => alert("Unable to access your GPS location. Please allow location permission."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, [stopSharing, updateLocalRiderLocation]);

  // Launches recurring intervals (every 10 seconds) to stream GPS coordinates to the server
  const startSharing = useCallback((orderId) => {
    if (shareTimers.current[orderId]) return;
    setSharingOrders((current) => ({ ...current, [orderId]: true }));
    sendLocation(orderId);
    shareTimers.current[orderId] = setInterval(() => sendLocation(orderId), 10000);
  }, [sendLocation]);

  // Accepts order and initiates active location streaming
  const acceptAndShare = async (order) => {
    const updated = await runAction(order._id, "accept");
    if (updated) startSharing(order._id);
  };

  // Stops active tracking broadcasts and triggers delivery resolution state
  const markDelivered = async (orderId) => {
    stopSharing(orderId);
    await runAction(orderId, "delivered");
  };

  // --- MAPS & HAVERSINE DISTANCE MATH UTILITIES ---

  // Opens coordinates on external OpenStreetMap provider or searches for text queries
  const openMaps = (order) => {
    if (order.latitude != null && order.longitude != null) {
      window.open(`https://www.openstreetmap.org/?mlat=${order.latitude}&mlon=${order.longitude}#map=16/${order.latitude}/${order.longitude}`, "_blank", "noopener,noreferrer");
      return;
    }
    window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(order.address || "")}`, "_blank", "noopener,noreferrer");
  };

  // Calculates the physical distance between user location coordinates and the customer's coordinates (in km)
  const distanceToCustomer = useCallback((order) => {
    const rider = order.tracking?.riderLocation;
    if (!rider || order.latitude == null || order.longitude == null) return null;
    const R = 6371; // Earth's radius in km
    const dLat = (Number(order.latitude) - Number(rider.lat)) * Math.PI / 180;
    const dLng = (Number(order.longitude) - Number(rider.lng)) * Math.PI / 180;
    const lat1 = Number(rider.lat) * Math.PI / 180;
    const lat2 = Number(order.latitude) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }, []);

  return (
    // Responsive root layer container
    <div className="space-y-5 sm:space-y-6">
      
      {/* --- HEADER & REFRESH ACTION --- */}
      {/* Title bar content side-by-side with manual refresh button */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">Assigned Orders</h2>
          <p className="text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400 mt-1">Accept, reject, navigate, and complete deliveries.</p>
        </div>
        <button type="button" onClick={loadOrders} className="shrink-0 w-11 h-11 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-sm">
          <RefreshCw size={18} />
        </button>
      </div>

      {profileRequired ? (
        /* --- PROFILE COMPLETION ALERT SECTION --- */
        /* Prompts when basic profile attributes are not configured */
        <div className="rounded-2xl bg-white dark:bg-slate-950 border border-amber-100 dark:border-amber-900/40 p-6 sm:p-10 text-center shadow-sm">
          <User className="mx-auto text-amber-500" size={36} />
          <h3 className="mt-4 text-xl font-black">Complete delivery profile first</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Assigned orders dekhne ke liye name, phone aur address save karo.</p>
          <Button onClick={() => navigate("/delivery/profile")} className="mt-5 rounded-2xl">Complete Profile</Button>
        </div>
      ) : loading ? (
        /* --- LOADING SKELETON CARDS SECTION --- */
        /* Flex grid loading fallback using CSS pulse effects */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[1, 2].map((item) => <div key={item} className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        /* --- NO ASSIGNED ORDERS EMPTY STATE --- */
        /* Placeholder container displayed when zero orders are currently assigned */
        <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 sm:p-10 text-center shadow-sm">
          <Package className="mx-auto text-slate-400" size={36} />
          <h3 className="mt-4 text-xl font-black">No assigned orders</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">New assignments will appear here.</p>
        </div>
      ) : (
        /* --- ASSIGNED ORDERS GRID LIST --- */
        /* 2-column grid layout on extra large screens, falling back to 1-column layout on smaller screen widths */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {orders.map((order) => {
            const distance = distanceToCustomer(order);
            return (
            <div key={order._id} className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
              
              {/* Order identifier header featuring order status Badge */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-black break-all">#{String(order._id).slice(-6).toUpperCase()}</h3>
                <Badge variant={order.status === "Delivered" ? "success" : order.status === "RejectedByDeliveryBoy" ? "danger" : "warning"}>
                  {order.status}
                </Badge>
              </div>

              {/* Grid block displaying metadata indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <InfoLine label="Customer" value={order.customerName || "GreenGo Customer"} />
                <InfoLine label="Amount" value={`Rs. ${order.total || 0}`} />
                <InfoLine label="Payment" value={order.paymentMethod || "COD"} />
                <InfoLine label="Order Time" value={new Date(order.createdAt).toLocaleString()} />
              </div>

              {/* Highlights target destination profile details (Phone, Address, Distance metrics) */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 space-y-2">
                <p className="text-sm font-bold flex items-center gap-2">
                  <Phone size={15} className="text-brand-500" />
                  {order.phone || (order.userId && order.userId.phone) || "No phone"}
                </p>
                {order.userId && order.userId.email && (
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 pl-6">
                    <span>📧</span>
                    {order.userId.email}
                  </p>
                )}
                {order.userId && order.userId.birthDate && (
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 pl-6">
                    <span>🎂</span>
                    Birthday: {new Date(order.userId.birthDate).toLocaleDateString()}
                  </p>
                )}
                <p className="text-sm font-bold flex items-start gap-2 leading-relaxed">
                  <MapPin size={16} className="text-brand-500 mt-0.5 shrink-0" />
                  {order.address || "No address"}
                </p>
                <p className="text-sm font-bold flex items-center gap-2">
                  <Navigation size={15} className="text-brand-500" />
                  Distance to customer: {distance == null ? "Start sharing to calculate" : `${distance.toFixed(2)} km`}
                </p>
              </div>

              {/* Items listing details displaying names, quantity counts and price calculations */}
              <div className="space-y-2">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex justify-between gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>{item.name} x {item.qty}</span>
                    <span>Rs. {Number(item.price || 0) * Number(item.qty || 0)}</span>
                  </div>
                ))}
              </div>

              {/* --- CARD ACTIONS GRID / FLEX WRAPPER --- */}
              {/* Context-aware buttons rendering state-specific transition actions */}
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 pt-2">
                {order.assignmentStatus === "Assigned" && (
                  <>
                    <Button disabled={actionLoading === `${order._id}-accept`} onClick={() => acceptAndShare(order)} className="min-h-11 w-full sm:w-auto rounded-xl gap-2">
                      <CheckCircle size={16} /> Accept & Start Delivery
                    </Button>
                    <button type="button" onClick={() => runAction(order._id, "reject", { reason: prompt("Reject reason (optional)") || "" })} className="min-h-11 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-black text-sm flex items-center justify-center gap-2">
                      <XCircle size={16} /> Reject
                    </button>
                  </>
                )}
                {order.status === "AcceptedByDeliveryBoy" && (
                  <>
                    {!sharingOrders[order._id] ? (
                      <Button onClick={() => startSharing(order._id)} className="min-h-11 w-full sm:w-auto rounded-xl gap-2">
                        <Navigation size={16} /> Start Delivery
                      </Button>
                    ) : (
                      <button type="button" onClick={() => stopSharing(order._id)} className="min-h-11 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-black text-sm flex items-center justify-center gap-2">
                        <Navigation size={16} /> Stop Sharing
                      </button>
                    )}
                    <button type="button" onClick={() => openMaps(order)} className="min-h-11 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-300 font-black text-sm flex items-center justify-center gap-2">
                      <MapPin size={16} /> Open Map
                    </button>
                    <Button disabled={actionLoading === `${order._id}-delivered`} onClick={() => markDelivered(order._id)} className="min-h-11 w-full sm:w-auto rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700">
                      <Clock size={16} /> Mark As Delivered
                    </Button>
                  </>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Memoized helper component showing metadata categories paired with corresponding values
const InfoLine = memo(function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-900 dark:text-white break-words">{value}</p>
    </div>
  );
});

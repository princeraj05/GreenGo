import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle, Clock, MapPin, Navigation, Package, RefreshCw, Truck, Store, UserCheck, Bike, Phone, HelpCircle } from "lucide-react";
import API from "../../api/axios";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import TrackingMap from "../../components/tracking/TrackingMap";
import { playOrderConfirmationVoice } from "../../utils/ttsService";

const steps = [
  { key: "placed", label: "Order Placed", icon: Package },
  { key: "restaurant_accepted", label: "Restaurant Accepted", icon: Store },
  { key: "preparing", label: "Preparing", icon: Clock },
  { key: "delivery_accepted", label: "Delivery Partner Accepted", icon: UserCheck },
  { key: "on_the_way", label: "On The Way", icon: Bike },
  { key: "delivered", label: "Delivered", icon: CheckCircle }
];

const statusConfig = {
  Pending: {
    title: "Order Placed",
    description: "Your order has been placed successfully!",
    banner: "We have sent your order to the restaurant for acceptance.",
    icon: Package,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
  },
  RestaurantAccepted: {
    title: "Restaurant Accepted",
    description: "The restaurant has accepted your order.",
    banner: "Restaurant accepted your order. Preparing your food soon.",
    icon: Store,
    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20"
  },
  Preparing: {
    title: "Preparing Food",
    description: "Aapka khana taiyar kiya ja raha hai. Thoda sa intezaar karein 😊",
    banner: "Restaurant aapke order ko prepare kar raha hai.",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20"
  },
  AcceptedByDeliveryBoy: {
    title: "Delivery Partner Accepted",
    description: "Delivery Partner ne aapka order accept kar liya hai.",
    banner: "Delivery Partner aapke order ko pickup karne ke liye restaurant pahunch raha hai.",
    icon: UserCheck,
    color: "text-indigo-600 dark:text-indigo-450 bg-indigo-50 dark:bg-indigo-950/20"
  },
  "Out for Delivery": {
    title: "On The Way",
    description: "Aapka order pickup ho chuka hai aur ab aapki taraf aa raha hai.",
    banner: "Delivery Partner aapke order ko lekar aapki location ki taraf nikal chuka hai.",
    icon: Bike,
    color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20"
  },
  Delivered: {
    title: "Delivered Successfully",
    description: "Aapka order successfully deliver ho gaya hai. Enjoy your meal! 🎉",
    banner: "Order delivered successfully. Thank you for choosing GreenGo! 🙌",
    icon: CheckCircle,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
  },
  Cancelled: {
    title: "Order Cancelled",
    description: "Your order has been cancelled.",
    banner: "This order was cancelled and cannot be tracked further.",
    icon: CheckCircle,
    color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20"
  },
  CancellationRequested: {
    title: "Cancellation Requested",
    description: "Your cancellation request is pending admin review.",
    banner: "Cancellation has been requested. We will update you shortly.",
    icon: Clock,
    color: "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40"
  }
};

const getStepIndex = (status) => {
  const stepMap = {
    Pending: 0,
    RestaurantAccepted: 1,
    Preparing: 2,
    AcceptedByDeliveryBoy: 3,
    "Out for Delivery": 4,
    Delivered: 5
  };
  return stepMap[status] ?? 0;
};

const getEstimatedDeliveryTime = (status, etaMinutes) => {
  if (status === "Delivered") return "Delivered";
  if (status === "Cancelled") return "Cancelled";
  if (etaMinutes) return `${etaMinutes} Mins`;
  
  switch (status) {
    case "Pending":
    case "RestaurantAccepted":
    case "Preparing":
      return "30-40 Mins";
    case "AcceptedByDeliveryBoy":
      return "20-30 Mins";
    case "Out for Delivery":
      return "10-15 Mins";
    default:
      return "30-40 Mins";
  }
};

function distanceKm(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 6371;
  const dLat = (Number(b.lat) - Number(a.lat)) * Math.PI / 180;
  const dLng = (Number(b.lng) - Number(a.lng)) * Math.PI / 180;
  const lat1 = Number(a.lat) * Math.PI / 180;
  const lat2 = Number(b.lat) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function activeSteps(status, riderLocation) {
  const normalized = String(status || "").toLowerCase();
  return {
    placed: true,
    restaurant_accepted: ["restaurantaccepted", "preparing", "acceptedbydeliveryboy", "out for delivery", "delivered"].includes(normalized),
    preparing: ["preparing", "acceptedbydeliveryboy", "out for delivery", "delivered"].includes(normalized),
    delivery_accepted: ["acceptedbydeliveryboy", "out for delivery", "delivered"].includes(normalized),
    on_the_way: ["out for delivery", "delivered"].includes(normalized),
    delivered: normalized === "delivered"
  };
}

const getStatusLabel = (status) => {
  const labels = {
    Pending: "Order Placed",
    RestaurantAccepted: "Restaurant Accepted",
    Preparing: "Preparing",
    AcceptedByDeliveryBoy: "Delivery Partner Accepted",
    "Out for Delivery": "On The Way",
    Delivered: "Delivered",
    Cancelled: "Cancelled",
    CancellationRequested: "Cancellation Requested"
  };
  return labels[status] || status;
};

export default function OrderTrackingPage({ role = "user" }) {
  const { id } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const backPath = role === "admin" ? "/admin/orders" : "/user/orders";

  const loadTracking = useCallback(async () => {
    try {
      setError("");
      const res = await API.get(`/api/orders/${id}/tracking`);
      setTracking(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load tracking details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTracking();
    const timer = setInterval(loadTracking, 10000);
    return () => clearInterval(timer);
  }, [loadTracking]);

  useEffect(() => {
    if (tracking && tracking.status) {
      if (tracking.status === "Preparing" || tracking.status === "Pending" || tracking.status === "RestaurantAccepted") {
        playOrderConfirmationVoice(id, tracking.status, tracking.updatedAt || tracking.createdAt);
      }
    }
  }, [tracking, id]);

  const active = useMemo(
    () => activeSteps(tracking?.status, tracking?.riderLocation),
    [tracking?.status, tracking?.riderLocation]
  );

  const remaining = useMemo(
    () => distanceKm(tracking?.riderLocation, tracking?.customerLocation),
    [tracking?.riderLocation, tracking?.customerLocation]
  );

  const config = useMemo(
    () => statusConfig[tracking?.status] || {
      title: tracking?.status || "Order Placed",
      description: "Order is in progress...",
      banner: "Status updated.",
      icon: Clock,
      color: "text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/30"
    },
    [tracking?.status]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full pb-16 px-4 md:px-0 space-y-6 animate-fade-in text-slate-900 dark:text-white">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="text-brand-500 font-extrabold">&larr;</span> 
            <span className="text-brand-600 dark:text-brand-400 font-black">GreenGO</span> Order Tracker
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Order ID: #{String(id).slice(-6).toUpperCase()}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={loadTracking} className="rounded-xl px-3 gap-1 text-xs">
            <RefreshCw size={12} className="animate-spin-slow" /> Refresh
          </Button>
          <Link to={backPath}>
            <Button variant="ghost" size="sm" className="rounded-xl text-xs">Back</Button>
          </Link>
        </div>
      </div>

      {error ? (
        <Card className="p-6 border-red-100 dark:border-red-900/40 text-center">
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
        </Card>
      ) : (
        <>
          {/* --- MAIN HERO STATUS DISPLAY --- */}
          <Card className="p-6 md:p-8 flex flex-col items-center text-center space-y-4 rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center animate-bounce-slow shadow-sm ${config.color}`}>
              {createElement(config.icon, { size: 36, className: "shrink-0" })}
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {config.title}
              </h2>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-md">
                {config.description}
              </p>
            </div>

            {/* GREEN BANNER */}
            <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-755 dark:text-emerald-300 p-4 rounded-2xl text-xs sm:text-sm font-black flex justify-between items-center gap-3">
              <span>{config.banner}</span>
              <span className="text-[10px] opacity-75 whitespace-nowrap">
                {tracking?.updatedAt ? new Date(tracking.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
              </span>
            </div>
          </Card>

          {/* --- ORDER INFO CARDS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Order Details */}
            <Card className="p-5 sm:p-6 rounded-3xl border-slate-100 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Order Details</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm font-bold border-b border-slate-50 dark:border-slate-900 pb-2">
                  <span className="text-slate-400">Order Items</span>
                  <div className="text-right text-slate-800 dark:text-white">
                    {tracking?.items?.map((item, idx) => (
                      <div key={idx}>{item.name} x {item.qty}</div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-sm font-bold border-b border-slate-50 dark:border-slate-900 pb-2">
                  <span className="text-slate-400">Total Amount</span>
                  <span className="text-brand-600 dark:text-brand-450 font-extrabold">₹{tracking?.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-400">Payment Method</span>
                  <span className="text-slate-800 dark:text-white uppercase tracking-wider">{tracking?.paymentMethod || "COD"}</span>
                </div>
              </div>
            </Card>

            {/* Delivery Estimation & Support */}
            <Card className="p-5 sm:p-6 rounded-3xl border-slate-100 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Estimated Delivery</h3>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-500/10 text-brand-600 rounded-2xl">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {getEstimatedDeliveryTime(tracking?.status, tracking?.etaMinutes)}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Approximate Time</p>
                  </div>
                </div>
              </div>

              {/* Call Rider or Support */}
              {tracking?.assignedDeliveryBoy ? (
                <a href={`tel:${tracking.assignedDeliveryBoy.phone}`} className="block w-full">
                  <button className="w-full min-h-11 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                    <Phone size={15} /> Call Rider ({tracking.assignedDeliveryBoy.name})
                  </button>
                </a>
              ) : (
                <button 
                  onClick={() => alert("GreenGO Support lines are open! Call 1800-XXX-XXXX for fast queries.")} 
                  className="w-full min-h-11 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <HelpCircle size={15} /> Call Support
                </button>
              )}
            </Card>

          </div>

          {/* --- TIMELINE FLOW STEPS (6 CIRCLES) --- */}
          <Card className="p-6 sm:p-8 rounded-3xl border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 text-center">Tracking Steps</h3>
            
            <div className="relative mt-6 mb-2 px-5">
              {/* Stepper progress connector lines */}
              <div className="absolute top-5 left-5 right-5 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 rounded-full">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(getStepIndex(tracking?.status) / 5) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-brand-500 rounded-full"
                />
              </div>

              <div className="relative flex justify-between w-full">
                {steps.map((step, idx) => {
                  const stepIdx = getStepIndex(tracking?.status);
                  const isCompleted = idx <= stepIdx;
                  const isCurrent = idx === stepIdx;
                  return (
                    <div key={step.key} className="flex flex-col items-center text-center space-y-2 relative z-10">
                      {/* Circle Indicator */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${
                        isCompleted 
                          ? "bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-500/20" 
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                      } ${isCurrent ? 'ring-4 ring-brand-500/20 scale-110' : ''}`}>
                        {isCompleted ? (
                          <span className="text-sm font-bold">✓</span>
                        ) : (
                          <span className="text-sm font-bold">{idx + 1}</span>
                        )}
                      </div>
                      {/* Step label */}
                      <div className="space-y-0.5">
                        <p className={`text-[9px] md:text-xs font-black uppercase tracking-wider leading-tight max-w-[70px] sm:max-w-[90px] mx-auto transition-colors ${
                          isCompleted ? "text-brand-700 dark:text-brand-400" : "text-slate-400"
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* --- TRACKING MAP --- */}
          <TrackingMap customerLocation={tracking?.customerLocation} riderLocation={tracking?.riderLocation} />

          {/* --- ADDRESS DETAILS --- */}
          <Card className="p-5 sm:p-6 rounded-3xl border-slate-100 flex items-start gap-3">
            <MapPin size={18} className="text-brand-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Delivery Address</h4>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                {tracking?.customerLocation?.address || "No delivery address available"}
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

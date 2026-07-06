import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle, Clock, MapPin, Navigation, Package, RefreshCw, Truck } from "lucide-react";
import API from "../../api/axios";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import TrackingMap from "../../components/tracking/TrackingMap";
import { playOrderConfirmationVoice } from "../../utils/ttsService";

const steps = [
  { key: "placed", label: "Order Placed", icon: Package },
  { key: "preparing", label: "Preparing", icon: Clock },
  { key: "assigned", label: "Assigned", icon: CheckCircle },
  { key: "out", label: "Out For Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle }
];

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
    preparing: ["preparing", "out for delivery", "acceptedbydeliveryboy", "delivered"].includes(normalized),
    assigned: Boolean(riderLocation) || ["acceptedbydeliveryboy", "out for delivery", "delivered"].includes(normalized),
    out: Boolean(riderLocation) || ["acceptedbydeliveryboy", "out for delivery", "delivered"].includes(normalized),
    delivered: normalized === "delivered"
  };
}

export default function OrderTrackingPage({ role = "user" }) {
  const { id } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const backPath = role === "admin" ? "/admin/orders" : "/user/orders";
  const title = role === "admin" ? "Delivery Tracking" : "Track Delivery";

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

  // AUTOMATIC VOICE CONFIRMATION TRIGGER:
  // When tracking data is loaded or polled, check if the order status is 
  // confirmed ('Pending' or 'Preparing') and trigger the voice message.
  // Capacitor preferences ensure it plays only once per order ID.
  useEffect(() => {
    if (tracking && tracking.status) {
      if (tracking.status === "Preparing" || tracking.status === "Pending") {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full pb-10 space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-50 dark:bg-brand-950/30 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
              <Navigation size={22} />
            </div>
            {title}
          </h1>
          {role !== "user" ? (
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base font-medium">
              Order #{String(id).slice(-6).toUpperCase()}
            </p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base font-medium">
              Real-time Status Tracking
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadTracking} className="rounded-xl gap-2">
            <RefreshCw size={16} /> Refresh
          </Button>
          <Link to={backPath}>
            <Button variant="ghost" className="rounded-xl">Back</Button>
          </Link>
        </div>
      </div>

      {error ? (
        <Card className="p-6 border-red-100 dark:border-red-900/40">
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
        </Card>
      ) : (
        <>
          <Card className="p-4 sm:p-5 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Info label="Status" value={tracking?.status || "Pending"} />
              <Info label="Distance Remaining" value={remaining == null ? "Waiting for rider" : `${remaining.toFixed(2)} km`} />
              <Info label="Last Update" value={tracking?.updatedAt ? new Date(tracking.updatedAt).toLocaleString() : "Not available"} />
              <Info label="Customer Location" value={tracking?.customerLocation?.lat == null ? "Missing" : "Available"} />
            </div>
          </Card>

          <Card className="p-4 sm:p-5 md:p-6">
            <div className="grid grid-cols-5 gap-2">
              {steps.map((step) => (
                <div key={step.key} className="flex flex-col items-center gap-2 text-center">
                  <div className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center border-2 ${active[step.key] ? "bg-brand-600 border-brand-600 text-white" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"}`}>
                    {createElement(step.icon, { size: 17 })}
                  </div>
                  <span className={`text-[10px] md:text-xs font-black uppercase tracking-wide ${active[step.key] ? "text-brand-700 dark:text-brand-300" : "text-slate-400"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <TrackingMap customerLocation={tracking?.customerLocation} riderLocation={tracking?.riderLocation} />

          <Card className="p-4 sm:p-5 md:p-6">
            <p className="text-sm font-bold text-slate-900 dark:text-white flex items-start gap-2">
              <MapPin size={17} className="text-brand-500 shrink-0 mt-0.5" />
              <span>{tracking?.customerLocation?.address || "No delivery address available"}</span>
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-900 dark:text-white break-words">{value}</p>
    </div>
  );
}

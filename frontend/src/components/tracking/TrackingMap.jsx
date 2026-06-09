import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = (className, label) => L.divIcon({
  className: "",
  html: `<div class="${className}">${label}</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const customerIcon = markerIcon(
  "w-8 h-8 rounded-full bg-brand-600 text-white border-4 border-white shadow-lg flex items-center justify-center text-xs font-black",
  "C"
);

const riderIcon = markerIcon(
  "w-8 h-8 rounded-full bg-blue-600 text-white border-4 border-white shadow-lg flex items-center justify-center text-xs font-black",
  "D"
);

function FitMap({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!positions.length) return;
    if (positions.length === 1) {
      map.setView(positions[0], 15);
      return;
    }
    map.fitBounds(positions, { padding: [40, 40], maxZoom: 16 });
  }, [map, positions]);

  return null;
}

export default function TrackingMap({ customerLocation, riderLocation }) {
  const customerPosition = useMemo(() => {
    if (customerLocation?.lat == null || customerLocation?.lng == null) return null;
    return [Number(customerLocation.lat), Number(customerLocation.lng)];
  }, [customerLocation]);

  const riderPosition = useMemo(() => {
    if (riderLocation?.lat == null || riderLocation?.lng == null) return null;
    return [Number(riderLocation.lat), Number(riderLocation.lng)];
  }, [riderLocation]);

  const positions = useMemo(
    () => [customerPosition, riderPosition].filter(Boolean),
    [customerPosition, riderPosition]
  );

  if (!customerPosition) {
    return (
      <div className="h-[360px] rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-center p-6">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Customer coordinates are not available for this order.</p>
      </div>
    );
  }

  return (
    <div className="h-[360px] md:h-[460px] rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
      <MapContainer center={customerPosition} zoom={15} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMap positions={positions} />
        <Marker position={customerPosition} icon={customerIcon} />
        {riderPosition && <Marker position={riderPosition} icon={riderIcon} />}
        {riderPosition && (
          <Polyline
            positions={[riderPosition, customerPosition]}
            pathOptions={{ color: "#148C2A", weight: 5, opacity: 0.75, dashArray: "8 10" }}
          />
        )}
      </MapContainer>
    </div>
  );
}

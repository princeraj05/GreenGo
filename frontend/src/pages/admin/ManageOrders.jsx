import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Clock, CheckCircle, MapPin, Navigation } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

/**
 * ManageOrders Component
 * Admin order center interface. Facilitates live order tracking,
 * assigning active delivery riders, manually updating estimated times of arrival (ETA),
 * and links to geographic real-time tracking views.
 */
export default function ManageOrders() {
  // Pagination page size limit configuration
  const PAGE_SIZE = 24;

  // ==========================================
  // STATE DECLARATIONS
  // ==========================================

  // Array containing all system orders records
  const [orders, setOrders] = useState([]);

  // Array of active delivery riders profiles loaded for assignment options
  const [deliveryBoys, setDeliveryBoys] = useState([]);

  // Map tracking rider assignment selections mapped by Order ID
  const [assignInput, setAssignInput] = useState({});

  // Pagination count limit indicator
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ==========================================
  // DATA FETCHING & EVENT HANDLERS
  // ==========================================

  /**
   * Fetches customer orders list.
   */
  const loadOrders = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await API.get("/api/orders", { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data);
    } catch (err) { console.log(err); }
  }, []);

  /**
   * Fetches the registered delivery boys list.
   */
  const loadDeliveryBoys = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await API.get("/api/orders/delivery-boys", { headers: { Authorization: `Bearer ${token}` } });
      setDeliveryBoys(res.data || []);
    } catch (err) { console.log(err); }
  }, []);

  // Mount loading callbacks
  useEffect(() => {
    Promise.resolve().then(() => {
      loadOrders();
      loadDeliveryBoys();
    });
  }, [loadDeliveryBoys, loadOrders]);

  /**
   * Associates a delivery rider with an order record.
   */
  const assignDeliveryBoy = async (orderId) => {
    const deliveryBoyId = assignInput[orderId];
    if (!deliveryBoyId) return;
    try {
      const token = await getToken();
      await API.put(`/api/orders/${orderId}/assign-delivery`, { deliveryBoyId }, { headers: { Authorization: `Bearer ${token}` } });
      setAssignInput({});
      loadOrders();
    } catch (err) { console.log(err); }
  };

  // Slice orders array down to current pagination limits
  const visibleOrders = useMemo(() => orders.slice(0, visibleCount), [orders, visibleCount]);

  // Denotes if more unrendered orders exist
  const hasMoreOrders = visibleOrders.length < orders.length;

  return (
    // Outer wrap container
    <div className="w-full pb-10">

      {/* --- HEADER SECTION --- */}
      <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 md:gap-4 leading-tight">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-450 shrink-0">
              <Package size={22} className="md:w-7 md:h-7" />
            </div>
            Manage Orders
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base md:text-lg font-medium leading-snug">Track and update all customer orders in real-time.</p>
        </div>
      </div>
      {/* --- END HEADER SECTION --- */}

      {/* --- ORDERS CARDS GRID --- */}
      {/* Employs responsive breakpoints md:grid-cols-2 and lg:grid-cols-3 to arrange order cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {visibleOrders.map((o, i) => (
            <div
              key={o._id}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Card hover className="p-4 sm:p-5 md:p-6 h-full flex flex-col border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">

                {/* --- ORDER ID + STATUS BADGE --- */}
                <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
                  <p className="font-extrabold text-slate-900 dark:text-white text-base md:text-lg">
                    #<span className="text-emerald-600 dark:text-emerald-450">{o._id.slice(-6).toUpperCase()}</span>
                  </p>
                  <Badge variant={o.status === 'Delivered' ? 'success' : o.status === 'Preparing' ? 'warning' : o.status === 'Cancelled' ? 'danger' : 'brand'} className="uppercase tracking-wider text-[10px] md:text-xs whitespace-nowrap">
                    {o.status}
                  </Badge>
                </div>

                {/* --- DELIVERY BOY ASSIGNMENT SECTION --- */}
                <div className="mb-4 md:mb-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                  <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-2">Assign Delivery Boy</label>
                  {o.assignedDeliveryBoy && (
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200 mb-2">
                      Assigned: {o.assignedDeliveryBoy.name || o.assignedDeliveryBoy.email || "Delivery Boy"} ({o.assignmentStatus || "Assigned"})
                    </p>
                  )}
                  <div className="flex gap-2">
                    <select
                      value={assignInput[o._id] || o.assignedDeliveryBoy?._id || ""}
                      onChange={(e) => setAssignInput({ ...assignInput, [o._id]: e.target.value })}
                      className="min-w-0 flex-1 px-3 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm outline-none"
                    >
                      <option value="">Select delivery boy</option>
                      {deliveryBoys.map((boy) => (
                        <option key={boy._id} value={boy._id}>
                          {boy.name || boy.phone || boy.email || "Delivery Boy"}
                        </option>
                      ))}
                    </select>
                    <Button onClick={() => assignDeliveryBoy(o._id)} className="rounded-xl px-4 bg-emerald-600 hover:bg-emerald-700 text-sm">
                      Assign
                    </Button>
                  </div>
                </div>

                {/* --- ADDRESS DETAIL --- */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3 md:p-4 border border-slate-100 dark:border-slate-800/50 space-y-2.5 md:space-y-3 mb-4 md:mb-6">
                  <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-snug break-words">
                    <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5" /> 
                    {o.address}
                  </p>
                  {o.distance !== undefined && o.distance !== null && (
                    <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-1.5 md:gap-2">
                      <span className="text-base">📏</span> 
                      Distance: <span className="font-bold text-slate-900 dark:text-white">{o.distance} km</span>
                      {o.latitude && o.longitude && (
                        <span className="text-[11px] md:text-xs text-slate-400 dark:text-slate-500">
                          ({o.latitude.toFixed(4)}, {o.longitude.toFixed(4)})
                        </span>
                      )}
                    </p>
                  )}
                  {o.customMessage && (
                    <p className="text-xs md:text-sm font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-1.5 leading-tight break-words">
                      <span className="shrink-0 mt-0.5">📝</span> 
                      <span>Notes: <span className="font-bold text-slate-800 dark:text-slate-200">{o.customMessage}</span></span>
                    </p>
                  )}
                </div>


                <Link to={`/admin/orders/${o._id}/tracking`} className="mb-4 md:mb-6 inline-flex">
                  <Button variant="secondary" className="rounded-xl gap-2 text-sm">
                    <Navigation size={16} /> Track Delivery
                  </Button>
                </Link>

                {/* --- ORDER ITEMS QUANTITIES LIST --- */}
                <div className="space-y-2 mb-4 md:mb-6 flex-1">
                  {o.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-3 text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                      <span>{i.name} <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">×{i.qty}</span></span>
                      <span className="font-bold text-slate-900 dark:text-white font-black">₹{i.price * i.qty}</span>
                    </div>
                  ))}
                </div>

                {/* --- TOTAL SUM SECTION --- */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
                  <span className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Amount</span>
                  <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                    ₹{o.total}
                  </span>
                </div>

              </Card>
            </div>
          ))}
      </div>
      {/* --- END ORDERS CARDS GRID --- */}

      {/* Show More Pagination control */}
      {hasMoreOrders && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="secondary"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-2xl px-6"
          >
            Show More Orders ({orders.length - visibleOrders.length})
          </Button>
        </div>
      )}

    </div>
  );
}

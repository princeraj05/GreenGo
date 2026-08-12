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

  // Map tracking eta minutes input updates mapped by Order ID
  const [etaInput, setEtaInput] = useState({});

  // Pagination count limit indicator
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Active sub-navigation filter indicator ("new" | "delivered" | "cancelled")
  const [statusFilter, setStatusFilter] = useState("new");

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

  const cancelOrderDirectly = async (orderId) => {
    const reason = window.prompt("Enter cancellation reason for customer:", "Restaurant is closed / Out of stock");
    if (reason === null) return;
    try {
      const token = await getToken();
      await API.put(`/api/orders/${orderId}/status`, { status: "Cancelled", cancellationReason: reason }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Order cancelled successfully.");
      loadOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to cancel order");
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      const token = await getToken();
      await API.put(`/api/orders/${orderId}/status`, { status: "RestaurantAccepted" }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Order accepted by restaurant!");
      loadOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to accept order");
    }
  };

  const updateETA = async (orderId) => {
    const mins = etaInput[orderId];
    if (mins === undefined || mins === "") return;
    try {
      const token = await getToken();
      await API.put(`/api/orders/${orderId}/status`, { etaMinutes: Number(mins) }, { headers: { Authorization: `Bearer ${token}` } });
      alert("ETA updated successfully!");
      loadOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to update ETA");
    }
  };

  const handleApproveCancellation = async (orderId) => {
    if (!window.confirm("Are you sure you want to APPROVE this cancellation request? This will cancel the order and process refund if paid online.")) return;
    try {
      const token = await getToken();
      const res = await API.put(`/api/orders/${orderId}/approve-cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message || "Cancellation approved.");
      loadOrders();
    } catch (err) {
      console.error("Approve cancel error:", err);
      alert(err.response?.data?.message || "Failed to approve cancellation");
    }
  };

  const handleRejectCancellation = async (orderId) => {
    const defaultMsg = "Order cancel nahi kr skte h food prepsered ho gya";
    const message = window.prompt("Enter rejection reason for customer:", defaultMsg);
    if (message === null) return;
    try {
      const token = await getToken();
      const res = await API.put(`/api/orders/${orderId}/reject-cancel`, { message: message || defaultMsg }, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message || "Cancellation rejected.");
      loadOrders();
    } catch (err) {
      console.error("Reject cancel error:", err);
      alert(err.response?.data?.message || "Failed to reject cancellation");
    }
  };

  const printOrderKOT = (o) => {
    const printWindow = window.open("", "_blank", "width=600,height=800");
    if (!printWindow) {
      alert("Please allow popups to print KOT.");
      return;
    }
    
    const orderTime = new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const estTime = o.etaMinutes ? `${o.etaMinutes} mins` : "15 - 20 mins";
    const itemsHtml = o.items.map(item => `
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 6px;">
        <span>${item.qty} x ${item.name}</span>
        <span>₹${item.price * item.qty}</span>
      </div>
    `).join("");
    
    const deliveryBoyName = o.assignedDeliveryBoy 
      ? (o.assignedDeliveryBoy.name || o.assignedDeliveryBoy.email || "Assigned")
      : "Not Assigned";

    const instructionsHtml = o.customMessage 
      ? `<div style="border-bottom: 1px dashed #000; padding: 10px 0; margin-bottom: 10px;">
          <div style="font-weight: bold; text-transform: uppercase; font-size: 11px; margin-bottom: 4px;">Instructions</div>
          <div style="font-size: 13px;">${o.customMessage}</div>
         </div>`
      : "";

    const userPhone = o.phone || (o.userId && o.userId.phone) || "";
    const userName = (o.userId && o.userId.name) || o.userName || "Customer";

    printWindow.document.write(`
      <html>
        <head>
          <title>KOT - #${o._id.slice(-6).toUpperCase()}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              width: 74mm;
              margin: 0 auto;
              padding: 10px;
              color: #000;
              background: #fff;
              font-size: 13px;
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
            .header-title { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
            .header-subtitle { font-size: 11px; font-weight: bold; margin-bottom: 5px; }
            .row { display: flex; margin-bottom: 4px; }
            .label { width: 100px; font-weight: bold; }
            .value { flex: 1; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body onload="window.print();">
          <div class="text-center">
            <div class="header-title">GREEN GO</div>
            <div class="header-subtitle">Kitchen Order Ticket (KOT)</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="row">
            <span class="label">Order No.</span>
            <span class="value">: #${o._id.slice(-6).toUpperCase()}</span>
          </div>
          <div class="row">
            <span class="label">Order Time</span>
            <span class="value">: ${orderTime}</span>
          </div>
          <div class="row">
            <span class="label">Est. Time</span>
            <span class="value">: ${estTime}</span>
          </div>
          
          <div class="divider"></div>
          
          <div style="font-weight: bold; text-transform: uppercase; font-size: 11px; margin-bottom: 8px;">Items</div>
          ${itemsHtml}
          
          <div class="divider"></div>
          
          ${instructionsHtml}
          
          <div style="font-weight: bold; text-transform: uppercase; font-size: 11px; margin-bottom: 8px;">Delivery Details</div>
          <div class="row">
            <span class="label">Name</span>
            <span class="value">: ${userName}</span>
          </div>
          <div class="row">
            <span class="label">Address</span>
            <span class="value">: ${o.address}</span>
          </div>
          ${userPhone ? `
          <div class="row">
            <span class="label">Phone</span>
            <span class="value">: ${userPhone}</span>
          </div>` : ""}
          
          <div class="divider"></div>
          
          <div style="font-weight: bold; text-transform: uppercase; font-size: 11px; margin-bottom: 8px;">Delivery Boy</div>
          <div style="font-size: 13px; font-weight: bold;">${deliveryBoyName}</div>
          
          <div class="divider"></div>
          
          <div class="text-center" style="margin-top: 15px; font-weight: bold;">
            Thank You!<br>Have a nice day!
          </div>

          <div style="margin-top: 25px; text-align: center;" class="no-print">
            <button onclick="window.close(); setTimeout(function() { window.location.href = '${window.location.origin}/admin/orders'; }, 100);" style="padding: 8px 20px; font-weight: bold; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 12px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
              &larr; Back to Admin
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Memoized filter logic for different order statuses
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter === "delivered") {
        return o.status === "Delivered";
      } else if (statusFilter === "cancelled") {
        return o.status === "Cancelled" || o.status === "CancellationRequested";
      } else {
        // "new" orders: everything that is NOT Delivered, Cancelled, or CancellationRequested
        return o.status !== "Delivered" && o.status !== "Cancelled" && o.status !== "CancellationRequested";
      }
    });
  }, [orders, statusFilter]);

  // Counts of orders categorized by statuses
  const counts = useMemo(() => {
    let newCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    orders.forEach((o) => {
      if (o.status === "Delivered") {
        deliveredCount++;
      } else if (o.status === "Cancelled" || o.status === "CancellationRequested") {
        cancelledCount++;
      } else {
        newCount++;
      }
    });

    return { newCount, deliveredCount, cancelledCount };
  }, [orders]);

  // Slice orders array down to current pagination limits
  const visibleOrders = useMemo(() => filteredOrders.slice(0, visibleCount), [filteredOrders, visibleCount]);

  // Denotes if more unrendered orders exist
  const hasMoreOrders = visibleOrders.length < filteredOrders.length;

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

      {/* --- STATS SUMMARY CARDS --- */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 p-4 flex items-center gap-3 sm:gap-4 shadow-sm">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Clock size={22} className="sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">New Orders</p>
            <p className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mt-0.5">{counts.newCount}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 p-4 flex items-center gap-3 sm:gap-4 shadow-sm">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-450 shrink-0">
            <CheckCircle size={22} className="sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Delivered</p>
            <p className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mt-0.5">{counts.deliveredCount}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 p-4 flex items-center gap-3 sm:gap-4 shadow-sm">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 dark:text-red-400 shrink-0">
            <Package size={22} className="sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Cancelled</p>
            <p className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mt-0.5">{counts.cancelledCount}</p>
          </div>
        </div>
      </div>

      {/* --- SUB-NAVIGATION BUTTONS / TABS --- */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("new");
            setVisibleCount(PAGE_SIZE);
          }}
          className={`rounded-2xl border px-4 py-2 text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            statusFilter === "new"
              ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
              : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          }`}
        >
          <span>New Orders</span>
          <span className={`px-2 py-0.5 text-xs font-black rounded-full transition-all ${
            statusFilter === "new"
              ? "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }`}>
            {counts.newCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("delivered");
            setVisibleCount(PAGE_SIZE);
          }}
          className={`rounded-2xl border px-4 py-2 text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            statusFilter === "delivered"
              ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
              : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          }`}
        >
          <span>Delivered Orders</span>
          <span className={`px-2 py-0.5 text-xs font-black rounded-full transition-all ${
            statusFilter === "delivered"
              ? "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }`}>
            {counts.deliveredCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("cancelled");
            setVisibleCount(PAGE_SIZE);
          }}
          className={`rounded-2xl border px-4 py-2 text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            statusFilter === "cancelled"
              ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
              : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          }`}
        >
          <span>Cancelled Orders</span>
          <span className={`px-2 py-0.5 text-xs font-black rounded-full transition-all ${
            statusFilter === "cancelled"
              ? "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }`}>
            {counts.cancelledCount}
          </span>
        </button>
      </div>

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
                {o.status !== "Cancelled" && o.status !== "CancellationRequested" && (
                  <div className="mb-4 md:mb-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                     <div className="flex justify-between items-center mb-2 gap-2">
                       <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                         {o.status === "Delivered" ? "Delivered By" : "Assign Delivery Boy"}
                       </label>
                       {o.status !== "Delivered" && (
                         <button
                           onClick={() => printOrderKOT(o)}
                           className="px-2 py-1 bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold text-[10px] rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                         >
                           🖨️ Print KOT
                         </button>
                       )}
                     </div>
                    {o.assignedDeliveryBoy && (
                      <p className="text-xs font-black text-slate-700 dark:text-slate-200 mb-2">
                        Assigned: {o.assignedDeliveryBoy.name || o.assignedDeliveryBoy.email || "Delivery Boy"} ({o.assignmentStatus || "Assigned"})
                      </p>
                    )}
                    {o.status !== "Delivered" && (
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
                    )}
                  </div>
                )}

                {/* --- TIME ESTIMATION (ETA) SETTING --- */}
                {o.status !== "Cancelled" && o.status !== "CancellationRequested" && o.status !== "Delivered" && (
                  <div className="mb-4 md:mb-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Set Prep Time Estimation (ETA)</label>
                      {o.etaMinutes && (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-450">{o.etaMinutes} mins set</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="e.g. 25 mins"
                        value={etaInput[o._id] !== undefined ? etaInput[o._id] : o.etaMinutes || ""}
                        onChange={(e) => setEtaInput({ ...etaInput, [o._id]: e.target.value })}
                        className="min-w-0 flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm outline-none"
                      />
                      <Button onClick={() => updateETA(o._id)} className="rounded-xl px-4 bg-slate-900 dark:bg-slate-800 text-sm">
                        Update
                      </Button>
                    </div>
                  </div>
                )}

                {/* --- CANCELLATION DETAILS --- */}
                {o.status === "Cancelled" && (
                  <div className="mb-4 md:mb-6 rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-3">
                    <p className="text-xs font-black text-red-650 dark:text-red-400 uppercase tracking-wider">Cancellation Reason</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">{o.cancellationReason || "No reason specified"}</p>
                    {o.cancellationCustomMessage && (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 italic">"{o.cancellationCustomMessage}"</p>
                    )}
                  </div>
                )}

                {/* --- CANCELLATION REQUEST SECTION --- */}
                {o.status === "CancellationRequested" && (
                  <div className="mb-4 md:mb-6 rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                    <p className="text-xs font-black text-amber-700 dark:text-amber-405 uppercase tracking-wider">Cancellation Requested</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">Reason: {o.cancellationReason || "No reason specified"}</p>
                    {o.cancellationCustomMessage && (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-405 mt-1 italic">"{o.cancellationCustomMessage}"</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={() => handleApproveCancellation(o._id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 shrink-0 text-white font-bold"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectCancellation(o._id)}
                        variant="danger"
                        className="text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 shrink-0 font-bold"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {/* --- CUSTOMER INFO SECTION --- */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3 md:p-4 border border-slate-100 dark:border-slate-800/50 space-y-1.5 mb-3">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-widest">Customer Details</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    👤 {(o.userId && o.userId.name) || o.userName || "GreenGo Customer"}
                  </p>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    📞 {o.phone || (o.userId && o.userId.phone) || "No phone"}
                  </p>
                  {o.userId && o.userId.email && (
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span>📧</span> {o.userId.email}
                    </p>
                  )}
                  {o.userId && o.userId.birthDate && (
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span>🎂</span> Birthday: {new Date(o.userId.birthDate).toLocaleDateString()}
                    </p>
                  )}
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


                <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                  {o.status === "Pending" && (
                    <Button variant="brand" className="rounded-xl text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => acceptOrder(o._id)}>
                      ✓ Accept Order
                    </Button>
                  )}
                  {o.status !== "Cancelled" && o.status !== "CancellationRequested" && (
                    <Link to={`/admin/orders/${o._id}/tracking`} className="inline-flex">
                      <Button variant="secondary" className="rounded-xl gap-2 text-sm">
                        <Navigation size={16} /> Track Delivery
                      </Button>
                    </Link>
                  )}
                  {o.status !== "Cancelled" && o.status !== "Delivered" && o.status !== "CancellationRequested" && (
                    <Button variant="danger" className="rounded-xl text-sm" onClick={() => cancelOrderDirectly(o._id)}>
                      Cancel Order
                    </Button>
                  )}
                </div>

                {/* --- ORDER ITEMS QUANTITIES LIST --- */}
                <div className="space-y-2 mb-4 md:mb-6 flex-1">
                  {o.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-3 text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                      <span>{i.name} <span className="text-emerald-600 dark:text-emerald-455 font-bold ml-1">×{i.qty}</span></span>
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
          {filteredOrders.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-slate-350 dark:text-slate-700">
                <Package size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No orders found</h3>
              <p className="text-sm font-medium mt-1">There are no orders in this category right now.</p>
            </div>
          )}
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
            Show More Orders ({filteredOrders.length - visibleOrders.length})
          </Button>
        </div>
      )}

    </div>
  );
}

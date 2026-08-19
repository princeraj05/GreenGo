import { useCallback, useEffect, useMemo, useState } from "react";
import { X, User, Mail, Phone, Calendar, Clock, DollarSign, HelpCircle, FileText, CheckCircle, AlertTriangle, Check, AlertOctagon } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { getImageUrl } from "../../utils/getApiUrl";

/**
 * CancelledOrders Component
 * Lists cancelled orders categorised into two separate tables:
 * - UPI / Online Payments
 * - Cash on Delivery (COD)
 * Also lists pending cancellation requests from customers where Admin can Approve or Reject them.
 */
export default function CancelledOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAllOrders = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await API.get("/api/orders", { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllOrders();
  }, [loadAllOrders]);

  const cancellationRequests = useMemo(() => orders.filter((o) => o.status === "CancellationRequested"), [orders]);
  const upiCancelledOrders = useMemo(() => orders.filter((o) => o.status === "Cancelled" && o.paymentMethod !== "COD"), [orders]);
  const codCancelledOrders = useMemo(() => orders.filter((o) => o.status === "Cancelled" && o.paymentMethod === "COD"), [orders]);

  const handleApproveCancellation = async (orderId) => {
    if (!window.confirm("Are you sure you want to APPROVE this cancellation request? This will cancel the order and process refund if paid online.")) return;
    try {
      setLoading(true);
      const token = await getToken();
      const res = await API.put(`/api/orders/${orderId}/approve-cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message || "Cancellation approved.");
      loadAllOrders();
    } catch (err) {
      console.error("Approve cancel error:", err);
      alert(err.response?.data?.message || "Failed to approve cancellation");
      setLoading(false);
    }
  };

  const handleRejectCancellation = async (orderId) => {
    const defaultMsg = "Order cancel nahi kr skte h food prepsered ho gya";
    const message = window.prompt("Enter rejection reason for customer:", defaultMsg);
    if (message === null) return; // cancelled prompt
    try {
      setLoading(true);
      const token = await getToken();
      const res = await API.put(`/api/orders/${orderId}/reject-cancel`, { message: message || defaultMsg }, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message || "Cancellation rejected.");
      loadAllOrders();
    } catch (err) {
      console.error("Reject cancel error:", err);
      alert(err.response?.data?.message || "Failed to reject cancellation");
      setLoading(false);
    }
  };

  const renderTable = (data, isOnline = false) => {
    if (data.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-8 text-center">
          <X className="mx-auto text-slate-300 dark:text-slate-700" size={30} />
          <h3 className="mt-3 text-sm font-black text-slate-700 dark:text-slate-300">No cancelled orders found</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">There are no cancellations under this payment method.</p>
        </div>
      );
    }

    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-900/30 text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3">Order Details</th>
              <th className="px-4 py-3">Customer info</th>
              <th className="px-4 py-3">Items Ordered</th>
              <th className="px-4 py-3">Cancellation details</th>
              <th className="px-4 py-3 text-right">Total</th>
              {isOnline && <th className="px-4 py-3 text-center">Refund Status</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {data.map((o) => (
              <tr key={o._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                {/* Order ID & Date */}
                <td className="px-4 py-4 align-top whitespace-nowrap">
                  <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                    #{o._id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1 mt-1">
                    <Calendar size={10} />
                    {new Date(o.cancelledAt || o.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                    <Clock size={10} />
                    {new Date(o.cancelledAt || o.updatedAt).toLocaleTimeString()}
                  </span>
                </td>

                {/* Customer Info */}
                <td className="px-4 py-4 align-top min-w-[150px]">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 leading-snug">
                    <User size={12} className="text-slate-400 shrink-0" />
                    {typeof o.userId === "object" && o.userId !== null ? o.userId.name || "Customer" : "Customer"}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 leading-snug break-all">
                    <Mail size={11} className="text-slate-400 shrink-0" />
                    {typeof o.userId === "object" && o.userId !== null ? o.userId.email || "N/A" : o.userId || "N/A"}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 leading-snug">
                    <Phone size={11} className="text-slate-400 shrink-0" />
                    {o.phone || (typeof o.userId === "object" && o.userId !== null ? o.userId.phone : "N/A")}
                  </span>
                </td>

                {/* Items Ordered */}
                <td className="px-4 py-4 align-top min-w-[200px]">
                  <div className="flex flex-col gap-2">
                    {(o.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="h-8 w-8 rounded-lg object-contain bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-0.5 shrink-0"
                          onError={(e) => {
                            e.target.src = "https://placehold.co/80x80?text=Food";
                          }}
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-355 leading-tight">
                          {item.name}{item.variant ? ` - ${item.variant}` : (item.variantName ? ` - ${item.variantName}` : '')} <span className="text-brand-500 dark:text-brand-400 font-black">×{item.qty}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </td>

                {/* Cancellation Details */}
                <td className="px-4 py-4 align-top max-w-[250px]">
                  <span className="text-xs font-black text-red-600 dark:text-red-400 flex items-center gap-1.5 leading-snug">
                    <HelpCircle size={12} className="shrink-0" />
                    Reasons:
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-350 leading-relaxed bg-red-50/50 dark:bg-red-950/10 border border-red-100/60 dark:border-red-900/20 rounded-xl p-2">
                    {o.cancellationReason || "No reasons selected"}
                  </p>
                  {o.cancellationCustomMessage && (
                    <div className="mt-2 text-xs border-t border-slate-150 dark:border-slate-800 pt-1">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Custom Explanation:</span>
                      <p className="mt-0.5 font-bold italic text-slate-600 dark:text-slate-400 leading-snug">{o.cancellationCustomMessage}</p>
                    </div>
                  )}
                </td>

                {/* Total */}
                <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                  <span className="font-black text-slate-900 dark:text-white text-base">
                    ₹{o.total}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-550 font-black uppercase tracking-wider block mt-1">
                    {o.paymentMethod || "COD"}
                  </span>
                </td>

                {/* Refund Status */}
                {isOnline && (
                  <td className="px-4 py-4 align-top text-center whitespace-nowrap">
                    {o.transactionId ? (
                      <div className="inline-flex flex-col items-center gap-1">
                        <Badge variant="success" className="uppercase tracking-widest text-[9px] font-black px-2 py-1 gap-1">
                          <CheckCircle size={10} /> Auto-Refunded
                        </Badge>
                        <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold max-w-[100px] truncate block" title={o.transactionId}>
                          Txn: {o.transactionId}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="warning" className="uppercase tracking-widest text-[9px] font-black px-2 py-1 gap-1">
                        <AlertTriangle size={10} /> Manual refund req
                      </Badge>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full pb-10">
      {/* Header */}
      <div className="mb-6 md:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
            <X size={22} className="md:w-7 md:h-7" />
          </div>
          Cancellation Center
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base md:text-lg font-medium">
          Manage pending cancellation requests and view approved cancellations.
        </p>
      </div>

      {/* Cancellation Requests (Actionable List) */}
      <div className="space-y-4 mb-10">
        <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <span className="text-brand-500">⏳</span> Pending Cancellation Requests
          <span className="rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-950/60 text-xs font-black text-amber-600 dark:text-amber-450 px-2.5 py-0.5">
            {cancellationRequests.length}
          </span>
        </h2>
        
        {cancellationRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-8 text-center">
            <CheckCircle className="mx-auto text-emerald-400 dark:text-emerald-600" size={30} />
            <h3 className="mt-3 text-sm font-black text-slate-700 dark:text-slate-300">All caught up!</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">There are no pending order cancellation requests.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-900/30 text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">Order Details</th>
                  <th className="px-4 py-3">Customer info</th>
                  <th className="px-4 py-3">Items Ordered</th>
                  <th className="px-4 py-3">Reasons & custom text</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {cancellationRequests.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="px-4 py-4 align-top whitespace-nowrap">
                      <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                        #{o._id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-1">
                        Placed: {new Date(o.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="text-xs font-black text-slate-900 dark:text-white block leading-snug">
                        {typeof o.userId === "object" && o.userId !== null ? o.userId.name || "Customer" : "Customer"}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mt-1 leading-snug break-all">
                        {typeof o.userId === "object" && o.userId !== null ? o.userId.email || "N/A" : o.userId || "N/A"}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                        {o.phone || (typeof o.userId === "object" && o.userId !== null ? o.userId.phone : "N/A")}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        {(o.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              className="h-8 w-8 rounded-lg object-contain bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-0.5 shrink-0"
                              onError={(e) => { e.target.src = "https://placehold.co/80x80?text=Food"; }}
                            />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-355 leading-tight">
                              {item.name}{item.variant ? ` - ${item.variant}` : (item.variantName ? ` - ${item.variantName}` : '')} <span className="text-brand-500 dark:text-brand-400 font-black">×{item.qty}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top max-w-[250px]">
                      <span className="text-xs font-black text-amber-600 dark:text-amber-450 block leading-snug">
                        Reasons Selected:
                      </span>
                      <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-350 leading-relaxed bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/60 dark:border-amber-900/20 rounded-xl p-2">
                        {o.cancellationReason || "No reasons selected"}
                      </p>
                      {o.cancellationCustomMessage && (
                        <div className="mt-2 text-xs border-t border-slate-150 dark:border-slate-800 pt-1">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Customer Custom Message:</span>
                          <p className="mt-0.5 font-bold italic text-slate-600 dark:text-slate-400 leading-snug break-words">{o.cancellationCustomMessage}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                      <span className="font-black text-slate-900 dark:text-white text-base">
                        ₹{o.total}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-550 font-black uppercase tracking-wider block mt-1">
                        {o.paymentMethod || "COD"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-center">
                      <div className="flex flex-col sm:flex-row justify-center gap-2">
                        <Button
                          onClick={() => handleApproveCancellation(o._id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs py-1.5 px-3 rounded-xl gap-1 shrink-0"
                        >
                          <Check size={12} /> Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectCancellation(o._id)}
                          variant="danger"
                          className="text-xs py-1.5 px-3 rounded-xl gap-1 shrink-0"
                        >
                          <AlertOctagon size={12} /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Online Payments Table */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <span className="text-brand-500">💳</span> UPI / Online Payment Cancellations (Approved)
          <span className="rounded-full bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-950/60 text-xs font-black text-red-600 dark:text-red-400 px-2.5 py-0.5">
            {upiCancelledOrders.length}
          </span>
        </h2>
        {renderTable(upiCancelledOrders, true)}
      </div>

      {/* COD Table */}
      <div className="space-y-4">
        <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <span className="text-brand-500">💵</span> Cash on Delivery (COD) Cancellations (Approved)
          <span className="rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-700 dark:text-slate-300 px-2.5 py-0.5">
            {codCancelledOrders.length}
          </span>
        </h2>
        {renderTable(codCancelledOrders, false)}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Clock, CheckCircle, ChefHat, Truck, ShoppingBag, Star, Edit3, Trash2, X, Navigation, Store, UserCheck, Bike } from "lucide-react";
import { getToken } from "../../utils/getToken";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";
import Button from "../../components/ui/Button";
import { playOrderStatusVoice } from "../../utils/ttsService";

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

const steps = [
  { key: "placed", label: "Order Placed" },
  { key: "restaurant_accepted", label: "Restaurant Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "delivery_accepted", label: "Delivery Partner Accepted" },
  { key: "on_the_way", label: "On The Way" },
  { key: "delivered", label: "Delivered" }
];

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

/**
 * Orders Component
 * 
 * Lists customer food orders and enables real-time tracking, cancellation support within 5 minutes of placing,
 * and reviewing dishes through a custom write/edit star rating feedback popup.
 */
export default function Orders() {
  
  /* --- STATE DECLARATIONS --- */
  // orders: Array of customer checkout records retrieved from database
  const [orders, setOrders] = useState([]);
  // loading: Manages page loading placeholders
  const [loading, setLoading] = useState(true);
  // reviews: Reviews submitted by the logged-in customer
  const [reviews, setReviews] = useState([]);

  /* --- MODAL STATE DECLARATIONS --- */
  // reviewModalOpen: Displays feedback submission popup details
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  // selectedOrder: Tracks order reference being reviewed
  const [selectedOrder, setSelectedOrder] = useState(null);
  // selectedFoodItem: Tracks dish item within order being graded
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  // rating: Current star grade selected (1 to 5)
  const [rating, setRating] = useState(5);
  // reviewText: Message text input for reviews
  const [reviewText, setReviewText] = useState("");
  // editingReviewId: Reference ID of feedback if updating existing reviews
  const [editingReviewId, setEditingReviewId] = useState(null);

  // cancellation states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [cancelCustomMessage, setCancelCustomMessage] = useState("");

  // Toast notifications state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  /* --- EFFECTS & LIFECYCLE --- */

  // Load orders and user reviews on initialization and poll data updates every 10 seconds
  useEffect(() => {
    loadOrders();
    loadUserReviews();
    const t = setInterval(() => {
      loadOrders();
      loadUserReviews();
    }, 10000);
    return () => clearInterval(t);
  }, []);

  // AUTOMATIC VOICE CONFIRMATION TRIGGER:
  // When the orders list changes (either on initial load or during polling updates), 
  // check for any order that is confirmed (i.e. 'Pending' or 'Preparing' status) 
  // and trigger the TTS voice announcement. Duplicate playback prevention is managed 
  // internally within playOrderConfirmationVoice using persistent preferences.
  useEffect(() => {
    if (orders && orders.length > 0) {
      const targetStatuses = ["Pending", "RestaurantAccepted", "Preparing", "CancellationRequested", "Cancelled"];
      orders.forEach((order) => {
        if (targetStatuses.includes(order.status)) {
          playOrderStatusVoice(order._id, order.status, order.updatedAt || order.createdAt);
        }
      });
    }
  }, [orders]);

  /* --- ACTIONS, HELPERS & SERVICE FLOWS --- */

  /**
   * canCancel: Determines if an order can be cancelled by verifying it was created
   * less than 5 minutes ago and has not reached preparation or delivery stages.
   */
  const canCancel = (o) => {
    if (["Delivered", "Out for Delivery", "Cancelled", "CancellationRequested"].includes(o.status)) return false;
    const timeDiff = Date.now() - new Date(o.createdAt).getTime();
    return timeDiff <= 5 * 60 * 1000;
  };

  /**
   * openCancelDialog: Triggers cancellation flow for orders.
   */
  const openCancelDialog = (orderId) => {
    setCancellingOrderId(orderId);
    setSelectedReasons([]);
    setCancelCustomMessage("");
    setCancelModalOpen(true);
  };

  const handleCancelOrderSubmit = async () => {
    if (selectedReasons.length === 0) return;
    try {
      const token = await getToken();
      const res = await fetch(`${getApiUrl()}/api/orders/${cancellingOrderId}/cancel`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          reason: selectedReasons.join(", "), 
          customMessage: cancelCustomMessage 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCancelModalOpen(false);
        loadOrders();
        // TRIGGER ORDER CANCELLATION VOICE NOTIFICATION
        // Plays the custom cancellation submission voice message.
        // Handled asynchronously with persistent preferences for duplicate prevention.
        playOrderStatusVoice(cancellingOrderId, "CancellationRequested");
        alert(data.message || "Cancellation request sent successfully.");
      } else {
        alert(data.message || "Failed to submit cancellation request");
      }
    } catch (err) {
      console.error("Failed to submit cancellation request:", err);
    }
  };

  /**
   * loadUserReviews: Pulls previous reviews posted by the current customer account.
   */
  const loadUserReviews = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${getApiUrl()}/api/reviews?user=me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res.ok) setReviews(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * handleOpenWriteReview: Initializes empty rating input values for writing a new review.
   */
  const handleOpenWriteReview = (order, item) => {
    setSelectedOrder(order);
    setSelectedFoodItem(item);
    setRating(5);
    setReviewText("");
    setEditingReviewId(null);
    setReviewModalOpen(true);
  };

  /**
   * handleOpenEditReview: Populates values for modifying an existing review.
   */
  const handleOpenEditReview = (review, order, item) => {
    setSelectedOrder(order);
    setSelectedFoodItem(item);
    setRating(review.rating);
    setReviewText(review.reviewText);
    setEditingReviewId(review._id);
    setReviewModalOpen(true);
  };

  /**
   * handleSubmitReview: Submits new feedback or pushes updates to existing reviews.
   */
  const handleSubmitReview = async () => {
    try {
      const token = await getToken();
      const url = editingReviewId
        ? `${getApiUrl()}/api/reviews/${editingReviewId}`
        : `${getApiUrl()}/api/reviews`;
      const method = editingReviewId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          foodId: selectedFoodItem.foodId,
          rating,
          reviewText: (reviewText || "").trim()
        })
      });

      if (res.ok) {
        setReviewModalOpen(false);
        loadUserReviews();
        loadOrders();
        showToast(editingReviewId ? "Review updated successfully!" : "Review submitted successfully!");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to submit review");
      }
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * handleDeleteReview: Deletes a review from the database.
   */
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`${getApiUrl()}/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadUserReviews();
        loadOrders();
        showToast("Review deleted successfully!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * loadOrders: Requests orders list for active customer.
   */
  const loadOrders = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setOrders([]);
        return;
      }
      const res = await fetch(`${getApiUrl()}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res.ok) setOrders(await res.json());
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * getProgress: Maps text statuses to width percentages for tracker lines.
   */
  const getProgress = (status) => {
    if (status === "Delivered") return 100;
    if (status === "Out for Delivery") return 90;
    if (status === "AcceptedByDeliveryBoy") return 75;
    if (status === "Preparing") return 60;
    if (status === "RestaurantAccepted") return 40;
    return 20; // Pending
  };

  /**
   * getStatusIcon: Selects tracking icon based on status string.
   */
  const getStatusIcon = (status) => {
    if (status === "Delivered") return <CheckCircle size={16} />;
    if (status === "Out for Delivery") return <Bike size={16} />;
    if (status === "AcceptedByDeliveryBoy") return <UserCheck size={16} />;
    if (status === "Preparing") return <ChefHat size={16} />;
    if (status === "RestaurantAccepted") return <Store size={16} />;
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
    /* --- MAIN PAGE WRAPPER --- */
    <div className="max-w-5xl mx-auto w-full pb-10">
      
      {/* Page Title Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-50 dark:bg-brand-950/35 rounded-xl sm:rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-300 shrink-0">
            <Package size={22} />
          </div>
          My Orders
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base md:text-lg font-medium">Track your delicious food journey.</p>
      </motion.div>

      {/* --- ORDERS STREAM --- */}
      {orders.length === 0 ? (
        /* Empty feedback layout if orders empty */
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="text-center py-12 md:py-20 border-slate-100 rounded-3xl">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-slate-300 dark:text-slate-600">
              <ShoppingBag className="w-8 h-8 sm:w-12 sm:h-12" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-1.5 md:mb-2">No orders yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Time to order some tasty food!</p>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {orders.map((o, idx) => (
            <motion.div 
              key={o._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-4 sm:p-6 md:p-8 border-slate-100 rounded-3xl">
                
                {/* Order card header details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Order
                    </h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 font-medium">{new Date(o.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge variant={o.status === "Delivered" ? "success" : "brand"} className="px-3 py-1.5 text-xs gap-1.5 uppercase tracking-wide w-fit">
                    {getStatusIcon(o.status)}
                    {getStatusLabel(o.status)}
                  </Badge>
                </div>

                {o.status === "Cancelled" ? (
                  <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-300">
                    <p className="text-sm font-black flex items-center gap-2">
                      <span className="text-lg">🚫</span> Order Cancelled
                    </p>
                    {o.cancellationReason && (
                      <p className="text-xs font-bold mt-1.5">
                        Reason: <span className="font-extrabold text-slate-900 dark:text-white">{o.cancellationReason}</span>
                      </p>
                    )}
                    {o.cancellationCustomMessage && (
                      <p className="text-xs font-medium mt-1">
                        Note: <span className="text-slate-600 dark:text-slate-400">{o.cancellationCustomMessage}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  /* --- PROGRESS TRACKER BAR (6-STAGE STEPPER) --- */
                  <div className="mb-6 md:mb-10 relative px-5">
                    {/* Stepper progress connector lines */}
                    <div className="absolute top-5 left-5 right-5 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 rounded-full">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(getStepIndex(o.status) / 5) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-brand-500 rounded-full"
                      />
                    </div>

                    <div className="relative flex justify-between w-full">
                      {steps.map((step, idx) => {
                        const stepIdx = getStepIndex(o.status);
                        const isCompleted = idx <= stepIdx;
                        const isCurrent = idx === stepIdx;
                        
                        return (
                          <div key={step.key} className="flex flex-col items-center text-center space-y-2 relative z-10">
                            {/* Circle Indicator */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-500/20' 
                                : 'bg-white dark:bg-slate-905 border-slate-200 dark:border-slate-800 text-slate-400'
                            } ${isCurrent ? 'ring-4 ring-brand-500/20 scale-110' : ''}`}>
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            {/* Step label */}
                            <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-wider leading-tight max-w-[70px] sm:max-w-[85px] mx-auto transition-colors ${
                              isCompleted ? 'text-brand-700 dark:text-brand-400' : 'text-slate-400'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* --- ORDERED FOOD ITEMS CHECKLIST --- */}
                <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl p-1.5 mb-4 md:mb-6 border border-slate-100 dark:border-slate-800/60">
                  {o.items.map((i, iIdx) => (
                    <div key={iIdx} className="flex items-center gap-3 p-2.5 border-b border-slate-100 dark:border-slate-800/40 last:border-0 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-colors">
                      <img 
                        src={getImageUrl(i.image)}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-contain bg-slate-100 dark:bg-slate-800 p-1 shrink-0" 
                        onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                        alt={i.name}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">{i.name}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs font-medium">
                          <span className="text-slate-500">Qty: {i.qty}</span>
                          
                          {/* Render review inputs ONLY if item delivery is confirmed */}
                          {o.status === "Delivered" && (() => {
                            const itemReview = reviews.find(r => String(r.orderId) === String(o._id) && String(r.foodId) === String(i.foodId));
                            if (itemReview) {
                              return (
                                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 px-1.5 py-0.5 rounded-lg text-[10px] font-bold shadow-sm">
                                  <span className="flex items-center text-amber-500 gap-0.5">
                                    ★ {itemReview.rating}
                                  </span>
                                  <button 
                                    onClick={() => handleOpenEditReview(itemReview, o, i)}
                                    className="text-blue-500 hover:text-blue-600 flex items-center gap-0.5 font-extrabold transition-colors cursor-pointer"
                                    title="Edit Review"
                                  >
                                    <Edit3 size={10} /> Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteReview(itemReview._id)}
                                    className="text-red-500 hover:text-red-600 flex items-center gap-0.5 font-extrabold transition-colors cursor-pointer"
                                    title="Delete Review"
                                  >
                                    <Trash2 size={10} /> Delete
                                  </button>
                                </div>
                              );
                            } else {
                              return (
                                <button
                                  onClick={() => handleOpenWriteReview(o, i)}
                                  className="text-brand-600 hover:text-brand-700 hover:underline text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-2 py-0.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                                >
                                  Write Review
                                </button>
                              );
                            }
                          })()}
                        </div>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base md:text-lg shrink-0">₹{i.price * i.qty}</p>
                    </div>
                  ))}
                </div>

                {/* --- ORDER TOTALS & ACTIONS ROW --- */}
                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/60 pt-4 md:pt-6">
                  <div className="space-y-0.5">
                    <p className="text-slate-500 text-xs md:text-sm font-medium">
                      Payment: <span className="text-slate-900 dark:text-white font-bold">{o.paymentMethod || "COD"}</span>
                    </p>
                    {o.distance !== undefined && o.distance !== null && (
                      <p className="text-slate-500 text-xs md:text-sm font-medium">
                        Distance: <span className="text-slate-900 dark:text-white font-bold">{o.distance} km</span>
                      </p>
                    )}
                    {o.status !== "Delivered" && o.status !== "Cancelled" && (
                      <p className="text-slate-500 text-xs md:text-sm font-medium flex items-center gap-1.5 mt-1">
                        <span>Estimated Delivery:</span>
                        <span className="text-brand-600 dark:text-brand-400 font-extrabold px-2 py-0.5 rounded-lg bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/40">
                          {getEstimatedDeliveryTime(o.status, o.etaMinutes)}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-0.5">Total Amount</p>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-brand-600">₹{o.total}</h3>
                    <div className="flex gap-2 justify-end">
                      {canCancel(o) && (
                        <Button size="sm" variant="danger" className="rounded-xl" onClick={() => openCancelDialog(o._id)}>
                          Cancel Order
                        </Button>
                      )}
                      {o.status !== "Delivered" && o.status !== "Cancelled" && (
                        <Link to={`/user/orders/${o._id}/tracking`} className="inline-flex">
                          <Button size="sm" variant="secondary" className="rounded-xl gap-1.5">
                            <Navigation size={14} /> Track Delivery
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* --- WRITE/EDIT DISH REVIEW OVERLAY MODAL --- */}
      <AnimatePresence>
        {reviewModalOpen && selectedFoodItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col p-5 sm:p-7"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {editingReviewId ? "Edit Review" : "Write Review"}
                </h3>
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Item</h4>
                  <p className="font-bold text-slate-800 dark:text-white text-base md:text-lg">{selectedFoodItem.name}</p>
                </div>

                {/* Rating selection (Interactive Star Grid) */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Your Rating</h4>
                  <div className="flex gap-1.5 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform active:scale-90 text-yellow-400 focus:outline-none"
                      >
                        <Star
                          size={30}
                          fill={star <= rating ? "currentColor" : "none"}
                          className={star <= rating ? "text-amber-500" : "text-slate-200 dark:text-slate-800"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review comments entry box */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Review Comment</h4>
                  <textarea
                    placeholder="Tell us what you loved or how we can improve this dish..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs sm:text-sm font-medium outline-none transition focus:border-brand-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-100/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Submit CTA toolbar */}
              <div className="mt-6 flex gap-2.5">
                <Button
                  variant="secondary"
                  onClick={() => setReviewModalOpen(false)}
                  className="flex-1 rounded-xl py-2.5 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  className="flex-1 rounded-xl py-2.5 text-sm shadow-brand-500/20"
                >
                  Submit
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancelModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col p-5 sm:p-7 text-slate-900 dark:text-white"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl md:text-2xl font-black tracking-tight">
                  Cancel Order
                </h3>
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4">
                <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Why you cancelled this food?
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    "Change of mind",
                    "Order took too long to prepare",
                    "Placed order by mistake",
                    "Found a better deal / price"
                  ].map((option) => {
                    const isChecked = selectedReasons.includes(option);
                    return (
                      <label
                        key={option}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          isChecked
                            ? "border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300"
                            : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedReasons(selectedReasons.filter((r) => r !== option));
                            } else {
                              setSelectedReasons([...selectedReasons, option]);
                            }
                          }}
                          className="w-4 h-4 text-brand-500 border-slate-300 rounded focus:ring-brand-500"
                        />
                        <span className="text-sm font-bold">{option}</span>
                      </label>
                    );
                  })}
                </div>
                
                <div className="mt-4">
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1.5 font-bold">
                    Custom message (explain why you cancelled):
                  </p>
                  <textarea
                    placeholder="Type your explanation here..."
                    value={cancelCustomMessage}
                    onChange={(e) => setCancelCustomMessage(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs sm:text-sm font-medium outline-none transition focus:border-brand-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-100/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Submit CTA toolbar */}
              <div className="mt-6 flex gap-2.5">
                <Button
                  variant="secondary"
                  onClick={() => setCancelModalOpen(false)}
                  className="flex-1 rounded-xl py-2.5 text-sm"
                >
                  Go Back
                </Button>
                <Button
                  disabled={selectedReasons.length === 0}
                  onClick={handleCancelOrderSubmit}
                  className="flex-1 rounded-xl py-2.5 text-sm shadow-brand-500/20"
                >
                  Cancel Order
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[3000] px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border font-extrabold text-sm ${
              toast.type === "success"
                ? "bg-emerald-500 text-white border-emerald-400"
                : "bg-rose-500 text-white border-rose-400"
            }`}
          >
            <CheckCircle size={20} className="shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


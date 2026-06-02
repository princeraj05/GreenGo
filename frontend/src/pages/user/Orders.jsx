import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Clock, CheckCircle, ChefHat, Truck, ShoppingBag, Star, Edit3, Trash2, X } from "lucide-react";
import { getToken } from "../../utils/getToken";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";
import Button from "../../components/ui/Button";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  // Modal States
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);

  useEffect(() => {
    loadOrders();
    loadUserReviews();
    const t = setInterval(() => {
      loadOrders();
      loadUserReviews();
    }, 10000);
    return () => clearInterval(t);
  }, []);

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

  const handleOpenWriteReview = (order, item) => {
    setSelectedOrder(order);
    setSelectedFoodItem(item);
    setRating(5);
    setReviewText("");
    setEditingReviewId(null);
    setReviewModalOpen(true);
  };

  const handleOpenEditReview = (review, order, item) => {
    setSelectedOrder(order);
    setSelectedFoodItem(item);
    setRating(review.rating);
    setReviewText(review.reviewText);
    setEditingReviewId(review._id);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) return;
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
          reviewText: reviewText.trim()
        })
      });

      if (res.ok) {
        setReviewModalOpen(false);
        loadUserReviews();
        loadOrders();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to submit review");
      }
    } catch (e) {
      console.error(e);
    }
  };

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
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrders = async () => {
    try {
      const token = await getToken();
      if (!token) return;
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

  const getProgress = (status) => {
    if (status === "Delivered") return 100;
    if (status === "Out for Delivery") return 75;
    if (status === "Preparing") return 50;
    return 25; // Pending
  };

  const getStatusIcon = (status) => {
    if (status === "Delivered") return <CheckCircle size={16} />;
    if (status === "Out for Delivery") return <Truck size={16} />;
    if (status === "Preparing") return <ChefHat size={16} />;
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
    <div className="max-w-5xl mx-auto w-full pb-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
            <Package size={28} />
          </div>
          My Orders
        </h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">Track your delicious food journey.</p>
      </motion.div>

      {orders.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="text-center py-20 border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <ShoppingBag size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No orders yet</h3>
            <p className="text-slate-500 font-medium">Time to order some tasty food!</p>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {orders.map((o, idx) => (
            <motion.div 
              key={o._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-6 md:p-8 border-slate-100">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Order <span className="text-brand-500">#{o._id.slice(-6).toUpperCase()}</span>
                    </h3>
                    <p className="text-slate-500 text-sm mt-1 font-medium">{new Date(o.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge variant={o.status === "Delivered" ? "success" : "brand"} className="px-4 py-2 text-sm gap-2 uppercase tracking-wide">
                    {getStatusIcon(o.status)}
                    {o.status}
                  </Badge>
                </div>

                {/* TRACKER */}
                <div className="mb-10 relative">
                  <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-100 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgress(o.status)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-brand-400 to-brand-600" 
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
                    <span className={getProgress(o.status) >= 25 ? "text-brand-600" : ""}>Placed</span>
                    <span className={getProgress(o.status) >= 50 ? "text-brand-600" : ""}>Preparing</span>
                    <span className={getProgress(o.status) >= 75 ? "text-brand-600" : ""}>On the way</span>
                    <span className={getProgress(o.status) >= 100 ? "text-emerald-600" : ""}>Delivered</span>
                  </div>
                </div>

                <div className="bg-slate-50/50 rounded-2xl p-2 mb-6 border border-slate-100">
                  {o.items.map((i, iIdx) => (
                    <div key={iIdx} className="flex items-center gap-4 p-3 border-b border-slate-100 last:border-0 hover:bg-white rounded-xl transition-colors">
                      <img 
                        src={getImageUrl(i.image)}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-100" 
                        onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                        alt={i.name}
                      />
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{i.name}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1 text-sm font-medium">
                          <span className="text-slate-500">Qty: {i.qty}</span>
                          
                          {o.status === "Delivered" && (() => {
                            const itemReview = reviews.find(r => String(r.orderId) === String(o._id) && String(r.foodId) === String(i.foodId));
                            if (itemReview) {
                              return (
                                <div className="flex items-center gap-2.5 bg-white border border-slate-100 px-2 py-0.5 rounded-lg text-xs font-bold shadow-sm">
                                  <span className="flex items-center text-amber-500 gap-0.5">
                                    ★ {itemReview.rating}
                                  </span>
                                  <button 
                                    onClick={() => handleOpenEditReview(itemReview, o, i)}
                                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1 font-extrabold transition-colors cursor-pointer"
                                    title="Edit Review"
                                  >
                                    <Edit3 size={11} /> Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteReview(itemReview._id)}
                                    className="text-red-500 hover:text-red-600 flex items-center gap-1 font-extrabold transition-colors cursor-pointer"
                                    title="Delete Review"
                                  >
                                    <Trash2 size={11} /> Delete
                                  </button>
                                </div>
                              );
                            } else {
                              return (
                                <button
                                  onClick={() => handleOpenWriteReview(o, i)}
                                  className="text-brand-600 hover:text-brand-700 hover:underline text-xs font-black uppercase tracking-wider flex items-center gap-1 bg-white border border-slate-100 px-2.5 py-0.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                                >
                                  Write Review
                                </button>
                              );
                            }
                          })()}
                        </div>
                      </div>
                      <p className="font-bold text-slate-900 text-lg">₹{i.price * i.qty}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-6">
                  <div>
                    <p className="text-slate-500 font-medium text-sm">Payment Method</p>
                    <p className="text-slate-900 font-bold">{o.paymentMethod || "COD"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 font-medium text-sm mb-1">Total Amount</p>
                    <h3 className="text-3xl font-black text-brand-600">₹{o.total}</h3>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* ── WRITE/EDIT REVIEW MODAL ── */}
      <AnimatePresence>
        {reviewModalOpen && selectedFoodItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden flex flex-col p-6 sm:p-8"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingReviewId ? "Edit Review" : "Write Review"}
                </h3>
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Item</h4>
                  <p className="font-bold text-slate-800 text-lg">{selectedFoodItem.name}</p>
                </div>

                {/* Rating selection */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Your Rating</h4>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform active:scale-90 text-yellow-400 focus:outline-none"
                      >
                        <Star
                          size={36}
                          fill={star <= rating ? "currentColor" : "none"}
                          className={star <= rating ? "text-amber-500" : "text-slate-200"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text selection */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Review Comment</h4>
                  <textarea
                    placeholder="Tell us what you loved or how we can improve this dish..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="mt-8 flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setReviewModalOpen(false)}
                  className="flex-1 rounded-2xl py-3.5"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!reviewText.trim()}
                  onClick={handleSubmitReview}
                  className="flex-1 rounded-2xl py-3.5 shadow-brand-500/20"
                >
                  Submit
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
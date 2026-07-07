import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ArrowRight, ShieldCheck, Ticket, Plus, Minus, ShoppingBag } from "lucide-react";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";

/**
 * Cart Component
 * 
 * Manages the shopping cart lifecycle, allowing users to modify item quantities,
 * remove items, apply promotional coupon codes, and see order cost summaries before checking out.
 */
export default function Cart() {
  const navigate = useNavigate();

  /* --- STATE DECLARATIONS --- */
  const [cart, setCart] = useState([]);
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  /* --- DATA FETCHING & EFFECTS --- */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(data);
    
    fetch(`${getApiUrl()}/api/settings`)
      .then(res => res.json())
      .then(settings => {
        setIsStoreOpen(settings.isStoreOpen !== false);
      })
      .catch(err => console.error("Error loading store settings in cart", err));
  }, []);

  /* --- EVENT HANDLERS & HELPERS --- */
  const updateQty = (id, type) => {
    let alertShown = false;
    const updated = cart.map((item) => {
      if (item._id === id) {
        if (type === "inc") {
          const maxAvailable = item.availableQty !== undefined ? item.availableQty : 10;
          if (item.qty >= maxAvailable) {
            alert(`Sorry, hmare pass ${item.name || item.baseName} ke sirf ${maxAvailable} hi available h.`);
            alertShown = true;
            return item;
          }
          return { ...item, qty: item.qty + 1 };
        } else {
          return { ...item, qty: Math.max(1, item.qty - 1) };
        }
      }
      return item;
    });
    if (alertShown) return;
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const removeItem = (id) => {
    const updated = cart.filter((item) => item._id !== id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const applyPromo = async () => {
    if (!promo) return;
    setPromoLoading(true);
    try {
      const token = await getToken();
      const subtotalNow = cart.reduce((sum, item) => sum + (Number(item.price || 0) + Number(item.packingCharge || 0)) * item.qty, 0);
      const res = await fetch(`${getApiUrl()}/api/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: promo, cartTotal: subtotalNow })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.message || "Invalid promo code.");
        setDiscount(0);
      } else {
        if (data.coupon.discountType === "percentage") {
          setDiscount(data.coupon.discountValue / 100);
        } else {
          setDiscount(data.coupon.discountValue / subtotalNow);
        }
        alert("Promo code applied successfully!");
      }
    } catch (err) {
      alert("Error applying promo code");
      setDiscount(0);
    } finally {
      setPromoLoading(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0);
  const packingCharges = cart.reduce((sum, item) => sum + Number(item.packingCharge || 0) * item.qty, 0);
  const discountAmount = subtotal * discount;
  const delivery = 40; 
  const total = subtotal + packingCharges - discountAmount + delivery;

  // Smooth layout / hover transition settings
  const smoothTransition = { type: "spring", stiffness: 300, damping: 28 };

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 px-3 sm:px-4">
      
      {/* --- CART HEADER SECTION --- */}
      <motion.div 
        initial={{ opacity: 0, y: -12 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={smoothTransition}
        className="mb-4 md:mb-6 flex items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            My Cart
          </h1>
        </div>
        {cart.length > 0 && (
          <Button variant="ghost" onClick={() => navigate('/user/menu')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 py-1.5 px-3 text-xs rounded-xl">
            <Plus size={12} className="mr-1" /> Add Items
          </Button>
        )}
      </motion.div>

      {/* --- CART CONTENT CONDITION --- */}
      {cart.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={smoothTransition}
        >
          <Card className="p-6 sm:p-10 text-center flex flex-col items-center border-slate-100 dark:border-slate-800/60 rounded-2xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">Your cart is feeling light</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 max-w-xs text-xs sm:text-sm font-medium">Looks like you haven't added anything to your cart yet.</p>
            <Button onClick={() => navigate('/user/menu')} className="gap-2 px-5 py-2 text-xs sm:text-sm rounded-full">
              Browse Menu <ArrowRight size={14} />
            </Button>
          </Card>
        </motion.div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* --- CART ITEMS LIST SECTION --- */}
          <div className="flex-1 space-y-3">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div 
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  transition={smoothTransition}
                >
                  <Card hover className="p-3 flex items-center gap-3 sm:gap-4 group border-slate-100 dark:border-slate-800/60 rounded-xl sm:rounded-2xl">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 p-1 group-hover:scale-102 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                    />

                    <div className="flex-1 text-left min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-0.5 group-hover:text-brand-600 transition-colors line-clamp-1 leading-tight">{item.name}</h3>
                      <p className="text-slate-900 dark:text-white font-extrabold text-xs sm:text-sm mb-1.5">₹{item.price}</p>
                      
                      {/* Qty controls */}
                      <div className="flex items-center justify-start">
                        <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shadow-sm">
                          <button onClick={() => updateQty(item._id, "dec")} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all"><Minus size={11} /></button>
                          <span className="w-6 text-center font-bold text-xs text-slate-900 dark:text-white">{item.qty}</span>
                          <button onClick={() => updateQty(item._id, "inc")} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all"><Plus size={11} /></button>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2 border-l border-slate-100 dark:border-slate-800 pl-3">
                      <span className="text-sm sm:text-base font-black text-slate-950 dark:text-white tabular-nums">₹{item.price * item.qty}</span>
                      <button onClick={() => removeItem(item._id)} className="w-7 h-7 flex items-center justify-center text-red-500 hover:text-white bg-red-50 dark:bg-red-950/30 hover:bg-red-500 rounded-lg transition-all" title="Remove">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* --- CHECKOUT SIDEBAR SUMMARY PANEL --- */}
          <div className="w-full lg:w-[350px] shrink-0">
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ ...smoothTransition, delay: 0.05 }}
              className="space-y-4"
            >
              {/* --- PROMO CODE CARD --- */}
              <Card className="p-3.5 border-slate-100 dark:border-slate-800/60 rounded-xl">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5 text-xs"><Ticket size={15} className="text-brand-500" /> Have a Promo Code?</h3>
                <div className="flex gap-2">
                  <Input 
                    type="text" 
                    value={promo}
                    onChange={e => setPromo(e.target.value.toUpperCase())}
                    placeholder="SAVE20" 
                    className="font-bold tracking-widest bg-slate-50 dark:bg-slate-950 py-1.5 text-xs rounded-xl"
                  />
                  <Button onClick={applyPromo} variant="secondary" className="px-3 text-xs rounded-xl" disabled={promoLoading}>
                    {promoLoading ? "..." : "Apply"}
                  </Button>
                </div>
              </Card>

              {/* --- RECEIPT CALCULATOR CARD --- */}
              <Card className="p-4 relative overflow-hidden border-slate-100 dark:border-slate-800/60 rounded-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-brand-600"></div>
                
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 text-center">Receipt Summary</h3>
                
                <div className="space-y-2.5 mb-3 text-xs text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <div className="flex justify-between items-center">
                    <span>Subtotal ({cart.length} items)</span>
                    <span className="text-slate-900 dark:text-white font-bold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-100/30">
                      <span className="flex items-center gap-1"><Ticket size={12} /> Discount Applied</span>
                      <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {packingCharges > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Packing Charges</span>
                      <span className="text-slate-900 dark:text-white font-bold">₹{packingCharges.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span>Delivery Estimate</span>
                    <span className="text-slate-900 dark:text-white font-bold">₹{delivery.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Total To Pay</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">₹{total.toFixed(2)}</span>
                </div>

                <Button
                  disabled={!isStoreOpen}
                  onClick={() => {
                    navigate("/user/checkout");
                  }}
                  className="w-full gap-1.5 rounded-xl py-2.5 text-xs font-bold shadow-brand-500/20"
                >
                  <ShieldCheck size={14} />
                  {isStoreOpen ? "Checkout Securely" : "Shop is Closed"}
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}


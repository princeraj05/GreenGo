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
  // cart: Holds the current array of products, quantities, prices, etc. from localStorage
  const [cart, setCart] = useState([]);
  // promo: Tracks the text input for the promotional discount code
  const [promo, setPromo] = useState("");
  // discount: Stores the discount ratio/multiplier applied to the subtotal
  const [discount, setDiscount] = useState(0);
  // promoLoading: Controls the loader state during API validation of a promo coupon
  const [promoLoading, setPromoLoading] = useState(false);

  /* --- DATA FETCHING & EFFECTS --- */
  // Reads and populates the cart from local storage on component mount
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(data);
  }, []);

  /* --- EVENT HANDLERS & HELPERS --- */
  /**
   * updateQty: Increments or decrements quantity for a specific item,
   * updates the local state and localStorage, and triggers a window synchronizing event.
   */
  const updateQty = (id, type) => {
    const updated = cart.map((item) =>
      item._id === id
        ? { ...item, qty: type === "inc" ? item.qty + 1 : Math.max(1, item.qty - 1) }
        : item
    );
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
  };

  /**
   * removeItem: Deletes a specific item ID from the cart list,
   * updates localStorage, and notifies other components via the window event.
   */
  const removeItem = (id) => {
    const updated = cart.filter((item) => item._id !== id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
  };

  /**
   * applyPromo: Contacts the API to validate the discount code based on current cart subtotal
   */
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

  /* --- PRICE CALCULATION COMPUTATIONS --- */
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0);
  const packingCharges = cart.reduce((sum, item) => sum + Number(item.packingCharge || 0) * item.qty, 0);
  const discountAmount = subtotal * discount;
  const delivery = 40; 
  const total = subtotal + packingCharges - discountAmount + delivery;

  return (
    /* --- MAIN PAGE CONTAINER --- */
    /* Tailwind: max-w-6xl mx-auto sets standard content width limits with horizontal centering. pb-24 handles padding for mobile viewports */
    <div className="max-w-6xl mx-auto w-full pb-24 md:pb-10 px-1 sm:px-0">
      
      {/* --- CART HEADER SECTION --- */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            My Cart
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base md:text-lg font-medium">Review your items before proceeding to checkout.</p>
        </div>
        {cart.length > 0 && (
          <Button variant="ghost" onClick={() => navigate('/user/menu')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 py-2.5 px-4 text-sm">
            <Plus size={14} className="mr-2" /> Add More Items
          </Button>
        )}
      </motion.div>

      {/* --- CART CONTENT CONDITION --- */}
      {cart.length === 0 ? (
        
        /* --- EMPTY CART VIEW --- */
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-8 sm:p-12 md:p-16 text-center flex flex-col items-center border-slate-100 dark:border-slate-800/60 rounded-3xl md:rounded-[2.5rem]">
            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center mb-6 md:mb-8">
              <ShoppingBag className="w-10 h-10 sm:w-14 sm:h-14" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 md:mb-4">Your cart is feeling light</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 md:mb-8 max-w-sm text-sm sm:text-base font-medium">Looks like you haven't added anything to your cart yet. Let's get some food!</p>
            <Button onClick={() => navigate('/user/menu')} className="gap-2 px-6 py-2.5 text-sm md:px-8 md:py-3.5 md:text-base rounded-full">
              Browse Menu <ArrowRight size={16} />
            </Button>
          </Card>
        </motion.div>
      ) : (
        
        /* --- ACTIVE CART VIEW --- */
        /* Tailwind: flex-col on mobile, flex-row on desktop (lg breakpoint) allows layout transition with customizable side gutter gaps */
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          
          {/* --- CART ITEMS LIST SECTION --- */}
          <div className="flex-1 space-y-4">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div 
                  key={item._id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                >
                  <Card hover className="p-3 sm:p-4 md:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 md:gap-6 group border-slate-100 dark:border-slate-800/60 rounded-2xl md:rounded-3xl">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 shrink-0 object-contain rounded-2xl bg-slate-50 dark:bg-slate-800 shadow-inner p-1.5 md:p-2 group-hover:scale-105 transition-transform"
                      onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                    />

                    <div className="flex-1 text-left min-w-0">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-0.5 md:mb-1 group-hover:text-brand-600 transition-colors line-clamp-2 leading-tight">{item.name}</h3>
                      <p className="text-slate-900 dark:text-white font-black text-sm sm:text-lg md:text-xl mb-2 md:mb-4">₹{item.price}</p>
                      
                      {/* --- ITEM QUANTITY CONTROL INNER PANEL --- */}
                      <div className="flex items-center justify-start gap-2 sm:gap-4">
                        <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 md:p-1 shadow-sm">
                          <button onClick={() => updateQty(item._id, "dec")} className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm text-slate-700 dark:text-slate-300 font-bold transition-all"><Minus size={14} /></button>
                          <span className="w-8 sm:w-10 md:w-12 text-center font-bold text-xs sm:text-sm md:text-base text-slate-900 dark:text-white">{item.qty}</span>
                          <button onClick={() => updateQty(item._id, "inc")} className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm text-slate-700 dark:text-slate-300 font-bold transition-all"><Plus size={14} /></button>
                        </div>
                      </div>
                    </div>

                    </div>

                    {/* --- TOTAL PRICE & REMOVE ITEM ACTION --- */}
                    <div className="shrink-0 flex sm:flex-col justify-between sm:justify-center items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                      <span className="text-base sm:text-lg font-black text-slate-950 dark:text-white tabular-nums">₹{item.price * item.qty}</span>
                      <button onClick={() => removeItem(item._id)} className="w-9 h-9 md:w-12 md:h-12 flex items-center justify-center text-red-500 hover:text-white bg-red-50 dark:bg-red-950/30 hover:bg-red-500 dark:hover:bg-red-600 rounded-xl md:rounded-2xl transition-all shadow-sm" title="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* --- CHECKOUT SIDEBAR SUMMARY PANEL --- */}
          {/* Tailwind: sticky top-24 makes this summary card stick to top when scrolling down on larger viewports */}
          <div className="w-full lg:w-[400px] shrink-0 sticky top-24 h-fit">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              
              {/* --- PROMO CODE CARD --- */}
              <Card className="p-4 md:p-6 mb-4 md:mb-6 border-slate-100 dark:border-slate-800/60 rounded-2xl">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm md:text-base"><Ticket size={18} className="text-brand-500" /> Have a Promo Code?</h3>
                <div className="flex gap-2">
                  <Input 
                    type="text" 
                    value={promo}
                    onChange={e => setPromo(e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE20" 
                    className="font-bold tracking-widest bg-slate-50 dark:bg-slate-950 py-2 text-sm"
                  />
                  <Button onClick={applyPromo} variant="secondary" className="px-4 text-sm" disabled={promoLoading}>
                    {promoLoading ? "..." : "Apply"}
                  </Button>
                </div>
              </Card>

              {/* --- RECEIPT CALCULATOR CARD --- */}
              <Card className="p-5 md:p-8 relative overflow-hidden border-slate-100 dark:border-slate-800/60 rounded-3xl md:rounded-[2rem]">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-400 to-brand-600"></div>
                
                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-4 md:mb-6 text-center">Receipt Summary</h3>
                
                <div className="space-y-3 md:space-y-4 mb-4 md:mb-6 text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800/60 pb-4 md:pb-6">
                  <div className="flex justify-between items-center">
                    <span>Subtotal ({cart.length} items)</span>
                    <span className="text-slate-900 dark:text-white font-bold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl -mx-2 px-2.5 border border-emerald-100/50 dark:border-emerald-950/30">
                      <span className="flex items-center gap-1.5"><Ticket size={14} /> Discount Applied</span>
                      <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {packingCharges > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Packing Charges</span>
                      <span className="text-slate-900 dark:text-white font-bold">â‚¹{packingCharges.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span>Delivery Estimate</span>
                    <span className="text-slate-900 dark:text-white font-bold">₹{delivery.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <span className="text-base md:text-lg font-bold text-slate-900 dark:text-white">Total To Pay</span>
                  <span className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">₹{total.toFixed(2)}</span>
                </div>

                <Button
                  onClick={() => navigate("/user/checkout")}
                  className="w-full gap-2 rounded-full py-3.5 text-sm md:text-base font-bold shadow-brand-500/25"
                >
                  <ShieldCheck size={18} />
                  Checkout Securely
                </Button>
              </Card>
              
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}


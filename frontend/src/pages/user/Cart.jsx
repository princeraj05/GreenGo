import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ArrowRight, ShieldCheck, Ticket, Plus, Minus, ShoppingBag } from "lucide-react";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(data);
  }, []);

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
      const subtotalNow = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = subtotal * discount;
  const delivery = 40; 
  const total = subtotal - discountAmount + delivery;

  return (
    <div className="max-w-6xl mx-auto w-full pb-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            My Cart
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium">Review your items before proceeding to checkout.</p>
        </div>
        {cart.length > 0 && (
          <Button variant="ghost" onClick={() => navigate('/user/menu')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Plus size={16} className="mr-2" /> Add More Items
          </Button>
        )}
      </motion.div>

      {cart.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-16 text-center flex flex-col items-center border-slate-100 dark:border-slate-800/60 rounded-[2.5rem]">
            <div className="w-32 h-32 bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center mb-8">
              <ShoppingBag size={64} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Your cart is feeling light</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-lg font-medium">Looks like you haven't added anything to your cart yet. Let's get some food!</p>
            <Button onClick={() => navigate('/user/menu')} size="lg" className="gap-2 px-8 rounded-full">
              Browse Menu <ArrowRight size={20} />
            </Button>
          </Card>
        </motion.div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Cart Items */}
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
                  <Card hover className="p-4 md:p-6 flex flex-col sm:flex-row items-center gap-6 group border-slate-100 dark:border-slate-800/60">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-28 h-28 object-contain rounded-[1.25rem] bg-slate-50 dark:bg-slate-800 shadow-inner p-2 group-hover:scale-105 transition-transform"
                      onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                    />

                    <div className="flex-1 text-center sm:text-left w-full">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-brand-600 transition-colors">{item.name}</h3>
                      <p className="text-slate-900 dark:text-white font-black text-xl mb-4">₹{item.price}</p>
                      
                      <div className="flex items-center justify-center sm:justify-start gap-4">
                        <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
                          <button onClick={() => updateQty(item._id, "dec")} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm text-slate-700 dark:text-slate-300 font-bold transition-all"><Minus size={16} /></button>
                          <span className="w-12 text-center font-bold text-slate-900 dark:text-white">{item.qty}</span>
                          <button onClick={() => updateQty(item._id, "inc")} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm text-slate-700 dark:text-slate-300 font-bold transition-all"><Plus size={16} /></button>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex justify-center sm:justify-end">
                      <button onClick={() => removeItem(item._id)} className="w-12 h-12 flex items-center justify-center text-red-500 hover:text-white bg-red-50 dark:bg-red-950/30 hover:bg-red-500 dark:hover:bg-red-600 rounded-2xl transition-all shadow-sm" title="Remove">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Checkout Summary */}
          <div className="w-full lg:w-[420px] shrink-0 sticky top-24 h-fit">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              
              <Card className="p-6 mb-6 border-slate-100 dark:border-slate-800/60">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Ticket size={20} className="text-brand-500" /> Have a Promo Code?</h3>
                <div className="flex gap-2">
                  <Input 
                    type="text" 
                    value={promo}
                    onChange={e => setPromo(e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE20" 
                    className="font-bold tracking-widest bg-slate-50 dark:bg-slate-950"
                  />
                  <Button onClick={applyPromo} variant="secondary" className="px-6" disabled={promoLoading}>
                    {promoLoading ? "..." : "Apply"}
                  </Button>
                </div>
              </Card>

              <Card className="p-8 relative overflow-hidden border-slate-100 dark:border-slate-800/60 rounded-[2rem]">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-400 to-brand-600"></div>
                
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 text-center">Receipt Summary</h3>
                
                <div className="space-y-4 mb-6 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800/60 pb-6">
                  <div className="flex justify-between items-center">
                    <span>Subtotal ({cart.length} items)</span>
                    <span className="text-slate-900 dark:text-white font-bold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl -mx-3 px-3 border border-emerald-100/50 dark:border-emerald-950/30">
                      <span className="flex items-center gap-2"><Ticket size={16} /> Discount Applied</span>
                      <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span>Delivery Estimate</span>
                    <span className="text-slate-900 dark:text-white font-bold">₹{delivery.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-8">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">Total To Pay</span>
                  <span className="text-4xl font-black text-slate-900 dark:text-white">₹{total.toFixed(2)}</span>
                </div>

                <Button
                  onClick={() => navigate("/user/checkout")}
                  size="lg"
                  className="w-full gap-2 rounded-full py-5 text-lg shadow-brand-500/25"
                >
                  <ShieldCheck size={22} />
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
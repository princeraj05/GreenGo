import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);

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
  };

  const removeItem = (id) => {
    const updated = cart.filter((item) => item._id !== id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const applyPromo = async () => {
    if (!promo) return;
    try {
      const token = await getToken();
      const subtotalNow = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/coupons/validate`, {
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
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = subtotal * discount;
  const delivery = 40; // Simulated delivery, checkout page handles true delivery
  const total = subtotal - discountAmount + delivery;

  return (
    <div className="max-w-6xl mx-auto w-full animate-fade-in pb-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            My Cart
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Review your items before proceeding to checkout.</p>
        </div>
        {cart.length > 0 && (
          <Button variant="ghost" onClick={() => navigate('/user/menu')}>
            + Add More Items
          </Button>
        )}
      </div>

      {cart.length === 0 ? (
        <Card className="p-16 text-center flex flex-col items-center">
          <div className="w-40 h-40 bg-brand-50 rounded-full flex items-center justify-center mb-6">
            <span className="text-6xl block">🥡</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3">Your cart is feeling light</h2>
          <p className="text-slate-500 mb-8 max-w-sm">Looks like you haven't added anything to your cart yet. Let's get some food!</p>
          <Button onClick={() => navigate('/user/menu')} className="gap-2 px-8 py-4">
            Browse Menu 
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 space-y-4">
            {cart.map((item) => (
              <Card key={item._id} hover={true} className="p-4 md:p-6 flex flex-col sm:flex-row items-center gap-6 group">
                <img
                  src={item.image?.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/${item.image}`}
                  alt={item.name}
                  className="w-28 h-28 object-cover rounded-2xl bg-slate-100 shadow-inner group-hover:scale-105 transition-transform"
                />

                <div className="flex-1 text-center sm:text-left w-full">
                  <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-brand-500 transition-colors">{item.name}</h3>
                  <p className="text-brand-500 font-black text-lg mb-4">₹{item.price}</p>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-4">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                      <button onClick={() => updateQty(item._id, "dec")} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-700 font-bold transition-all">−</button>
                      <span className="w-12 text-center font-bold text-slate-900">{item.qty}</span>
                      <button onClick={() => updateQty(item._id, "inc")} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-700 font-bold transition-all">+</button>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex justify-center sm:justify-end">
                  <button onClick={() => removeItem(item._id)} className="w-12 h-12 flex items-center justify-center text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl transition-all" title="Remove">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <div className="w-full lg:w-[400px] shrink-0 sticky top-24 h-fit">
            {/* Promo Code Box */}
            <Card className="p-6 mb-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">🎟️ Have a Promo Code?</h3>
              <div className="flex gap-2">
                <Input 
                  type="text" 
                  value={promo}
                  onChange={e=>setPromo(e.target.value)}
                  placeholder="e.g. SAVE20" 
                  className="uppercase"
                />
                <Button onClick={applyPromo} variant="secondary">Apply</Button>
              </div>
            </Card>

            {/* Receipt UI */}
            <Card className="p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-brand-600"></div>
              
              <h3 className="text-xl font-black text-slate-900 mb-6 text-center">Receipt Summary</h3>
              
              <div className="space-y-4 mb-6 text-slate-600 font-medium border-b border-slate-100 pb-6">
                <div className="flex justify-between items-center">
                  <span>Subtotal ({cart.length} items)</span>
                  <span className="text-slate-900 font-bold">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 bg-emerald-50 p-2 rounded-lg -mx-2 px-2">
                    <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg> Discount</span>
                    <span className="font-bold">-₹{discountAmount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Delivery Estimate</span>
                  <span className="text-slate-900 font-bold">₹{delivery}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-8">
                <span className="text-xl font-bold text-slate-900">Total To Pay</span>
                <span className="text-4xl font-black text-brand-500">₹{total.toFixed(0)}</span>
              </div>

              <Button
                onClick={() => navigate("/user/checkout")}
                className="w-full py-4 text-lg gap-2"
              >
                Checkout Securely
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
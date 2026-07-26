import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ArrowRight, ShieldCheck, Ticket, Plus, Minus, ShoppingBag } from "lucide-react";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const getSlabAmount = (slabs = [], distance = null, fallback = 0, isCod = false) => {
  const km = Number(distance || 0);
  const sortedSlabs = Array.isArray(slabs)
    ? slabs
        .map((slab) => ({
          upToKm: Number(slab?.upToKm || 0),
          amount: Number(slab?.amount || 0),
          cod: slab?.cod !== undefined ? Boolean(slab.cod) : true,
          online: slab?.online !== undefined ? Boolean(slab.online) : true
        }))
        .filter((slab) => {
          if (slab.upToKm <= 0) return false;
          return isCod ? slab.cod : slab.online;
        })
        .sort((a, b) => a.upToKm - b.upToKm)
    : [];
  if (!sortedSlabs.length || !Number.isFinite(km) || km <= 0) return Number(fallback || 0);
  const matchedSlab = sortedSlabs.find((slab) => km <= slab.upToKm) || sortedSlabs[sortedSlabs.length - 1];
  return Number(matchedSlab?.amount || 0);
};

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
  const [promoLoading, setPromoLoading] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [promoMinOrder, setPromoMinOrder] = useState(0);
  const [promoDiscountType, setPromoDiscountType] = useState("");
  const [promoDiscountValue, setPromoDiscountValue] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [deliveryCharge, setDeliveryCharge] = useState(40);
  const [settings, setSettings] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [address, setAddress] = useState("");

  /* --- DATA FETCHING & EFFECTS --- */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(data);
    
    fetch(`${getApiUrl()}/api/settings`)
      .then(res => res.json())
      .then(settingsData => {
        setSettings(settingsData);
        setIsStoreOpen(settingsData.isStoreOpen !== false);
      })
      .catch(err => console.error("Error loading store settings in cart", err));

    const token = getToken();
    if (token) {
      fetch(`${getApiUrl()}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(userData => {
        if (userData) {
          const savedAddress = userData.deliveryDetails?.address || userData.address || "";
          const finalAddress = savedAddress || localStorage.getItem("guest_address") || "";
          if (finalAddress) setAddress(finalAddress);
        }
      })
      .catch(err => console.error("Could not fetch user in cart", err));
    } else {
      const finalAddress = localStorage.getItem("guest_address") || "";
      if (finalAddress) setAddress(finalAddress);
    }

    if (token) {
      fetch(`${getApiUrl()}/api/coupons/active`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(couponsData => {
        if (Array.isArray(couponsData)) {
          setAvailableCoupons(couponsData);
        }
      })
      .catch(err => console.error("Error fetching active coupons", err));
    }

    // Auto-load saved promo from localStorage on page mount
    const savedPromo = localStorage.getItem("applied_promo");
    if (savedPromo && data.length > 0) {
      setPromo(savedPromo);
      const subtotalNow = data.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0);
      if (token) {
        fetch(`${getApiUrl()}/api/coupons/validate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ code: savedPromo.trim().toUpperCase(), cartTotal: subtotalNow })
        })
        .then(res => {
          if (res.ok) return res.json();
          localStorage.removeItem("applied_promo");
          return null;
        })
        .then(resData => {
          if (resData && resData.coupon) {
            setAppliedPromoCode(resData.coupon.code);
            setPromoMinOrder(resData.coupon.minimumOrder || 0);
            setPromoDiscountType(resData.coupon.discountType);
            setPromoDiscountValue(resData.coupon.discountValue);
          }
        })
        .catch(err => console.error("Error auto-validating promo code on mount", err));
      }
    }
  }, []);

  // Requests browser geolocation permissions
  useEffect(() => {
    if (!navigator.geolocation || userCoords) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.warn("Fast geolocation retrieval failed in cart:", error.message);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            });
          },
          (err) => console.error("High accuracy fallback geolocation failed in cart:", err.message),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: false, timeout: 2000, maximumAge: 300000 }
    );
  }, [userCoords]);

  const updateDeliveryChargeByDistance = (settingsData, distance) => {
    const nextCharge = (settingsData?.isDeliveryChargeEnabled !== false)
      ? getSlabAmount(settingsData.deliveryChargeSlabs, distance, settingsData.deliveryChargeAmount, false)
      : 0;
    setDeliveryCharge(nextCharge);
    return nextCharge;
  };

  // Recalculates delivery fee once store settings, user coordinates, address are loaded/changed
  useEffect(() => {
    if (!settings) return;

    let lat = userCoords?.latitude;
    let lon = userCoords?.longitude;

    if (address) {
      const latLngRegex = /Lat:\s*([-\d.]+),\s*Lng:\s*([-\d.]+)/i;
      const match = address.match(latLngRegex);
      if (match) {
        lat = parseFloat(match[1]);
        lon = parseFloat(match[2]);
      }
    }

    if (lat !== undefined && lat !== null && lon !== undefined && lon !== null) {
      const dist = calculateHaversineDistance(
        settings.storeLatitude,
        settings.storeLongitude,
        lat,
        lon
      );
      updateDeliveryChargeByDistance(settings, dist);
    } else {
      const fallbackCharge = (settings.isDeliveryChargeEnabled !== false)
        ? Number(settings.deliveryChargeAmount || 0)
        : 0;
      setDeliveryCharge(fallbackCharge);
    }
  }, [settings, userCoords, address]);

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

  const applyPromo = async (codeToApply) => {
    const codeVal = typeof codeToApply === "string" ? codeToApply : promo;
    const cleanPromo = codeVal.trim().toUpperCase();
    if (!cleanPromo) return;
    setPromoLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${getApiUrl()}/api/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: cleanPromo, cartTotal: subtotal })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.message || "Invalid promo code.");
        setAppliedPromoCode("");
        setPromoMinOrder(0);
        setPromoDiscountType("");
        setPromoDiscountValue(0);
        localStorage.removeItem("applied_promo");
      } else {
        setAppliedPromoCode(data.coupon.code);
        setPromoMinOrder(data.coupon.minimumOrder || 0);
        setPromoDiscountType(data.coupon.discountType);
        setPromoDiscountValue(data.coupon.discountValue);
        localStorage.setItem("applied_promo", data.coupon.code);
        alert("Promo code applied successfully!");
      }
    } catch (err) {
      alert("Error applying promo code");
      setAppliedPromoCode("");
      setPromoMinOrder(0);
      setPromoDiscountType("");
      setPromoDiscountValue(0);
      localStorage.removeItem("applied_promo");
    } finally {
      setPromoLoading(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0);
  const packingCharges = cart.reduce((sum, item) => sum + Number(item.packingCharge || 0) * item.qty, 0);
  const delivery = deliveryCharge; 
  
  // Calculate dynamic discount amount
  let discountAmount = 0;
  if (appliedPromoCode) {
    if (promoDiscountType === "percentage") {
      discountAmount = Math.round((subtotal * promoDiscountValue) / 100);
    } else {
      discountAmount = promoDiscountValue;
    }
  }
  const total = subtotal + packingCharges - discountAmount + delivery;

  // Monitor subtotal to dynamically remove applied coupon if subtotal falls below minOrder
  useEffect(() => {
    if (appliedPromoCode && subtotal > 0) {
      if (subtotal < promoMinOrder) {
        setAppliedPromoCode("");
        setPromoMinOrder(0);
        setPromoDiscountType("");
        setPromoDiscountValue(0);
        localStorage.removeItem("applied_promo");
        alert(`Promo code ${appliedPromoCode} removed because subtotal is now less than ₹${promoMinOrder}.`);
      }
    }
  }, [subtotal, appliedPromoCode, promoMinOrder]);

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
                  <Button onClick={() => applyPromo()} variant="secondary" className="px-3 text-xs rounded-xl" disabled={promoLoading}>
                    {promoLoading ? "..." : "Apply"}
                  </Button>
                </div>
                {availableCoupons.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Available Coupons</p>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                      {availableCoupons.map((coupon) => {
                        const isApplied = appliedPromoCode === coupon.code;
                        const isMinOrderSatisfied = subtotal >= (coupon.minimumOrder || 0);
                        
                        return (
                          <div 
                            key={coupon._id}
                            onClick={() => {
                              setPromo(coupon.code);
                              applyPromo(coupon.code);
                            }}
                            className={`group relative p-2.5 rounded-xl border border-dashed transition-all duration-200 cursor-pointer ${
                              isApplied 
                                ? "bg-brand-500/10 border-brand-500 dark:bg-brand-500/5" 
                                : isMinOrderSatisfied 
                                  ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500" 
                                  : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/40 opacity-60"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black tracking-wider transition-colors ${
                                isApplied 
                                  ? "bg-brand-500 text-white" 
                                  : "bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 group-hover:bg-brand-500 group-hover:text-white"
                              }`}>
                                {coupon.code}
                              </span>
                              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
                                {coupon.discountValue}{coupon.discountType === "percentage" ? "%" : " ₹"} OFF
                              </span>
                            </div>
                            <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-200 mt-1.5 transition-colors group-hover:text-brand-500">
                              {coupon.title}
                            </h4>
                            {coupon.minimumOrder > 0 && (
                              <p className={`text-[9px] font-bold mt-1 ${isMinOrderSatisfied ? "text-slate-400 dark:text-slate-500" : "text-red-500"}`}>
                                Min order: ₹{coupon.minimumOrder} {!isMinOrderSatisfied && `(Add ₹${(coupon.minimumOrder - subtotal).toFixed(0)} more)`}
                              </p>
                            )}
                            
                            <div className="absolute right-2.5 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <span className="text-[9px] font-black text-brand-500">
                                Apply
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                  {discountAmount > 0 && (
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


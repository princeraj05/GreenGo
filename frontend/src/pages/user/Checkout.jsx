import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, CreditCard, Banknote, Smartphone, CheckCircle, Navigation, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { cn } from "../../utils/cn";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";

/* --- HELPER FUNCTIONS --- */

/**
 * calculateHaversineDistance: Computes the great-circle distance between two points on a sphere 
 * using their latitudes and longitudes.
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * getSlabAmount: Matches the computed distance with delivery charge distance slabs 
 * to determine the applicable delivery fee.
 */
const getSlabAmount = (slabs = [], distance = null, fallback = 0) => {
  const km = Number(distance || 0);
  const sortedSlabs = Array.isArray(slabs)
    ? slabs
        .map((slab) => ({ upToKm: Number(slab?.upToKm || 0), amount: Number(slab?.amount || 0) }))
        .filter((slab) => slab.upToKm > 0)
        .sort((a, b) => a.upToKm - b.upToKm)
    : [];
  if (!sortedSlabs.length || !Number.isFinite(km) || km <= 0) return Number(fallback || 0);
  const matchedSlab = sortedSlabs.find((slab) => km <= slab.upToKm) || sortedSlabs[sortedSlabs.length - 1];
  return Number(matchedSlab?.amount || 0);
};

/**
 * Checkout Component
 * 
 * Manages order review, customer address / contact input, GPS-based delivery fee calculations,
 * and payment integration with COD and Razorpay secure payment gateway.
 */
export default function Checkout() {
  const navigate = useNavigate();

  /* --- STATE DECLARATIONS --- */
  // cart: Stores the items currently placed in the user's cart
  const [cart, setCart] = useState([]);
  // address: Delivery address string, updated manually or via reverse-geocoding
  const [address, setAddress] = useState("");
  // phone: User contact number
  const [phone, setPhone] = useState("");
  // paymentMethod: Selected option for transaction ("UPI", "COD", or "Card")
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  // customMessage: Cooking instructions or delivery notes written by the customer
  const [customMessage, setCustomMessage] = useState("");
  // deliveryCharge: Standard or slab-calculated fee for delivering the order
  const [deliveryCharge, setDeliveryCharge] = useState(40);
  // settings: General store configurations fetched from backend API (e.g. coordinates, distance limit)
  const [settings, setSettings] = useState(null);
  // loading: Disables interactive elements and shows spinner during checkout submission
  const [loading, setLoading] = useState(false);
  // locationLoading: Loader state for GPS location fetching & reverse geocoding
  const [locationLoading, setLocationLoading] = useState(false);
  // userCoords: Stores latitude & longitude of the customer's browser location
  const [userCoords, setUserCoords] = useState(null);
  // profileDeliveryReady: Boolean indicating if user profile has phone & primary address filled
  const [profileDeliveryReady, setProfileDeliveryReady] = useState(false);

  /* --- HELPER METHOD --- */
  // Extracts the primary address text or general address from user record
  const getSavedAddressText = (userData) => {
    const primaryAddress = Array.isArray(userData?.addresses)
      ? userData.addresses.find((addr) => addr?.isPrimary) || userData.addresses[0]
      : null;
    return String(primaryAddress?.details || userData?.address || "").trim();
  };

  // Triggers alert and routes user to root route with checkout origin context if details are missing
  const redirectToLoginForDeliveryDetails = () => {
    alert("Please login first and complete your profile address before placing an order.");
    navigate("/", {
      state: {
        from: { pathname: "/user/checkout" },
        loginRequired: true,
      },
    });
  };

  /* --- DATA FETCHING & EFFECTS --- */

  // Dynamically mounts the Razorpay payment checkout script on page mount
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => console.log("Razorpay SDK loaded dynamically.");
      script.onerror = () => console.error("Failed to load Razorpay SDK.");
      document.body.appendChild(script);
    }
  }, []);

  // Loads the user cart, general store settings, and user contact/address on mount
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(data);

    fetch(`${getApiUrl()}/api/settings`)
      .then(res => res.json())
      .then(settingsData => {
        setSettings(settingsData);
        if (settingsData && settingsData.isDeliveryChargeEnabled !== undefined) {
          setDeliveryCharge(settingsData.isDeliveryChargeEnabled ? settingsData.deliveryChargeAmount : 0);
        }
      })
      .catch(err => console.error("Could not fetch settings", err));

    const loadCheckoutUser = () => {
      const token = getToken();
      if(!token) {
        navigate("/", {
          state: {
            from: { pathname: "/user/checkout" },
            loginRequired: true,
          },
        });
        return;
      }
      fetch(`${getApiUrl()}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(userData => {
        if (userData) {
          if (userData.phone) setPhone(userData.phone);
          const savedAddress = getSavedAddressText(userData);
          if (savedAddress) setAddress(savedAddress);
          setProfileDeliveryReady(Boolean(userData.phone && savedAddress));
        }
      })
      .catch(err => console.error("Could not fetch user", err));
    };

    loadCheckoutUser();
    window.addEventListener("address-updated", loadCheckoutUser);
    return () => {
      window.removeEventListener("address-updated", loadCheckoutUser);
    };
  }, [navigate]);

  // Requests browser geolocation permissions and extracts coordinates
  useEffect(() => {
    if (!navigator.geolocation || userCoords) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [userCoords]);

  // Recalculates delivery fee once both store settings and user coordinates are loaded
  useEffect(() => {
    if (!settings || !userCoords?.latitude || !userCoords?.longitude) return;
    const dist = calculateHaversineDistance(
      settings.storeLatitude,
      settings.storeLongitude,
      userCoords.latitude,
      userCoords.longitude
    );
    updateDeliveryChargeByDistance(settings, dist);
  }, [settings, userCoords]);

  /* --- PRICE CALCULATION COMPUTATIONS --- */
  const subtotal = cart.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0);
  const packingCharges = cart.reduce((s, i) => s + Number(i.packingCharge || 0) * Number(i.qty || 0), 0);
  const taxes = 0;
  const rainCharge = settings ? Number(settings.rainCharge || 0) : 0;
  const festivalCharge = settings ? Number(settings.festivalCharge || 0) : 0;
  const platformCharge = settings ? Number(settings.platformCharge || 0) : 0;
  const total = subtotal + packingCharges + deliveryCharge + taxes + rainCharge + festivalCharge + platformCharge;
  const totalItems = cart.reduce((s, i) => s + Number(i.qty || 0), 0);

  /* --- EVENT HANDLERS --- */

  /**
   * updateDeliveryChargeByDistance: Recalculates next delivery charge slab
   */
  const updateDeliveryChargeByDistance = (settingsData, distance) => {
    const nextCharge = settingsData?.isDeliveryChargeEnabled
      ? getSlabAmount(settingsData.deliveryChargeSlabs, distance, settingsData.deliveryChargeAmount)
      : 0;
    setDeliveryCharge(nextCharge);
    return nextCharge;
  };

  /**
   * syncCart: Updates local state and localStorage, firing synchronization event
   */
  const syncCart = (nextCart) => {
    if (nextCart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(nextCart));
    } else {
      localStorage.removeItem("cart");
    }
    setCart(nextCart);
    window.dispatchEvent(new Event("cart-updated"));
  };

  /**
   * updateCartQuantity: Changes the purchase volume of a single food item
   */
  const updateCartQuantity = (itemId, nextQty) => {
    const nextCart = cart
      .map((item) => item._id === itemId ? { ...item, qty: nextQty } : item)
      .filter((item) => Number(item.qty || 0) > 0);
    syncCart(nextCart);
  };

  /**
   * removeCartItem: Deletes the item from cart array completely
   */
  const removeCartItem = (itemId) => {
    syncCart(cart.filter((item) => item._id !== itemId));
  };

  /**
   * placeOrder: Processes store limits, validates delivery coordinates distance,
   * configures Razorpay options, and opens payment modal, or places COD orders.
   */
  const placeOrder = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (!profileDeliveryReady) {
      redirectToLoginForDeliveryDetails();
      return;
    }

    if (!address || !phone) {
      alert("Please fill in your delivery address and phone number.");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Please login again.");
        return;
      }

      // Check distance and coordinates first
      let lat = userCoords?.latitude;
      let lon = userCoords?.longitude;

      const latLngRegex = /Lat:\s*([-\d.]+),\s*Lng:\s*([-\d.]+)/i;
      const match = address.match(latLngRegex);
      if (match) {
        lat = parseFloat(match[1]);
        lon = parseFloat(match[2]);
      } else if (lat == null || lon == null) {
        // Fallback geocoding on frontend if coordinates not loaded yet
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
            headers: { "User-Agent": "GreenGo-FoodDelivery-App/1.0" }
          });
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lon = parseFloat(geoData[0].lon);
          }
        } catch (err) {
          console.error("Frontend geocoding error:", err);
        }
      }

      // Fetch store settings to calculate & validate distance
      const settingsRes = await fetch(`${getApiUrl()}/api/settings`);
      const settingsData = await settingsRes.json();
      let checkoutDeliveryCharge = deliveryCharge;

      if (settingsData && settingsData.isDistanceLimitEnabled && lat !== undefined && lat !== null && lon !== undefined && lon !== null) {
        const dist = calculateHaversineDistance(
          settingsData.storeLatitude,
          settingsData.storeLongitude,
          lat,
          lon
        );

        if (dist > settingsData.maxDeliveryDistance) {
          alert(`Delivery is not available. Your location is ${dist.toFixed(1)} km away, which exceeds our maximum delivery distance of ${settingsData.maxDeliveryDistance} km.`);
          setLoading(false);
          return;
        }
        checkoutDeliveryCharge = updateDeliveryChargeByDistance(settingsData, dist);
      } else if (settingsData) {
        checkoutDeliveryCharge = updateDeliveryChargeByDistance(settingsData, null);
      }

      const checkoutTotal = subtotal + packingCharges + checkoutDeliveryCharge + taxes;

      if (paymentMethod !== "COD") {
        const orderRes = await fetch(`${getApiUrl()}/api/payment/create-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: checkoutTotal }),
        });

        const orderData = await orderRes.json();

        if (!orderData.success) {
          alert("Could not initiate payment");
          setLoading(false);
          return;
        }

        const keyRes = await fetch(`${getApiUrl()}/api/payment/key`);
        const { key } = await keyRes.json();

        const options = {
          key: key,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: "GreenGo",
          description: "Premium Food Delivery Payment",
          order_id: orderData.order.id,
          handler: async function (response) {
            const verifyRes = await fetch(`${getApiUrl()}/api/payment/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await createFinalOrder(token, lat, lon, checkoutDeliveryCharge, checkoutTotal, response.razorpay_payment_id);
            } else {
              alert("Payment Verification Failed!");
              setLoading(false);
            }
          },
          prefill: { contact: phone },
          theme: { color: "#f5410f" },
        };
        const rzp1 = new window.Razorpay(options);
        
        rzp1.on('payment.failed', function (response){
          alert("Payment Failed: " + response.error.description);
          setLoading(false);
        });
        
        rzp1.open();
      } else {
        await createFinalOrder(token, lat, lon, checkoutDeliveryCharge, checkoutTotal);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Server error occurred.");
      setLoading(false);
    }
  };

  /**
   * createFinalOrder: Places order record directly in database through backend,
   * clears local cart variables, and redirects to orders history tracker.
   */
  const createFinalOrder = async (token, lat, lon, finalDeliveryCharge = deliveryCharge, finalTotal = total, transactionId = "") => {
    try {
      const res = await fetch(`${getApiUrl()}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart, address, phone, paymentMethod, subtotal, deliveryCharge: finalDeliveryCharge, total: finalTotal,
          latitude: lat, longitude: lon,
          customMessage,
          transactionId
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.message || "Order failed. Please try again.");
        setLoading(false);
        return;
      }

      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cart-updated"));
      navigate("/user/orders");
    } catch (err) {
      console.error("Final Order Error:", err);
      alert("Server error occurred while placing the final order.");
      setLoading(false);
    }
  };

  /**
   * useCurrentLocation: Queries GPS permissions, maps reverse geocoding via OpenStreetMap API
   * to populate physical address string.
   */
  const useCurrentLocation = () => {
    if (!profileDeliveryReady) {
      redirectToLoginForDeliveryDetails();
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        } else {
          setAddress(`Lat: ${latitude}, Lng: ${longitude}`);
        }
      } catch {
        setAddress(`Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`);
        setUserCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      } finally {
        setLocationLoading(false);
      }
    }, () => {
      alert("Unable to retrieve your location. Please check your browser permissions.");
      setLocationLoading(false);
    });
  };

  // Payment method options mapping helper
  const paymentOptions = [
    { id: 'UPI', title: 'UPI (GPay, PhonePe)', desc: 'Pay securely using UPI apps', icon: <Smartphone size={24} />, online: true },
    { id: 'COD', title: 'Cash on Delivery', desc: 'Pay when your food arrives', icon: <Banknote size={24} />, cod: true },
    { id: 'Card', title: 'Credit/Debit Card', desc: 'Visa, MasterCard, RuPay', icon: <CreditCard size={24} />, online: true }
  ].filter(opt => {
    if (!settings || !settings.enabledPaymentMethods) return true;
    if (opt.cod && !settings.enabledPaymentMethods.cod) return false;
    if (opt.online && !settings.enabledPaymentMethods.online) return false;
    return true;
  });

  // Ensure default selected payment method is available
  useEffect(() => {
    if (paymentOptions.length > 0) {
      const exists = paymentOptions.some(o => o.id === paymentMethod);
      if (!exists) {
        setPaymentMethod(paymentOptions[0].id);
      }
    }
  }, [settings, paymentOptions, paymentMethod]);

  return (
    /* --- MAIN PAGE CONTAINER --- */
    /* Tailwind: max-w-5xl mx-auto centers and sets width constraint. pb-10 reserves whitespace at the bottom */
    <div className="max-w-5xl mx-auto w-full pb-10">
      
      {/* --- CHECKOUT HEADER --- */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Checkout Securely</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base md:text-lg font-medium">Complete your order details and payment.</p>
      </motion.div>

      {/* --- ORDER ITEMS REVIEW BOX --- */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-8">
        <Card className="p-4 sm:p-5 md:p-6 border-slate-100 dark:border-slate-800/60 rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag size={20} className="text-brand-500" />
                Your Order
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Review items before delivery details.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-brand-50 dark:bg-brand-950/40 px-3 py-1 text-xs font-black text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-900/60">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
          </div>

          {/* Empty cart fallback check */}
          {cart.length === 0 ? (
            
            /* --- EMPTY CART WARNING SECTION --- */
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-8 text-center">
              <ShoppingBag className="mx-auto text-slate-300 dark:text-slate-700" size={34} />
              <h3 className="mt-3 text-base font-black text-slate-900 dark:text-white">Your cart is empty</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Add food from the menu to continue checkout.</p>
              <Button type="button" onClick={() => navigate("/user/menu")} variant="secondary" size="sm" className="mt-4 rounded-xl">
                Browse Menu
              </Button>
            </div>
          ) : (
            <>
              {/* --- ACTIVE ORDER ITEMS HORIZONTAL SCROLL LIST --- */}
              {/* Tailwind: overflow-x-auto enables side scrolling for cart item cards on small displays; snap-x enforces horizontal locking */}
              <div className="-mx-4 sm:-mx-5 md:-mx-6 overflow-x-auto scroll-smooth no-scrollbar px-4 sm:px-5 md:px-6 pb-3">
                <div className="flex gap-3 md:gap-4 snap-x snap-mandatory">
                  {cart.map((item) => (
                    <div
                      key={item._id}
                      className="snap-start min-w-[154px] max-w-[154px] sm:min-w-[190px] sm:max-w-[190px] rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 p-3 shadow-sm"
                    >
                      <div className="relative h-24 sm:h-28 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2 overflow-hidden">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="h-full w-full object-contain"
                          onError={(e) => { e.target.src = "https://placehold.co/180x140?text=Food"; }}
                        />
                        <button
                          type="button"
                          onClick={() => removeCartItem(item._id)}
                          className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full bg-white/95 dark:bg-slate-950/95 text-rose-500 shadow-sm border border-rose-100 dark:border-rose-900/40 flex items-center justify-center active:scale-95 transition"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="pt-3">
                        <h3 className="line-clamp-1 text-sm sm:text-base font-black text-slate-900 dark:text-white">{item.name}</h3>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-brand-600 dark:text-brand-400">₹{item.price}</span>
                          <span className="text-[10px] font-bold text-slate-400">Qty {item.qty}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-brand-100 dark:border-brand-900/60 bg-white dark:bg-slate-900 p-1">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item._id, Number(item.qty || 0) - 1)}
                            className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-95"
                            aria-label={`Decrease ${item.name}`}
                          >
                            <Minus size={15} />
                          </button>
                          <span className="min-w-8 text-center text-sm font-black text-slate-900 dark:text-white">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item._id, Number(item.qty || 0) + 1)}
                            className="h-8 w-8 rounded-lg bg-brand-500 text-white flex items-center justify-center shadow-sm shadow-brand-500/20 active:scale-95"
                            aria-label={`Increase ${item.name}`}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- PRICE BREAKDOWN SLAB --- */}
              <div className="mt-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 sm:p-4">
                <div className="space-y-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-black text-slate-900 dark:text-white">₹{subtotal}</span>
                  </div>
                  {packingCharges > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Packing Charges</span>
                      <span className="font-black text-slate-900 dark:text-white">₹{packingCharges}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-black text-slate-900 dark:text-white">₹{deliveryCharge}</span>
                  </div>
                  {rainCharge > 0 && (
                    <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                      <span>Rain Surcharge ⛈️</span>
                      <span className="font-black">₹{rainCharge}</span>
                    </div>
                  )}
                  {festivalCharge > 0 && (
                    <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                      <span>Festival Surcharge 🪔</span>
                      <span className="font-black">₹{festivalCharge}</span>
                    </div>
                  )}
                  {platformCharge > 0 && (
                    <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
                      <span>Platform Charge ⚡</span>
                      <span className="font-black">₹{platformCharge}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Taxes</span>
                    <span className="font-black text-slate-900 dark:text-white">₹{taxes}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-200 dark:border-slate-800 pt-3">
                  <span className="text-base font-black text-slate-900 dark:text-white">Total Amount</span>
                  <span className="text-xl sm:text-2xl font-black text-brand-600 dark:text-brand-400">₹{total}</span>
                </div>
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {/* --- FORM AND SUMMARY TWO-COLUMN LAYOUT --- */}
      {/* Tailwind: flex-col on mobile, flex-row on desktop (lg:flex-row) to arrange checkout forms next to receipt panels */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        
        {/* Left Columns - Form Entry Elements */}
        <div className="flex-1 space-y-4 md:space-y-6">
          
          {/* --- DELIVERY DETAILS INPUT CARD --- */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="p-4 sm:p-6 md:p-8 relative overflow-hidden border-slate-100 dark:border-slate-800/60 rounded-3xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 md:mb-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <MapPin size={20} className="text-brand-500" />
                Delivery Details
              </h2>
              
              <div className="space-y-4 md:space-y-6 relative z-10">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">Delivery Address</label>
                    <Button variant="ghost" size="sm" onClick={useCurrentLocation} className="text-brand-600 gap-1.5 px-2.5 py-1 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-slate-800 rounded-lg text-xs">
                      {locationLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Navigation size={12} />
                      )}
                      Use Current Location
                    </Button>
                  </div>
                  <textarea
                    placeholder="Enter your full delivery address (House No, Street, Landmark...)"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setUserCoords(null);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 transition-all outline-none resize-y min-h-[90px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder:text-slate-500 text-sm font-medium shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone size={16} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Order Notes / Instructions (Optional)</label>
                  <textarea
                    placeholder="e.g. Make it extra spicy, don't add onions, ring bell twice..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 transition-all outline-none resize-y min-h-[70px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder:text-slate-500 text-sm font-medium shadow-sm"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* --- PAYMENT OPTIONS CARD --- */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-4 sm:p-6 md:p-8 border-slate-100 dark:border-slate-800/60 rounded-3xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 md:mb-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <CreditCard size={20} className="text-brand-500" />
                Payment Method
              </h2>

              <div className="space-y-3">
                {paymentOptions.map((opt) => (
                  <label 
                    key={opt.id}
                    className={cn(
                      "flex items-center p-3.5 sm:p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300",
                      paymentMethod === opt.id 
                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 shadow-sm" 
                        : "border-slate-100 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40"
                    )}
                  >
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value={opt.id} 
                      checked={paymentMethod === opt.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                    />
                    <div className="ml-4 flex items-center gap-3">
                      <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shrink-0", paymentMethod === opt.id ? "bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400" : "bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-500 shadow-sm")}>
                        {opt.icon}
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900 dark:text-white text-sm sm:text-base">{opt.title}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{opt.desc}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Receipt Summary stickiness */}
        <div className="w-full lg:w-[380px] shrink-0">
          
          {/* --- STICKY RECEIPT CHECKOUT PANEL --- */}
          {/* Tailwind: sticky top-24 makes sure the summary panel follows scrolling viewport */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-5 md:p-8 sticky top-24 border-slate-100 dark:border-slate-800/60 rounded-3xl md:rounded-[2rem]">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Order Summary</h3>
              
              <div className="space-y-3 mb-4 md:mb-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex justify-between items-center">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{subtotal}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{deliveryCharge}</span>
                </div>

                {packingCharges > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Packing Charges</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{packingCharges}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Taxes</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{taxes}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 mb-6 md:mb-8">
                <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                <span className="text-2xl md:text-3xl font-black text-brand-500">₹{total}</span>
              </div>

              {/* Order Confirmation Submission Button */}
              <Button
                onClick={placeOrder}
                disabled={loading}
                className="w-full py-3 text-sm md:py-4 md:text-base font-bold gap-2 rounded-xl md:rounded-2xl shadow-brand-500/25 transition-transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={18} /> Confirm Order
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4 md:mt-6 font-medium">
                By placing your order, you agree to our Terms of Service & Privacy Policy.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, CreditCard, Banknote, Smartphone, CheckCircle, Navigation } from "lucide-react";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { cn } from "../../utils/cn";


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

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [customMessage, setCustomMessage] = useState(""); // <-- Added
  const [deliveryCharge, setDeliveryCharge] = useState(40);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null); // { latitude, longitude }

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

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    if (data.length === 0) navigate("/user/cart");
    setCart(data);

    fetch(`${import.meta.env.VITE_API_URL}/api/settings`)
      .then(res => res.json())
      .then(settingsData => {
        if (settingsData && settingsData.isDeliveryChargeEnabled !== undefined) {
          setDeliveryCharge(settingsData.isDeliveryChargeEnabled ? settingsData.deliveryChargeAmount : 0);
        }
      })
      .catch(err => console.error("Could not fetch settings", err));

    const token = getToken();
    if(token) {
      fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(userData => {
        if (userData) {
          if (userData.phone) setPhone(userData.phone);
          if (userData.address) setAddress(userData.address);
        }
      })
      .catch(err => console.error("Could not fetch user", err));
    }
  }, [navigate]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + deliveryCharge;

  const placeOrder = async () => {
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
      } else if (!lat || !lon) {
        // Fallback geocoding on frontend if coordinates not loaded yet
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
            headers: { "User-Agent": "ByteBite-FoodDelivery-App/1.0" }
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
      const settingsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/settings`);
      const settingsData = await settingsRes.json();

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
      }

      if (paymentMethod !== "COD") {
        const orderRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/create-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: total }),
        });

        const orderData = await orderRes.json();

        if (!orderData.success) {
          alert("Could not initiate payment");
          setLoading(false);
          return;
        }

        const keyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/key`);
        const { key } = await keyRes.json();

        const options = {
          key: key,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: "ByteBite",
          description: "Premium Food Delivery Payment",
          order_id: orderData.order.id,
          handler: async function (response) {
            const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/verify`, {
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
              await createFinalOrder(token, lat, lon);
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
        await createFinalOrder(token, lat, lon);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Server error occurred.");
      setLoading(false);
    }
  };

  const createFinalOrder = async (token, lat, lon) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart, address, phone, paymentMethod, subtotal, deliveryCharge, total,
          latitude: lat, longitude: lon,
          customMessage
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

  const useCurrentLocation = () => {
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
      } catch (err) {
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

  const paymentOptions = [
    { id: 'COD', title: 'Cash on Delivery', desc: 'Pay when your food arrives', icon: <Banknote size={24} /> },
    { id: 'UPI', title: 'UPI (GPay, PhonePe)', desc: 'Pay securely using UPI apps', icon: <Smartphone size={24} /> },
    { id: 'Card', title: 'Credit/Debit Card', desc: 'Visa, MasterCard, RuPay', icon: <CreditCard size={24} /> }
  ];

  return (
    <div className="max-w-5xl mx-auto w-full pb-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Checkout Securely</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium">Complete your order details and payment.</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* Delivery Details Section */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="p-6 md:p-8 relative overflow-hidden border-slate-100 dark:border-slate-800/60">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <MapPin size={24} className="text-brand-500" />
                Delivery Details
              </h2>
              
              <div className="space-y-6 relative z-10">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Delivery Address</label>
                    <Button variant="ghost" size="sm" onClick={useCurrentLocation} className="text-brand-600 gap-2 px-3 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-slate-800 rounded-xl">
                      {locationLoading ? (
                        <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Navigation size={14} />
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
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-y min-h-[120px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium shadow-sm"
                  />
                </div>


                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone size={18} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-12 py-3.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 rounded-2xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Order Notes / Instructions (Optional)</label>
                  <textarea
                    placeholder="e.g. Make it extra spicy, don't add onions, ring bell twice..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-905 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-y min-h-[80px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-505 font-medium shadow-sm"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Payment Options Section */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 md:p-8 border-slate-100 dark:border-slate-800/60">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <CreditCard size={24} className="text-brand-500" />
                Payment Method
              </h2>

              <div className="space-y-4">
                {paymentOptions.map((opt) => (
                  <label 
                    key={opt.id}
                    className={cn(
                      "flex items-center p-5 border-2 rounded-[1.25rem] cursor-pointer transition-all duration-300",
                      paymentMethod === opt.id 
                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 shadow-md shadow-brand-500/10" 
                        : "border-slate-100 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40"
                    )}
                  >
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value={opt.id} 
                      checked={paymentMethod === opt.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                    />
                    <div className="ml-5 flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", paymentMethod === opt.id ? "bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400" : "bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-500 shadow-sm")}>
                        {opt.icon}
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900 dark:text-white text-lg">{opt.title}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{opt.desc}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
                <span className="text-sm">ℹ️</span>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                  If payment icons, UPI logos, or QR codes fail to load, please temporarily disable any ad-blockers, tracking protection, or privacy shields (such as Brave Shield) for this site. Security extensions often mistakenly block secure payment assets.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-[400px] shrink-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-8 sticky top-24 border-slate-100 dark:border-slate-800/60 rounded-[2rem]">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-medium text-lg">
                  <span>Subtotal ({cart.length} items)</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{subtotal}</span>
                </div>
                
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-medium text-lg">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{deliveryCharge}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-6 border-t border-dashed border-slate-200 dark:border-slate-800 mb-8">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">Total</span>
                <span className="text-4xl font-black text-brand-500">₹{total}</span>
              </div>

              <Button
                onClick={placeOrder}
                disabled={loading}
                className="w-full py-5 text-lg gap-2 rounded-2xl shadow-brand-500/25 transition-transform hover:-translate-y-1"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={22} /> Confirm Order
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-6 font-medium">
                By placing your order, you agree to our Terms of Service & Privacy Policy.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, CreditCard, Banknote, Smartphone, CheckCircle, Navigation } from "lucide-react";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { cn } from "../../utils/cn";

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [deliveryCharge, setDeliveryCharge] = useState(40);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

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
              await createFinalOrder(token);
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
        await createFinalOrder(token);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Server error occurred.");
      setLoading(false);
    }
  };

  const createFinalOrder = async (token) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart, address, phone, paymentMethod, subtotal, deliveryCharge, total,
        }),
      });

      if (!res.ok) {
        alert("Order failed. Please try again.");
        setLoading(false);
        return;
      }

      localStorage.removeItem("cart");
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
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        } else {
          setAddress(`Lat: ${latitude}, Lng: ${longitude}`);
        }
      } catch (err) {
        setAddress(`Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`);
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
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Checkout Securely</h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">Complete your order details and payment.</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* Delivery Details Section */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="p-6 md:p-8 relative overflow-hidden border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3 border-b border-slate-100 pb-4">
                <MapPin size={24} className="text-brand-500" />
                Delivery Details
              </h2>
              
              <div className="space-y-6 relative z-10">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-slate-700 block">Delivery Address</label>
                    <Button variant="ghost" size="sm" onClick={useCurrentLocation} className="text-brand-600 gap-2 px-3 bg-brand-50 hover:bg-brand-100 rounded-xl">
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
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-y min-h-[120px] text-slate-900 placeholder-slate-400 font-medium shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone size={18} className="text-slate-400" />
                    </div>
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-12 py-3.5 bg-slate-50 rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Payment Options Section */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 md:p-8 border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
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
                        ? "border-brand-500 bg-brand-50/50 shadow-md shadow-brand-500/10" 
                        : "border-slate-100 hover:border-slate-300 bg-slate-50/50"
                    )}
                  >
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value={opt.id} 
                      checked={paymentMethod === opt.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-brand-600 focus:ring-brand-500 border-slate-300"
                    />
                    <div className="ml-5 flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", paymentMethod === opt.id ? "bg-brand-100 text-brand-600" : "bg-white text-slate-400 shadow-sm")}>
                        {opt.icon}
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900 text-lg">{opt.title}</span>
                        <span className="text-sm text-slate-500 font-medium">{opt.desc}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-[400px] shrink-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-8 sticky top-24 border-slate-100 rounded-[2rem]">
              <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-slate-500 font-medium text-lg">
                  <span>Subtotal ({cart.length} items)</span>
                  <span className="font-bold text-slate-900">₹{subtotal}</span>
                </div>
                
                <div className="flex justify-between items-center text-slate-500 font-medium text-lg">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-slate-900">₹{deliveryCharge}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-6 border-t border-dashed border-slate-200 mb-8">
                <span className="text-2xl font-bold text-slate-900">Total</span>
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
              <p className="text-center text-sm text-slate-400 mt-6 font-medium">
                By placing your order, you agree to our Terms of Service & Privacy Policy.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
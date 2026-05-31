import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD"); // Payment Method state
  const [deliveryCharge, setDeliveryCharge] = useState(40); // Default, updated by settings

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    if (data.length === 0) navigate("/user/cart");
    setCart(data);

    // Fetch dynamic delivery settings
    fetch(`${import.meta.env.VITE_API_URL}/api/settings`)
      .then(res => res.json())
      .then(settingsData => {
        if (settingsData && settingsData.isDeliveryChargeEnabled !== undefined) {
          setDeliveryCharge(settingsData.isDeliveryChargeEnabled ? settingsData.deliveryChargeAmount : 0);
        }
      })
      .catch(err => console.error("Could not fetch settings", err));

    // Fetch user details for auto-fill
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

    try {
      const token = await getToken();
      if (!token) {
        alert("Please login again.");
        return;
      }

      if (paymentMethod !== "COD") {
        // Razorpay flow
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
          return;
        }

        const keyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/key`);
        const { key } = await keyRes.json();

        const options = {
          key: key,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: "ByteBite",
          description: "Food Order Payment",
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
            }
          },
          prefill: {
            contact: phone,
          },
          theme: {
            color: "#ff6233",
          },
        };
        const rzp1 = new window.Razorpay(options);
        
        rzp1.on('payment.failed', function (response){
          alert("Payment Failed: " + response.error.description);
        });
        
        rzp1.open();
      } else {
        await createFinalOrder(token);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Server error occurred.");
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
          items: cart,
          address,
          phone,
          paymentMethod,
          subtotal,
          deliveryCharge,
          total,
        }),
      });

      if (!res.ok) {
        alert("Order failed. Please try again.");
        return;
      }

      localStorage.removeItem("cart");
      navigate("/user/orders");
    } catch (err) {
      console.error("Final Order Error:", err);
      alert("Server error occurred while placing the final order.");
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
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
      }
    }, () => {
      alert("Unable to retrieve your location. Please check your browser permissions.");
    });
  };

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Checkout</h1>
        <p className="text-slate-500 mt-2 font-medium">Complete your order details and payment.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* Delivery Details Section */}
          <Card className="p-6 md:p-8 relative overflow-hidden">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Delivery Details
            </h2>
            
            <div className="space-y-5 relative z-10">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-slate-700 block">Delivery Address</label>
                  <Button variant="ghost" size="sm" onClick={useCurrentLocation} className="text-brand-600 gap-1.5 px-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> 
                    Use Current Location
                  </Button>
                </div>
                <textarea
                  placeholder="Enter your full delivery address (House No, Street, Landmark...)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-y min-h-[100px] text-slate-900 placeholder-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <Input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-12"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Options Section */}
          <Card className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              Payment Method
            </h2>

            <div className="space-y-3">
              <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-slate-100 hover:border-brand-200 bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="COD" 
                  checked={paymentMethod === 'COD'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-brand-600 focus:ring-brand-500"
                />
                <div className="ml-4">
                  <span className="block font-bold text-slate-900">Cash on Delivery</span>
                  <span className="text-sm text-slate-500">Pay when your food arrives</span>
                </div>
              </label>

              <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'UPI' ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-slate-100 hover:border-brand-200 bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="UPI" 
                  checked={paymentMethod === 'UPI'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-brand-600 focus:ring-brand-500"
                />
                <div className="ml-4">
                  <span className="block font-bold text-slate-900">UPI (GPay, PhonePe)</span>
                  <span className="text-sm text-slate-500">Pay securely using UPI apps</span>
                </div>
              </label>

              <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'Card' ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-slate-100 hover:border-brand-200 bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="Card" 
                  checked={paymentMethod === 'Card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-brand-600 focus:ring-brand-500"
                />
                <div className="ml-4">
                  <span className="block font-bold text-slate-900">Credit/Debit Card</span>
                  <span className="text-sm text-slate-500">Visa, MasterCard, RuPay</span>
                </div>
              </label>
            </div>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80 shrink-0">
          <Card className="p-6 sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-4">Order Summary</h3>
            
            <div className="flex justify-between items-center mb-3 text-slate-600 font-medium">
              <span>Subtotal ({cart.length} items)</span>
              <span className="font-bold text-slate-900">₹{subtotal}</span>
            </div>
            
            <div className="flex justify-between items-center mb-6 text-slate-600 font-medium">
              <span>Delivery Charge</span>
              <span className="font-bold text-slate-900">₹{deliveryCharge}</span>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-200 mb-6">
              <span className="text-xl font-bold text-slate-900">Total To Pay</span>
              <span className="text-2xl font-black text-brand-500">₹{total}</span>
            </div>

            <Button
              onClick={placeOrder}
              className="w-full py-4 text-lg gap-2"
            >
              Confirm Order
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
            <p className="text-center text-xs text-slate-400 mt-4 font-medium">
              By placing your order, you agree to our Terms of Service.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
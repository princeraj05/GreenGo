import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../utils/getToken";

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD"); // Payment Method state

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    if (data.length === 0) navigate("/user/cart");
    setCart(data);
  }, [navigate]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryCharge = 40;
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

      // Add payment method to the order, backend might just ignore it if schema doesn't have it, but it simulates the flow
      const res = await fetch("http://localhost:5000/api/orders", {
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
      console.error("Checkout error:", err);
      alert("Server error occurred.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">🧾 Checkout</h1>
        <p className="text-gray-500 mt-2">Complete your order details and payment.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* Delivery Details Section */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Delivery Details
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Delivery Address</label>
                <textarea
                  placeholder="Enter your full delivery address (House No, Street, Landmark...)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-y min-h-[100px] text-gray-800"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Options Section */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              Payment Method
            </h2>

            <div className="space-y-3">
              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="COD" 
                  checked={paymentMethod === 'COD'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                />
                <div className="ml-4">
                  <span className="block font-bold text-gray-900">Cash on Delivery</span>
                  <span className="text-sm text-gray-500">Pay when your food arrives</span>
                </div>
              </label>

              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'UPI' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="UPI" 
                  checked={paymentMethod === 'UPI'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                />
                <div className="ml-4">
                  <span className="block font-bold text-gray-900">UPI (GPay, PhonePe)</span>
                  <span className="text-sm text-gray-500">Pay securely using UPI apps</span>
                </div>
              </label>

              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'Card' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="Card" 
                  checked={paymentMethod === 'Card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                />
                <div className="ml-4">
                  <span className="block font-bold text-gray-900">Credit/Debit Card</span>
                  <span className="text-sm text-gray-500">Visa, MasterCard, RuPay</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/50 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Order Summary</h3>
            
            <div className="flex justify-between items-center mb-3 text-gray-600">
              <span>Subtotal ({cart.length} items)</span>
              <span className="font-semibold text-gray-900">₹{subtotal}</span>
            </div>
            
            <div className="flex justify-between items-center mb-6 text-gray-600">
              <span>Delivery Charge</span>
              <span className="font-semibold text-gray-900">₹{deliveryCharge}</span>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-200 mb-6">
              <span className="text-xl font-bold text-gray-900">Total To Pay</span>
              <span className="text-2xl font-extrabold text-orange-600">₹{total}</span>
            </div>

            <button
              onClick={placeOrder}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Confirm Order
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">
              By placing your order, you agree to our Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
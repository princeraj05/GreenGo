import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);

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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">🛒 My Cart</h1>
        <p className="text-gray-500 mt-2">Review your items before proceeding to checkout.</p>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center">
          <span className="text-6xl mb-4">🛍️</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
          <button 
            onClick={() => navigate('/user/menu')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-red-600 transition-all active:scale-95"
          >
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {cart.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-5 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <img
                  src={item.image?.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/${item.image}`}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-xl bg-gray-100"
                  onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Food'; }}
                />

                <div className="flex-1 text-center sm:text-left w-full">
                  <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                  <p className="text-orange-600 font-bold mb-3">₹{item.price}</p>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-4">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => updateQty(item._id, "dec")}
                        className="w-8 h-8 flex items-center justify-center rounded bg-white text-gray-700 shadow-sm hover:bg-gray-50 font-bold transition-all"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-bold text-gray-800">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item._id, "inc")}
                        className="w-8 h-8 flex items-center justify-center rounded bg-white text-gray-700 shadow-sm hover:bg-gray-50 font-bold transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex justify-center sm:justify-end mt-4 sm:mt-0">
                  <button 
                    onClick={() => removeItem(item._id)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors group"
                    title="Remove Item"
                  >
                    <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/40 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Order Summary</h3>
              
              <div className="flex justify-between items-center mb-3 text-gray-600">
                <span>Subtotal ({cart.length} items)</span>
                <span className="font-semibold text-gray-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between items-center mb-6 text-gray-600">
                <span>Delivery</span>
                <span className="font-semibold text-gray-900">₹40</span>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-200 mb-6">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-orange-600">₹{subtotal + 40}</span>
              </div>

              <button
                onClick={() => navigate("/user/checkout")}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
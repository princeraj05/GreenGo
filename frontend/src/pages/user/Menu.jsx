import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Menu() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      const res = await fetch(`${API}/api/foods`);
      const data = await res.json();
      setFoods(data);
    } catch (err) {
      console.error("Failed to load foods", err);
    }
    setLoading(false);
  };

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(search.toLowerCase()) ||
    (food.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (food) => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find(i => i._id === food._id);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        _id: food._id,
        name: food.name,
        price: food.price,
        image: food.image,
        qty: 1
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    
    // Redirect to checkout automatically
    navigate("/user/checkout");
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">🍽 Our Menu</h1>
          <p className="text-gray-500 mt-1">Discover delicious meals tailored for you.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search for food..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFoods.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-4xl mb-4">🍳</span>
              <h3 className="text-xl font-bold text-gray-800">No food found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            filteredFoods.map(food => (
              <div key={food._id} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={`${API}/uploads/${food.image}`}
                    alt={food.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-orange-600 shadow-sm">
                    ₹{food.price}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{food.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-4">{food.description}</p>
                  
                  <button
                    onClick={() => addToCart(food)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-orange-500/20"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
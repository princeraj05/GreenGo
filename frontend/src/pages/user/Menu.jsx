import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Menu() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
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

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase()) || (food.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || (food.description || "").toLowerCase().includes(category.toLowerCase()) || food.name.toLowerCase().includes(category.toLowerCase());
    return matchesSearch && matchesCategory;
  });

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
    navigate("/user/checkout");
  };

  const categories = ["All", "Veg", "Non-Veg", "Spicy", "Sweet"];

  return (
    <div className="max-w-7xl mx-auto w-full animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>🍽️</span> Our Menu
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Discover delicious meals tailored for you.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search for food..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none font-medium text-slate-700"
          />
        </div>
      </div>

      {/* CATEGORY FILTERS */}
      <div className="flex flex-wrap gap-3 mb-10">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm ${
              category === cat 
              ? "bg-slate-900 text-white shadow-slate-900/20 scale-105" 
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredFoods.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <span className="text-6xl mb-6">🍳</span>
              <h3 className="text-2xl font-black text-slate-800 mb-2">No food found</h3>
              <p className="text-slate-500 max-w-sm">Try adjusting your search criteria or category filter to find what you're looking for.</p>
              <button onClick={() => {setSearch(""); setCategory("All");}} className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 transition-colors">Clear Filters</button>
            </div>
          ) : (
            filteredFoods.map(food => (
              <div key={food._id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col">
                <div className="relative h-56 overflow-hidden bg-slate-100 p-2">
                  <img
                    src={food.image?.startsWith('http') ? food.image : `${API}/uploads/${food.image}`}
                    alt={food.name}
                    className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                  />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-black text-slate-900 shadow-sm border border-white/20">
                    ₹{food.price}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-500 transition-colors">{food.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 flex-1 mb-6 leading-relaxed">{food.description}</p>
                  
                  <button
                    onClick={() => addToCart(food)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-orange-500 text-white py-3.5 rounded-xl font-bold transition-colors active:scale-95 shadow-md shadow-slate-900/10 hover:shadow-orange-500/20"
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
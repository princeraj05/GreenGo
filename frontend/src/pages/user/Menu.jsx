import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, UtensilsCrossed, Star, X, Heart } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";
import { getToken } from "../../utils/getToken";

const API = getApiUrl();

export default function Menu() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodReviews, setFoodReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const selectFoodDetails = async (food) => {
    setSelectedFood(food);
    setFoodReviews([]);
    try {
      const res = await fetch(`${API}/api/reviews/food/${food._id}`);
      if(res.ok) {
        setFoodReviews(await res.json());
      }
    } catch (err) {
      console.error("Failed to load reviews for food:", err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get("category");
    if (catParam) {
      setCategory(catParam);
    }
  }, [location.search]);

  useEffect(() => {
    loadFoods();
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch (err) {
      console.error("Failed to load user favorites:", err);
    }
  };

  const toggleFavoriteFood = async (foodId) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API}/api/users/favorites/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ foodId })
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const isFavorite = (foodId) => {
    return favorites.includes(foodId);
  };

  const loadFoods = async () => {
    try {
      const res = await fetch(`${API}/api/foods`);
      if(res.ok) {
        const data = await res.json();
        setFoods(data);
      }
    } catch (err) {
      console.error("Failed to load foods", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase()) || (food.description || "").toLowerCase().includes(search.toLowerCase());
    
    let matchesCategory = false;
    if (category === "All") {
      matchesCategory = true;
    } else if (category === "Favorites") {
      matchesCategory = isFavorite(food._id);
    } else {
      matchesCategory = (food.category && food.category.toLowerCase() === category.toLowerCase()) || (food.description || "").toLowerCase().includes(category.toLowerCase()) || food.name.toLowerCase().includes(category.toLowerCase());
    }
    
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
    window.dispatchEvent(new Event("cart-updated"));
    // Provide a tiny vibration/feedback or visual cue (could add toast later)
    navigate("/user/checkout");
  };

  const categories = ["All", "Veg", "Non-Veg", "Spicy", "Sweet", "Beverages", "Favorites"];

  return (
    <div className="max-w-7xl mx-auto w-full pb-10">
      
      {/* HEADER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-50 rounded-full blur-[80px] -z-10 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-blue-50 rounded-full blur-[60px] -z-10 translate-y-1/3" />
        
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Our Menu
          </h1>
          <p className="text-slate-500 mt-3 text-lg font-medium">Discover delicious meals tailored for you.</p>
        </div>
        
        <div className="relative w-full md:w-[400px]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <Input
            type="text"
            placeholder="Search for your cravings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-white/60 backdrop-blur-sm border-slate-200 shadow-sm rounded-2xl py-3.5"
          />
        </div>
      </motion.div>

      {/* CATEGORY FILTERS */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 mb-10"
      >
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
              category === cat 
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-105" 
              : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          <AnimatePresence>
            {filteredFoods.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-brand-500">
                  <UtensilsCrossed size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">No food found</h3>
                <p className="text-slate-500 max-w-sm mb-8 font-medium">Try adjusting your search criteria or category filter to find what you're looking for.</p>
                <Button onClick={() => {setSearch(""); setCategory("All");}} variant="secondary" className="rounded-full">
                  Clear Filters
                </Button>
              </motion.div>
            ) : (
              filteredFoods.map((food, i) => (
                <motion.div 
                  key={food._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card hover className="h-full flex flex-col overflow-hidden group border-slate-100">
                    <div 
                      onClick={() => selectFoodDetails(food)}
                      className="relative h-56 overflow-hidden bg-slate-50 p-2 cursor-pointer"
                    >
                      <img
                        src={getImageUrl(food.image)}
                        alt={food.name}
                        className="w-full h-full object-cover rounded-[1.25rem] transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteFood(food._id);
                        }}
                        className="absolute top-4 left-4 w-9 h-9 bg-white/90 backdrop-blur-md flex items-center justify-center rounded-xl shadow-sm text-slate-700 hover:text-red-500 transition-colors z-10"
                      >
                        <Heart
                          size={18}
                          className={isFavorite(food._id) ? "fill-red-500 text-red-500" : "text-slate-600"}
                        />
                      </button>
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-black text-slate-900 shadow-sm">
                        ₹{food.price}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h3 
                        onClick={() => selectFoodDetails(food)}
                        className="text-xl font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-brand-600 transition-colors cursor-pointer"
                      >
                        {food.name}
                      </h3>

                      {/* Ratings stars count */}
                      <div className="flex items-center gap-1 mb-3 text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg w-fit border border-slate-100">
                        <Star size={12} className={food.rating > 0 ? "text-amber-500 fill-amber-500" : "text-slate-300"} />
                        <span>{food.rating > 0 ? `${food.rating.toFixed(1)} (${food.ratingCount})` : "No reviews"}</span>
                      </div>

                      <p className="text-sm text-slate-500 line-clamp-2 flex-1 mb-6 font-medium leading-relaxed">{food.description}</p>
                      
                      <Button onClick={() => addToCart(food)} className="w-full gap-2 group-hover:shadow-brand-500/30">
                        <ShoppingCart size={18} />
                        Add to Cart
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}
      {/* ── FOOD DETAILS MODAL ── */}
      <AnimatePresence>
        {selectedFood && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Image & Header */}
              <div className="relative h-64 sm:h-80 bg-slate-50 shrink-0">
                <img 
                  src={getImageUrl(selectedFood.image)} 
                  alt={selectedFood.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Food'; }}
                />
                 <button 
                  onClick={() => toggleFavoriteFood(selectedFood._id)}
                  className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-700 shadow-md hover:bg-white transition-colors"
                >
                  <Heart 
                    size={20} 
                    className={isFavorite(selectedFood._id) ? "fill-red-500 text-red-500" : "text-slate-600"} 
                  />
                </button>
                <button 
                  onClick={() => setSelectedFood(null)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-700 shadow-md hover:bg-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Details & Reviews */}
              <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedFood.name}</h2>
                    <span className="text-2xl font-black text-brand-600 shrink-0">₹{selectedFood.price}</span>
                  </div>
                  
                  {/* Rating summary */}
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl w-fit border border-slate-100">
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                    <span>{selectedFood.rating > 0 ? `${selectedFood.rating.toFixed(1)} ★ (${selectedFood.ratingCount} reviews)` : "No reviews yet"}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">{selectedFood.description || "No description available."}</p>
                </div>

                <hr className="border-slate-100" />

                {/* Reviews List */}
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4">Customer Reviews</h3>
                  {foodReviews.length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
                      <p className="text-slate-500 font-medium">No reviews for this dish yet. Be the first to try it and write a review!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {foodReviews.map((r) => (
                        <div key={r._id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100/60">
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 font-black text-sm flex items-center justify-center border border-brand-100">
                                {r.userName ? r.userName[0].toUpperCase() : "U"}
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-800 text-sm">{r.userName}</h5>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {new Date(r.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-0.5 text-yellow-400 bg-white border border-slate-100 px-2 py-1 rounded-lg">
                              {[...Array(r.rating)].map((_, idx) => (
                                <Star key={idx} size={12} fill="currentColor" className="text-yellow-400" />
                              ))}
                              {[...Array(5 - r.rating)].map((_, idx) => (
                                <Star key={idx} size={12} className="text-slate-200" />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed font-medium">"{r.reviewText}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add to Cart button */}
              <div className="p-6 border-t border-slate-100 bg-white">
                <Button onClick={() => { addToCart(selectedFood); setSelectedFood(null); }} className="w-full gap-2 py-4 text-base rounded-2xl">
                  <ShoppingCart size={20} />
                  Add to Cart • ₹{selectedFood.price}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
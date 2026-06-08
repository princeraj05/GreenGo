import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Star, UtensilsCrossed, ArrowRight } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";
import { getToken } from "../../utils/getToken";

const API = getApiUrl();

export default function Wishlist() {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlistData();
    loadCart();
  }, []);

  const loadCart = () => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(data);
  };

  const loadWishlistData = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Fetch user favorites
      const userRes = await fetch(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let favIds = [];
      if (userRes.ok) {
        const userData = await userRes.json();
        favIds = userData.favorites || [];
        setFavorites(favIds);
      }

      // Fetch all foods
      const foodRes = await fetch(`${API}/api/foods`);
      if (foodRes.ok) {
        const allFoods = await foodRes.json();
        // Filter foods that are in favorites
        const favoriteFoods = allFoods.filter(f => favIds.includes(f._id));
        setFoods(favoriteFoods);
      }
    } catch (err) {
      console.error("Failed to load wishlist data:", err);
    } finally {
      setLoading(false);
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
        const updatedFavs = data.favorites || [];
        setFavorites(updatedFavs);
        // Refresh foods list
        setFoods(prev => prev.filter(f => updatedFavs.includes(f._id)));
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const updateQuantity = (food, newQty) => {
    let currentCart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingIndex = currentCart.findIndex(i => i._id === food._id);

    if (newQty <= 0) {
      if (existingIndex > -1) {
        currentCart.splice(existingIndex, 1);
      }
    } else {
      if (existingIndex > -1) {
        currentCart[existingIndex].qty = newQty;
      } else {
        currentCart.push({
          _id: food._id,
          name: food.name,
          price: food.price,
          image: food.image,
          qty: newQty
        });
      }
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));
    setCart(currentCart);
    window.dispatchEvent(new Event("cart-updated"));
  };

  return (
    <div className="max-w-7xl mx-auto w-full pb-10 px-2 sm:px-4 animate-fade-in">
      {/* Title Header */}
      <div className="mb-8 animate-slide-in">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>❤️</span> My Wishlist
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Your liked items. Add them directly to your cart and place your order.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : foods.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/60 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 text-slate-400">
            <Heart size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Your Wishlist is Empty</h3>
          <p className="text-slate-500 dark:text-slate-405 max-w-xs mb-8 font-medium">Explore dishes on our Home page and like them to add here.</p>
          <Button onClick={() => navigate("/user/menu")} className="rounded-xl flex items-center gap-2">
            Explore Dishes <ArrowRight size={16} />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <AnimatePresence>
            {foods.map((food) => (
              <motion.div 
                key={food._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Card hover className="h-full flex flex-col overflow-hidden group border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                  <div className="relative h-44 sm:h-52 overflow-hidden bg-slate-50 dark:bg-slate-950 p-2 flex items-center justify-center">
                    <img
                      src={getImageUrl(food.image)}
                      alt={food.name}
                      className="max-w-full max-h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                    />
                    <button
                      onClick={() => toggleFavoriteFood(food._id)}
                      className="absolute top-3 left-3 w-8 h-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center rounded-lg shadow-sm text-red-500 hover:scale-110 transition-all z-10"
                    >
                      <Heart size={16} className="fill-red-500" />
                    </button>
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-black text-slate-900 dark:text-white shadow-sm">
                      ₹{food.price}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-brand-500 transition-colors">
                      {food.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-lg w-fit border border-slate-100 dark:border-slate-800/60">
                      <Star size={11} className={food.rating > 0 ? "text-amber-500 fill-amber-500" : "text-slate-350"} />
                      <span>{food.rating > 0 ? `${food.rating.toFixed(1)} (${food.ratingCount})` : "No reviews"}</span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 flex-1 mb-4 font-medium leading-relaxed">{food.description}</p>
                    
                    {cart.find(i => i._id === food._id) ? (
                      <div className="flex items-center justify-between w-full bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 rounded-xl p-1 shadow-sm">
                        <button
                          onClick={() => updateQuantity(food, (cart.find(i => i._id === food._id)?.qty || 0) - 1)}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 text-brand-650 dark:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-extrabold flex items-center justify-center border border-slate-100 dark:border-slate-800"
                        >
                          -
                        </button>
                        <span className="font-black text-slate-800 dark:text-white px-2.5 text-xs">
                          {cart.find(i => i._id === food._id)?.qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(food, (cart.find(i => i._id === food._id)?.qty || 0) + 1)}
                          className="w-8 h-8 rounded-lg bg-brand-500 text-white font-extrabold flex items-center justify-center shadow-md shadow-brand-500/20"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <Button onClick={() => updateQuantity(food, 1)} className="w-full gap-2 py-2.5 text-xs">
                        <ShoppingCart size={14} />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

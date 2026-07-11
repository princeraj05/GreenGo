import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, Heart, ShoppingCart, Star, UtensilsCrossed, X } from "lucide-react";
import Button from "../../components/ui/Button";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";
import { getToken } from "../../utils/getToken";

const API = getApiUrl();

/**
 * Wishlist Component
 * 
 * Manages user's bookmarked food items. Allows toggling wishlist items,
 * adjusting cart quantities from the wishlist cards, and viewing all items in a layout grid modal.
 */
export default function Wishlist() {
  const navigate = useNavigate();

  /* --- STATE DECLARATIONS --- */
  const [foods, setFoods] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  /* --- EFFECTS & DATA FETCHING --- */
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
      let favIds = [];
      if (!token) {
        favIds = JSON.parse(localStorage.getItem("guest_favorites")) || [];
        setFavorites(favIds);
      } else {
        const userRes = await fetch(`${API}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          favIds = userData.favorites || [];
          setFavorites(favIds);
        }
      }

      const foodRes = await fetch(`${API}/api/foods`);
      if (foodRes.ok) {
        const allFoods = await foodRes.json();
        setFoods(allFoods.filter((food) => favIds.includes(food._id)));
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
      if (!token) {
        const localFavs = JSON.parse(localStorage.getItem("guest_favorites")) || [];
        let nextFavs;
        if (localFavs.includes(foodId)) {
          nextFavs = localFavs.filter(id => id !== foodId);
        } else {
          nextFavs = [...localFavs, foodId];
        }
        localStorage.setItem("guest_favorites", JSON.stringify(nextFavs));
        setFavorites(nextFavs);
        setFoods((prev) => prev.filter((food) => nextFavs.includes(food._id)));
        return;
      }
      const res = await fetch(`${API}/api/users/favorites/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ foodId }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedFavs = data.favorites || [];
        setFavorites(updatedFavs);
        setFoods((prev) => prev.filter((food) => updatedFavs.includes(food._id)));
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const updateQuantity = (food, newQty) => {
    let currentCart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingIndex = currentCart.findIndex((item) => item._id === food._id);

    if (newQty <= 0) {
      if (existingIndex > -1) currentCart.splice(existingIndex, 1);
    } else if (existingIndex > -1) {
      currentCart[existingIndex].qty = newQty;
    } else {
      currentCart.push({
        _id: food._id,
        name: food.name,
        price: food.price,
        image: food.image,
        qty: newQty,
      });
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));
    setCart(currentCart);
    window.dispatchEvent(new Event("cart-updated"));
  };

  const getCartItem = (food) => cart.find((item) => item._id === food._id);

  // Smooth animation details
  const smoothTransition = { type: "spring", stiffness: 300, damping: 28 };

  const renderCartAction = (food) => {
    const cartItem = getCartItem(food);
    if (!cartItem) {
      return (
        <button
          type="button"
          onClick={() => updateQuantity(food, 1)}
          className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold text-[11px] shadow-sm active:scale-95 transition-all flex items-center gap-1"
        >
          <ShoppingCart size={12} />
          Add
        </button>
      );
    }

    return (
      <div className="flex items-center bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-800 rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => updateQuantity(food, cartItem.qty - 1)}
          className="w-6.5 h-6.5 rounded-md bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-300 font-extrabold flex items-center justify-center border border-slate-100 dark:border-slate-800 text-xs"
        >
          -
        </button>
        <span className="font-bold text-slate-800 dark:text-white px-1.5 text-[11px] min-w-5 text-center">
          {cartItem.qty}
        </span>
        <button
          type="button"
          onClick={() => updateQuantity(food, cartItem.qty + 1)}
          className="w-6.5 h-6.5 rounded-md bg-brand-500 text-white font-extrabold flex items-center justify-center shadow-sm text-xs"
        >
          +
        </button>
      </div>
    );
  };

  const renderWishlistCard = (food, className = "") => (
    <motion.div
      key={food._id}
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={smoothTransition}
      className={`w-full bg-white dark:bg-slate-900 rounded-2xl p-3 pb-4 border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group relative overflow-hidden min-h-[310px] ${className}`}
    >
      <div className="relative h-28 w-full rounded-xl overflow-hidden mb-3 bg-slate-50 dark:bg-slate-950 p-1 flex items-center justify-center">
        <img
          src={getImageUrl(food.image)}
          alt={food.name}
          className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-102"
          onError={(event) => {
            event.currentTarget.src = "https://placehold.co/400x300?text=Food";
          }}
        />
        <button
          type="button"
          onClick={() => toggleFavoriteFood(food._id)}
          className="absolute top-1.5 left-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm w-7 h-7 rounded-lg text-red-500 flex items-center justify-center shadow-sm"
          aria-label={`Remove ${food.name} from wishlist`}
        >
          <Heart size={13} className="fill-red-500" />
        </button>
        <div className="absolute bottom-1.5 left-1.5 bg-slate-950/90 dark:bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold text-white dark:text-slate-950 flex items-center gap-0.5 shadow-sm">
          <Clock size={8} className="text-brand-400" />
          <span>20m</span>
        </div>
        <div className="absolute top-1.5 right-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[9px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-0.5 shadow-sm">
          <Star size={9} className="text-amber-500 fill-amber-500 shrink-0" />
          <span>{food.rating ? food.rating.toFixed(1) : "4.2"}</span>
        </div>
      </div>

      <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-brand-500 transition-colors line-clamp-1 mb-0.5">
        {food.name}
      </h3>
      <p className="text-[9px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
        {food.category || "Food"}
      </p>
      <p className="text-[10px] text-slate-500 dark:text-slate-300 line-clamp-2-custom leading-relaxed mb-3 font-medium">
        {food.description}
      </p>

      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/50">
        <div className="flex flex-col">
          {food.originalPrice > food.price ? (
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 line-through leading-none">
              ₹{food.originalPrice}
            </span>
          ) : (
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 line-through leading-none">
              ₹{Math.round(food.price * 1.2)}
            </span>
          )}
          <span className="text-sm font-extrabold text-slate-950 dark:text-white leading-none pt-0.5 tabular-nums">
            ₹{food.price}
          </span>
        </div>
        {renderCartAction(food)}
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-5xl mx-auto w-full pb-10 px-3 sm:px-4">
      
      {/* WISHLIST MAIN HEADER AREA */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>❤️</span> My Wishlist
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs mt-0.5">
              Your liked items. Add favorites directly to your cart.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-8 h-8 border-3 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : foods.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center mb-4 text-slate-400">
            <Heart size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Your Wishlist is Empty</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-5 text-xs font-medium">Explore dishes on our Home page.</p>
          <Button onClick={() => navigate("/user/menu")} className="rounded-xl py-2 px-4 text-xs flex items-center gap-1.5">
            Explore Dishes <ArrowRight size={13} />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-8">
          <AnimatePresence>{foods.map((food) => renderWishlistCard(food, "min-w-0"))}</AnimatePresence>
        </div>
      )}
    </div>
  );
}

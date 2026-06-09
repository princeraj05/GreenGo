import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, Heart, ShoppingCart, Star, UtensilsCrossed, X } from "lucide-react";
import Button from "../../components/ui/Button";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";
import { getToken } from "../../utils/getToken";

const API = getApiUrl();

export default function Wishlist() {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllLiked, setShowAllLiked] = useState(false);

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

      const userRes = await fetch(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let favIds = [];
      if (userRes.ok) {
        const userData = await userRes.json();
        favIds = userData.favorites || [];
        setFavorites(favIds);
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
      if (!token) return;
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

  const renderCartAction = (food) => {
    const cartItem = getCartItem(food);
    if (!cartItem) {
      return (
        <button
          type="button"
          onClick={() => updateQuantity(food, 1)}
          className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <ShoppingCart size={14} />
          Add
        </button>
      );
    }

    return (
      <div className="flex items-center bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-800 rounded-xl p-0.5">
        <button
          type="button"
          onClick={() => updateQuantity(food, cartItem.qty - 1)}
          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-300 font-extrabold flex items-center justify-center border border-slate-100 dark:border-slate-800"
        >
          -
        </button>
        <span className="font-black text-slate-800 dark:text-white px-2 text-xs min-w-7 text-center">
          {cartItem.qty}
        </span>
        <button
          type="button"
          onClick={() => updateQuantity(food, cartItem.qty + 1)}
          className="w-8 h-8 rounded-lg bg-brand-500 text-white font-extrabold flex items-center justify-center shadow-md shadow-brand-500/20"
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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.25 }}
      className={`min-w-[250px] sm:min-w-[270px] lg:min-w-[290px] snap-start bg-white dark:bg-slate-900 rounded-3xl p-4.5 pb-5 border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden min-h-[390px] ${className}`}
    >
      <div className="relative h-40 w-full rounded-2xl overflow-hidden mb-4 bg-slate-50 dark:bg-slate-950 p-2 flex items-center justify-center">
        <img
          src={getImageUrl(food.image)}
          alt={food.name}
          className="max-w-full max-h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.src = "https://placehold.co/400x300?text=Food";
          }}
        />
        <button
          type="button"
          onClick={() => toggleFavoriteFood(food._id)}
          className="absolute top-2 left-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm w-9 h-9 rounded-xl text-red-500 flex items-center justify-center shadow-sm"
          aria-label={`Remove ${food.name} from wishlist`}
        >
          <Heart size={16} className="fill-red-500" />
        </button>
        <div className="absolute bottom-2 left-2 bg-slate-950/95 dark:bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black text-white dark:text-slate-950 flex items-center gap-1 shadow-sm">
          <Clock size={10} className="text-brand-400" />
          <span>20-30 min</span>
        </div>
        <div className="absolute top-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1 shadow-sm">
          <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />
          <span>{food.rating ? food.rating.toFixed(1) : "4.2"}</span>
        </div>
      </div>

      <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-brand-500 transition-colors line-clamp-1 mb-1">
        {food.name}
      </h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider mb-2.5">
        In Category: {food.category || "Food"}
      </p>
      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4.5 font-medium flex-1">
        {food.description}
      </p>

      <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/50">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 line-through leading-none">
            ₹{Math.round(food.price * 1.2)}
          </span>
          <span className="text-lg font-black text-slate-950 dark:text-white leading-none pt-1 tabular-nums">
            ₹{food.price}
          </span>
        </div>
        {renderCartAction(food)}
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto w-full pb-10 px-2 sm:px-4 animate-fade-in">
      <div className="mb-8 animate-slide-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>❤️</span> My Wishlist
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Your liked items. Slide through them and add favorites directly to your cart.
            </p>
          </div>
          {foods.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAllLiked(true)}
              className="shrink-0 text-xs font-black text-brand-600 dark:text-brand-300 px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/30"
            >
              See All
            </button>
          )}
        </div>
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
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8 font-medium">
            Explore dishes on our Home page and like them to add here.
          </p>
          <Button onClick={() => navigate("/user/menu")} className="rounded-xl flex items-center gap-2">
            Explore Dishes <ArrowRight size={16} />
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Liked Foods</h2>
            <button type="button" onClick={() => setShowAllLiked(true)} className="text-xs font-black text-brand-600 dark:text-brand-300">
              See All
            </button>
          </div>
          <div className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar snap-x pb-2">
            <AnimatePresence>{foods.map((food) => renderWishlistCard(food))}</AnimatePresence>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAllLiked && (
          <div className="fixed inset-0 z-[1900] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.98 }}
              className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:rounded-[2rem]"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-black tracking-tight text-slate-900 dark:text-white">All Liked Foods</h3>
                  <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                    {foods.length} liked products available
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllLiked(false)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label="Close liked foods"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <AnimatePresence>{foods.map((food) => renderWishlistCard(food, "min-w-0"))}</AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

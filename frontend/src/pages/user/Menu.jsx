import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ShoppingCart, UtensilsCrossed, Star, X, Heart, 
  MapPin, Bell, Sun, Moon, Sparkles, Navigation, Clock, ChevronDown, Plus, Mic, Grid3X3
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";
import { getToken } from "../../utils/getToken";
import BudgetAssistant from "../../components/dashboard/BudgetAssistant";

const API = getApiUrl();

export default function Menu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // FOOD DATA & STATES
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [vegMode, setVegMode] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllFoods, setShowAllFoods] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodReviews, setFoodReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  
  // BUDGET ASSISTANT STATE
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);

  // NOTIFICATIONS & PROFILE
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState({});
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "Home", details: "", city: "", state: "" });

  // BANNERS STATE
  const [banners, setBanners] = useState([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);

  // Fallback banners if none exist in the database
  const defaultBanners = [
    {
      _id: "default-1",
      title: "WEEKEND SPECIAL",
      description: "ON YOUR FIRST ORDER",
      discountText: "UPTO 60% OFF",
      buttonText: "ORDER NOW",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
      code: "GOGREEN60"
    },
    {
      _id: "default-2",
      title: "MIDWEEK CRAVINGS",
      description: "BUY 1 GET 1 FREE",
      discountText: "BOGO BONANZA",
      buttonText: "CLAIM NOW",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
      code: "BOGO"
    },
    {
      _id: "default-3",
      title: "SUPER SAVER DEALS",
      description: "FREE DELIVERY ABOVE ₹299",
      discountText: "NO DEL CHARGES",
      buttonText: "EXPLORE MENU",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800",
      code: "FREEDEL"
    }
  ];

  // CATEGORIES LIST (Requested category mapping)
  const categoriesList = [
    { id: "All", name: "All", icon: "All" },
    { id: "Starter", name: "Starter", icon: "ST" },
    { id: "Combo", name: "Combo", icon: "CB" },
    { id: "Roti", name: "Roti", icon: "RT" },
    { id: "Pizza", name: "Pizza", icon: "PZ" },
    { id: "Burger", name: "Burger", icon: "BG" },
    { id: "Biryani", name: "Biryani", icon: "BR" },
    { id: "Rolls", name: "Rolls", icon: "RL" },
    { id: "Fries", name: "Fries", icon: "FR" },
    { id: "North Indian", name: "North Indian", icon: "NI" },
    { id: "Desserts", name: "Desserts", icon: "DS" },
    { id: "Bowl", name: "Bowl", icon: "BW" },
    { id: "Veg Meal", name: "Veg Meal", icon: "VM" },
    { id: "Paneer", name: "Paneer", icon: "PN" },
    { id: "Paratha", name: "Paratha", icon: "PR" },
    { id: "Sandwich", name: "Sandwich", icon: "SW" },
    { id: "Rice", name: "Rice", icon: "RC" },
    { id: "Cake", name: "Cake", icon: "CK" },
    { id: "Dal", name: "Dal", icon: "DL" },
    { id: "Thali", name: "Thali", icon: "TH" },
    { id: "Aloo Paratha", name: "Aloo Paratha", icon: "AP" },
    { id: "Italian", name: "Italian", icon: "IT" },
    { id: "Shawarma", name: "Shawarma", icon: "SH" },
    { id: "Noodles", name: "Noodles", icon: "ND" },
    { id: "Shake", name: "Shake", icon: "SK" },
    { id: "Pasta", name: "Pasta", icon: "PS" },
    { id: "Dal Makhani", name: "Dal Makhani", icon: "DM" },
    { id: "Patty", name: "Patty", icon: "PT" },
    { id: "Paneer Biryani", name: "Paneer Biryani", icon: "PB" },
    { id: "Rajma Rice", name: "Rajma Rice", icon: "RR" },
    { id: "Mousse", name: "Mousse", icon: "MS" },
    { id: "Milkshake", name: "Milkshake", icon: "MK" },
    { id: "Sweets", name: "Sweets", icon: "ST" },
    { id: "Ice Cream", name: "Ice Cream", icon: "IC" },
    { id: "Cold Coffee", name: "Cold Coffee", icon: "CC" },
    { id: "Cheesecake", name: "Cheesecake", icon: "CH" },
    { id: "Brownie", name: "Brownie", icon: "BN" },
    { id: "Tea", name: "Tea", icon: "TE" },
    { id: "Gulab Jamun", name: "Gulab Jamun", icon: "GJ" },
    { id: "Pastry", name: "Pastry", icon: "PY" },
    { id: "Chaap", name: "Chaap", icon: "CP" },
    { id: "Rajma", name: "Rajma", icon: "RJ" },
    { id: "Kulche", name: "Kulche", icon: "KL" },
    { id: "Kebabs", name: "Kebabs", icon: "KB" },
    { id: "Maggi", name: "Maggi", icon: "MG" },
    { id: "Bhurji", name: "Bhurji", icon: "BJ" },
    { id: "Juice", name: "Juice", icon: "JC" },
    { id: "Chicken", name: "Chicken", icon: "CH" },
    { id: "Non-Veg", name: "Non-Veg", icon: "NV" },
    { id: "Drinks", name: "Drinks", icon: "DR" }
  ];

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
    loadCart();
    loadBanners();
    loadNotifications();
    loadUser();
  }, []);

  // AUTO BANNER INTERVAL
  useEffect(() => {
    const bannerCount = banners.length > 0 ? banners.length : defaultBanners.length;
    const timer = setInterval(() => {
      setCurrentBannerIdx((prevIdx) => (prevIdx + 1) % bannerCount);
    }, 3000);
    return () => clearInterval(timer);
  }, [banners]);

  const loadUser = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (!Array.isArray(data.addresses) || data.addresses.length === 0) {
          data.addresses = data.address
            ? [{ label: "Home", details: data.address, city: "", state: "", isPrimary: true }]
            : [{ label: "Home", details: "", city: "", state: "", isPrimary: true }];
        }
        setUser(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API}/api/notifications/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadBanners = async () => {
    try {
      const res = await fetch(`${API}/api/banners`);
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (err) {
      console.error("Failed to load banners:", err);
    }
  };

  const loadCart = () => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(data);
  };

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
      if (res.ok) {
        setFoods(await res.json());
      }
    } catch (err) {
      console.error("Failed to load foods:", err);
    } finally {
      setLoading(false);
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

  const selectFoodDetails = async (food) => {
    setSelectedFood(food);
    setFoodReviews([]);
    try {
      const res = await fetch(`${API}/api/reviews/food/${food._id}`);
      if (res.ok) {
        setFoodReviews(await res.json());
      }
    } catch (err) {
      console.error("Failed to load reviews for food:", err);
    }
  };

  const isNonVegFood = (food) => {
    const cat = String(food.category || "").toLowerCase();
    const name = String(food.name || "").toLowerCase();
    return food.veg === false || cat.includes("non-veg") || cat.includes("chicken") || name.includes("chicken") || name.includes("mutton") || name.includes("egg");
  };

  const isVegFood = (food) => !isNonVegFood(food);

  // RECOMMENDATION & FILTER LOGIC
  const matchesVegMode = (food) => !vegMode || isVegFood(food);

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase()) || 
                          (food.description || "").toLowerCase().includes(search.toLowerCase());
    
    let matchesCategory = false;
    if (category === "All") {
      matchesCategory = true;
    } else if (category === "Favorites") {
      matchesCategory = isFavorite(food._id);
    } else {
      const cat = food.category?.toLowerCase() || "";
      const selected = category.toLowerCase();
      
      if (selected === "veg") {
        matchesCategory = food.veg === true || cat === "veg" || food.name.toLowerCase().includes("veg") || food.name.toLowerCase().includes("paneer");
      } else if (selected === "non-veg") {
        matchesCategory = food.veg === false || cat === "non-veg" || cat === "chicken" || food.name.toLowerCase().includes("chicken") || food.name.toLowerCase().includes("egg");
      } else if (selected === "drinks") {
        matchesCategory = cat === "drinks" || cat === "water" || cat === "cold drink";
      } else if (selected === "desserts") {
        matchesCategory = cat === "desserts" || cat === "sweet";
      } else {
        matchesCategory = cat === selected || food.name.toLowerCase().includes(selected);
      }
    }
    
    return matchesSearch && matchesCategory && matchesVegMode(food);
  });

  // POPULAR DISHES (Ranked by highest rating)
  const popularDishes = foods
    .filter(matchesVegMode)
    .filter(f => f.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  // RECOMMENDED FOR YOU (Ranked by popularity or recent updates)
  const recommendedFoods = foods
    .filter(matchesVegMode)
    .filter(f => f.ratingCount >= 0)
    .sort((a, b) => b.ratingCount - a.ratingCount || new Date(b.updatedAt) - new Date(a.updatedAt));
  const visibleRecommendedFoods = recommendedFoods.slice(0, 4);
  const horizontalFoods = foods.filter(matchesVegMode).slice(0, 10);
  const visibleCategories = categoriesList.slice(0, 8);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const unreadNotificationCount = notifications.filter((item) => !(item.isRead || item.read)).length;

  const activeBannersList = banners.length > 0 ? banners : defaultBanners;
  const currentBanner = activeBannersList[currentBannerIdx];
  const cleanAddressPart = (value = "") => String(value)
    .replace(/\b(?:Jaipur|Rajasthan)\b/gi, "")
    .replace(/\s*,\s*,/g, ",")
    .replace(/^[\s,.-]+|[\s,.-]+$/g, "")
    .trim();
  const formatAddressLine = (addr) => {
    if (!addr) return "";
    return [addr.details, addr.city, addr.state].map(cleanAddressPart).filter(Boolean).join(", ");
  };
  const primaryAddress = (user.addresses || []).find(addr => addr.isPrimary) || (user.addresses || [])[0];
  const primaryAddressText = primaryAddress
    ? [primaryAddress.label, formatAddressLine(primaryAddress)].filter(Boolean).join(" - ")
    : "Select address";

  const getCategoryImage = (cat) => {
    if (cat.id === "All") return "/greengo-logo.svg";
    const selected = cat.id.toLowerCase();
    const match = foods.find((food) => {
      const foodCategory = (food.category || "").toLowerCase();
      if (foodCategory === selected) return true;
      if (selected === "drinks") return ["drinks", "water", "cold drink"].includes(foodCategory);
      if (selected === "non-veg") return ["non-veg", "chicken"].includes(foodCategory);
      return (food.name || "").toLowerCase().includes(selected);
    });
    const image = match?.categoryImage || match?.image || "";
    if (!image) return "";
    return image.startsWith("http") || image.startsWith("/") ? image : getImageUrl(image);
  };

  const getCartItem = (food) => cart.find((item) => item._id === food._id);

  const renderCartAction = (food) => {
    const cartItem = getCartItem(food);
    if (!cartItem) {
      return (
        <button
          onClick={() => updateQuantity(food, 1)}
          className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all"
        >
          + Add
        </button>
      );
    }

    return (
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => navigate("/user/cart")}
          className="px-2.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black shadow-sm"
        >
          Cart
        </button>
        <div className="flex items-center bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-800 rounded-xl p-0.5">
          <button
            onClick={() => updateQuantity(food, cartItem.qty - 1)}
            className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-300 font-extrabold flex items-center justify-center border border-slate-100 dark:border-slate-800"
          >
            -
          </button>
          <span className="font-black text-slate-800 dark:text-white px-2 text-xs min-w-7 text-center">
            {cartItem.qty}
          </span>
          <button
            onClick={() => updateQuantity(food, cartItem.qty + 1)}
            className="w-8 h-8 rounded-lg bg-brand-500 text-white font-extrabold flex items-center justify-center shadow-md shadow-brand-500/20"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const saveAddresses = async (addresses) => {
    const token = await getToken();
    const res = await fetch(`${API}/api/users/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ addresses })
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  };

  const setPrimaryAddress = async (index) => {
    const addresses = (user.addresses || []).map((addr, i) => ({ ...addr, isPrimary: i === index }));
    setUser({ ...user, addresses });
    await saveAddresses(addresses);
  };

  const addAddress = async () => {
    if (!newAddress.details.trim()) return;
    const addresses = [...(user.addresses || []), { ...newAddress, isPrimary: !(user.addresses || []).length }];
    setNewAddress({ label: "Home", details: "", city: "", state: "" });
    await saveAddresses(addresses);
  };

  return (
    <div className="max-w-7xl mx-auto w-full pb-10 px-2 sm:px-4 relative animate-fade-in transition-colors">
      
      {/* 1. HEADER SECTION */}
      <div className="flex items-center justify-between gap-3 py-4 mb-4 border-b border-slate-100 dark:border-slate-800/60">
        {/* Left: Branding & Location */}
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 overflow-hidden border border-brand-100 dark:border-brand-900 bg-white [&>span]:hidden">
            <img src="/greengo-logo.svg" alt="GreenGO" className="w-full h-full object-cover" />
            <span className="text-white text-xl">🍕</span>
          </div>
          <div className="min-w-0 relative flex-1">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-brand-500 text-xl sm:text-2xl tracking-tight">Green</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-xl sm:text-2xl tracking-tight">GO</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddressPicker(!showAddressPicker)}
              className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 font-bold max-w-[150px] sm:max-w-[260px]"
            >
              <MapPin size={11} className="text-brand-500 shrink-0" />
              <span className="truncate">{primaryAddressText}</span>
              <ChevronDown size={12} className="shrink-0" />
            </button>
            {showAddressPicker && (
              <div className="absolute left-0 top-full mt-3 w-[300px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] p-3">
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {(user.addresses || []).map((addr, index) => (
                    <button key={index} type="button" onClick={() => { setPrimaryAddress(index); setShowAddressPicker(false); }} className={`w-full text-left p-3 rounded-xl border transition-all ${addr.isPrimary ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">{addr.label || "Address"}</span>
                        {addr.isPrimary && <span className="text-[9px] font-black text-brand-600 dark:text-brand-400 uppercase">Primary</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold line-clamp-2 mt-1">{formatAddressLine(addr) || "Address details required"}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} placeholder="Home" className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none" />
                    <input value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="City" className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none" />
                  </div>
                  <input value={newAddress.details} onChange={(e) => setNewAddress({ ...newAddress, details: e.target.value })} placeholder="Full address" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none" />
                  <button type="button" onClick={addAddress} className="w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold flex items-center justify-center gap-1">
                    <Plus size={13} /> Add Address
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications Icon with unread badge */}
          <button
            onClick={() => navigate("/user/notifications")}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 relative"
          >
            <Bell size={16} />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* User Avatar */}
          <div 
            onClick={() => navigate("/user/profile")}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-extrabold cursor-pointer hover:scale-105 transition-transform"
          >
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="mb-6 flex items-stretch gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-rose-500" />
          </div>
          <input
            type="text"
            placeholder={'Search "bread"'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowAllFoods(false);
            }}
            className="w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 text-sm sm:text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 px-4 text-rose-500 border-l border-slate-100 dark:border-slate-800"
            title="Voice search"
          >
            <Mic size={20} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setVegMode((value) => !value);
            if (!vegMode && ["Non-Veg", "Chicken", "Kebabs"].includes(category)) setCategory("All");
          }}
          className="w-[74px] sm:w-24 rounded-2xl bg-amber-50 dark:bg-slate-900 border border-amber-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-1 px-1"
          aria-pressed={vegMode}
        >
          <span className={`text-[10px] sm:text-xs font-black leading-none ${vegMode ? "text-emerald-600" : "text-slate-500 dark:text-slate-300"}`}>VEG</span>
          <span className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 leading-none">MODE</span>
          <span className={`relative w-10 h-6 rounded-full transition-colors ${vegMode ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-700"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${vegMode ? "translate-x-[18px]" : "translate-x-0.5"}`} />
          </span>
        </button>
      </div>

      {/* 3. AUTO SLIDING OFFER BANNER */}
      {currentBanner && (
        <div className="relative h-44 sm:h-48 md:h-56 rounded-3xl overflow-hidden mb-6 shadow-md shadow-brand-500/5 transition-all animate-fade-in group">
          <img
            src={currentBanner.image.startsWith("http") ? currentBanner.image : getImageUrl(currentBanner.image)}
            alt={currentBanner.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent flex flex-col justify-center p-6 text-white">
            <span className="text-[10px] font-black tracking-widest text-brand-400 uppercase mb-1">{currentBanner.description}</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">{currentBanner.title}</h2>
            {currentBanner.discountText && (
              <span className="mt-2 text-xs font-black bg-brand-500 text-white px-2.5 py-1 rounded-md w-fit shadow-sm uppercase">
                {currentBanner.discountText}
              </span>
            )}
            <button 
              onClick={() => {
                if (currentBanner.code) {
                  navigator.clipboard.writeText(currentBanner.code);
                  alert(`Coupon code "${currentBanner.code}" copied to clipboard!`);
                }
              }}
              className="mt-4 bg-white hover:bg-slate-100 text-slate-950 px-4.5 py-2 rounded-xl text-xs font-extrabold w-fit transition-all active:scale-95 shadow-lg shadow-black/25"
            >
              {currentBanner.buttonText || "ORDER NOW"}
            </button>
          </div>
          
          {/* Slides dots */}
          <div className="absolute bottom-4 right-6 flex gap-1.5 z-10">
            {activeBannersList.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentBannerIdx === i ? "w-4.5 bg-brand-500" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. BUDGET ASSISTANT CARD */}
      <div className="bg-slate-90 bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-lg mb-8 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Glow behind */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-500/25 rounded-full blur-[40px] pointer-events-none" />
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-3xl">
            🤖
          </div>
          <div>
            <h3 className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
              Budget Assistant <span className="text-brand-400 text-xs font-black uppercase tracking-wider bg-brand-500/20 px-2 py-0.5 rounded-md">AI Smart</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5 font-semibold">Tell us your budget and we'll suggest matching combos & dishes for you!</p>
          </div>
        </div>

        <button 
          onClick={() => navigate("/user/budget-assistant")}
          className="shrink-0 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl transition-all active:scale-95 text-sm shadow-md shadow-brand-500/25"
        >
          Start Now
        </button>
      </div>

      {/* 5. FOOD CATEGORIES HORIZONTAL SLIDER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Food Categories</h3>
          <button
            type="button"
            onClick={() => setShowAllCategories(true)}
            className="text-xs font-black text-brand-600 dark:text-brand-300 flex items-center gap-1 px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/30"
          >
            See All <ChevronDown size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {visibleCategories.filter(cat => !(vegMode && ["Non-Veg", "Chicken", "Kebabs"].includes(cat.id))).map(cat => {
            const isSelected = category.toLowerCase() === cat.id.toLowerCase();
            const categoryImage = getCategoryImage(cat);
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  setShowAllFoods(false);
                }}
                className={`flex min-w-[76px] sm:min-w-[88px] flex-col items-center gap-2 transition-all select-none duration-300 ${
                  isSelected
                    ? "text-brand-600 dark:text-brand-300 scale-105 font-black"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                <span className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full border flex items-center justify-center overflow-hidden shadow-sm transition-all ${
                  isSelected
                    ? "bg-brand-500 border-brand-500 shadow-brand-500/25"
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700"
                }`}>
                  {categoryImage ? (
                    <img src={categoryImage} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className={`text-base font-black ${isSelected ? "text-white" : "text-slate-700 dark:text-slate-100"}`}>{cat.icon}</span>
                  )}
                </span>
                <span className="text-[11px] sm:text-xs font-extrabold tracking-wide text-center leading-tight">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showAllCategories && (
          <div className="fixed inset-0 z-[1800] flex items-end justify-center bg-slate-950/55 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              className="w-full max-w-3xl max-h-[82vh] bg-white dark:bg-slate-950 rounded-t-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="relative px-5 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAllCategories(false)}
                  className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl"
                  title="Close"
                >
                  <X size={26} />
                </button>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Cuisines and dishes</h3>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[68vh]">
                <div className="grid grid-cols-4 gap-x-3 gap-y-6">
                  {categoriesList.filter(cat => !(vegMode && ["Non-Veg", "Chicken", "Kebabs"].includes(cat.id))).map((cat) => {
                    const isSelected = category.toLowerCase() === cat.id.toLowerCase();
                    const categoryImage = getCategoryImage(cat);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => {
                          setCategory(cat.id);
                          setShowAllFoods(false);
                          setShowAllCategories(false);
                        }}
                        className={`min-w-0 rounded-2xl p-2 flex flex-col items-center gap-2 transition-all ${
                          isSelected
                            ? "bg-rose-50 dark:bg-rose-950/20 ring-1 ring-rose-300"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        <span className="w-full aspect-[1.35] rounded-xl flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900">
                          {categoryImage ? (
                            <img src={categoryImage} alt={cat.name} className="w-full h-full object-contain" />
                          ) : (
                            <Grid3X3 size={22} className="text-slate-400" />
                          )}
                        </span>
                        <span className={`w-full text-center text-[11px] sm:text-sm font-bold leading-tight break-words ${isSelected ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-slate-300"}`}>
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. POPULAR DISHES SECTION */}
      {category === "All" && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4.5">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Popular Dishes</h3>
            <button type="button" onClick={() => { setCategory("All"); setSearch(""); setShowAllFoods(true); }} className="text-xs font-black text-brand-600 dark:text-brand-300">See All</button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
            {popularDishes.map((food) => (
              <div 
                key={food._id} 
                className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 pb-5 border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden min-h-[390px]"
              >
                {/* Image & Buttons */}
                <div 
                  onClick={() => selectFoodDetails(food)}
                  className="relative h-40 w-full rounded-2xl overflow-hidden mb-4 bg-slate-50 dark:bg-slate-950 p-2 cursor-pointer flex items-center justify-center"
                >
                  <img
                    src={getImageUrl(food.image)}
                    alt={food.name}
                    className="max-w-full max-h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                  />
                  {/* Delivery time indicator */}
                  <div className="absolute bottom-2 left-2 bg-slate-950/95 dark:bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black text-white dark:text-slate-950 flex items-center gap-1 shadow-sm">
                    <Clock size={10} className="text-brand-400" />
                    <span>25-30 min</span>
                  </div>
                  {/* Rating badge */}
                  <div className="absolute top-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1 shadow-sm">
                    <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />
                    <span>{food.rating ? food.rating.toFixed(1) : "4.0"}</span>
                  </div>
                </div>

                {/* Content */}
                <h4 
                  onClick={() => selectFoodDetails(food)}
                  className="font-bold text-slate-900 dark:text-white text-base group-hover:text-brand-500 transition-colors line-clamp-1 mb-1 cursor-pointer"
                >
                  {food.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider mb-2.5">In Category: {food.category}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4.5 font-medium flex-1">{food.description}</p>
                
                {/* Actions */}
                <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 line-through leading-none">₹{Math.round(food.price * 1.25)}</span>
                    <span className="text-lg font-black text-slate-950 dark:text-white leading-none pt-1 tabular-nums">₹{food.price}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Wishlist */}
                    <button
                      onClick={() => toggleFavoriteFood(food._id)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Heart size={14} className={isFavorite(food._id) ? "fill-red-500 text-red-500" : ""} />
                    </button>

                    {renderCartAction(food)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. RECOMMENDED FOR YOU */}
      {category === "All" && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4.5">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Recommended For You</h3>
            <button type="button" onClick={() => { setCategory("All"); setSearch(""); setShowAllFoods(true); }} className="text-xs font-black text-brand-600 dark:text-brand-300">See All</button>
          </div>
          <div className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar snap-x pb-2">
            {visibleRecommendedFoods.map((food) => (
              <div 
                key={food._id} 
                className="min-w-[240px] sm:min-w-[260px] lg:min-w-[280px] snap-start bg-white dark:bg-slate-900 rounded-3xl p-4.5 pb-5 border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden min-h-[390px]"
              >
                {/* Image & Buttons */}
                <div 
                  onClick={() => selectFoodDetails(food)}
                  className="relative h-40 w-full rounded-2xl overflow-hidden mb-4 bg-slate-50 dark:bg-slate-950 p-2 cursor-pointer flex items-center justify-center"
                >
                  <img
                    src={getImageUrl(food.image)}
                    alt={food.name}
                    className="max-w-full max-h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                  />
                  {/* Delivery time indicator */}
                  <div className="absolute bottom-2 left-2 bg-slate-950/95 dark:bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black text-white dark:text-slate-950 flex items-center gap-1 shadow-sm">
                    <Clock size={10} className="text-brand-400" />
                    <span>20-25 min</span>
                  </div>
                  {/* Rating badge */}
                  <div className="absolute top-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1 shadow-sm">
                    <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />
                    <span>{food.rating ? food.rating.toFixed(1) : "4.3"}</span>
                  </div>
                </div>

                {/* Content */}
                <h4 
                  onClick={() => selectFoodDetails(food)}
                  className="font-bold text-slate-900 dark:text-white text-base group-hover:text-brand-500 transition-colors line-clamp-1 mb-1 cursor-pointer"
                >
                  {food.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider mb-2.5">In Category: {food.category}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4.5 font-medium flex-1">{food.description}</p>
                
                {/* Actions */}
                <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 line-through leading-none">₹{Math.round(food.price * 1.2)}</span>
                    <span className="text-lg font-black text-slate-950 dark:text-white leading-none pt-1 tabular-nums">₹{food.price}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Wishlist */}
                    <button
                      onClick={() => toggleFavoriteFood(food._id)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Heart size={14} className={isFavorite(food._id) ? "fill-red-500 text-red-500" : ""} />
                    </button>

                    {renderCartAction(food)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DYNAMIC PRODUCTS BY SELECTED CATEGORY OR SEARCH */}
      {(category !== "All" || search !== "" || showAllFoods) && (
        <div className="mb-10">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-4.5">
            {showAllFoods ? "All Products" : category !== "All" ? `${category} Products` : "Search Results"}
          </h3>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-brand-500">
                <UtensilsCrossed size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">No products found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mb-6 font-medium">Try clearing filters or checking other categories.</p>
              <Button onClick={() => {setSearch(""); setCategory("All"); setShowAllFoods(false);}} variant="secondary" className="rounded-xl text-xs">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredFoods.map((food) => (
                <div 
                  key={food._id} 
                  className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 pb-5 border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden min-h-[390px]"
                >
                  <div 
                    onClick={() => selectFoodDetails(food)}
                    className="relative h-40 w-full rounded-2xl overflow-hidden mb-4 bg-slate-50 dark:bg-slate-950 p-2 cursor-pointer flex items-center justify-center"
                  >
                    <img
                      src={getImageUrl(food.image)}
                      alt={food.name}
                      className="max-w-full max-h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-950/95 dark:bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black text-white dark:text-slate-950 flex items-center gap-1 shadow-sm">
                      <Clock size={10} className="text-brand-400" />
                      <span>20-30 min</span>
                    </div>
                    <div className="absolute top-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1 shadow-sm">
                      <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />
                      <span>{food.rating ? food.rating.toFixed(1) : "4.2"}</span>
                    </div>
                  </div>

                  <h4 
                    onClick={() => selectFoodDetails(food)}
                    className="font-bold text-slate-900 dark:text-white text-base group-hover:text-brand-500 transition-colors line-clamp-1 mb-1 cursor-pointer"
                  >
                    {food.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider mb-2.5">Category: {food.category}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4.5 font-medium flex-1">{food.description}</p>
                  
                  <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/50">
                    <span className="text-lg font-black text-slate-950 dark:text-white leading-none py-1 tabular-nums">₹{food.price}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleFavoriteFood(food._id)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Heart size={14} className={isFavorite(food._id) ? "fill-red-500 text-red-500" : ""} />
                      </button>

                      {renderCartAction(food)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FOOD DETAILS MODAL ── */}
      <AnimatePresence>
        {selectedFood && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800/60 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="relative h-64 sm:h-80 bg-slate-50 dark:bg-slate-900 shrink-0 flex items-center justify-center p-4">
                <img 
                  src={getImageUrl(selectedFood.image)} 
                  alt={selectedFood.name}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl"
                  onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Food'; }}
                />
                <button 
                  onClick={() => toggleFavoriteFood(selectedFood._id)}
                  className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-md hover:bg-white dark:hover:bg-slate-800 transition-colors animate-fade-in"
                >
                  <Heart 
                    size={20} 
                    className={isFavorite(selectedFood._id) ? "fill-red-500 text-red-500" : "text-slate-600 dark:text-slate-400"} 
                  />
                </button>
                <button 
                  onClick={() => setSelectedFood(null)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-md hover:bg-white dark:hover:bg-slate-800 transition-colors animate-fade-in"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedFood.name}</h2>
                    <span className="text-2xl font-black text-brand-600 shrink-0">₹{selectedFood.price}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 rounded-xl w-fit border border-slate-100 dark:border-slate-800/60">
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                    <span>{selectedFood.rating > 0 ? `${selectedFood.rating.toFixed(1)} ★ (${selectedFood.ratingCount} reviews)` : "No reviews yet"}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{selectedFood.description || "No description available."}</p>
                </div>

                <hr className="border-slate-100 dark:border-slate-800/60" />

                {/* Reviews List */}
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Customer Reviews</h3>
                  {foodReviews.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-800/60">
                      <p className="text-slate-500 dark:text-slate-400 font-medium">No reviews for this dish yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {foodReviews.map((r) => (
                        <div key={r._id} className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100/60 dark:border-slate-800/50">
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-650 dark:text-brand-400 font-black text-sm flex items-center justify-center border border-brand-100 dark:border-brand-900/60">
                                {r.userName ? r.userName[0].toUpperCase() : "U"}
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-800 dark:text-white text-sm">{r.userName}</h5>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                  {new Date(r.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-0.5 text-yellow-400 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 px-2 py-1 rounded-lg">
                              {[...Array(r.rating)].map((_, idx) => (
                                <Star key={idx} size={12} fill="currentColor" className="text-yellow-400" />
                              ))}
                              {[...Array(5 - r.rating)].map((_, idx) => (
                                <Star key={idx} size={12} className="text-slate-200 dark:text-slate-800" />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium">"{r.reviewText}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add to Cart button */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
                {cart.find(i => i._id === selectedFood._id) ? (
                  <div className="flex items-center justify-between w-full bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 rounded-2xl p-2 shadow-sm">
                    <button
                      onClick={() => updateQuantity(selectedFood, (cart.find(i => i._id === selectedFood._id)?.qty || 0) - 1)}
                      className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-extrabold flex items-center justify-center transition-all select-none border border-slate-100 dark:border-slate-800"
                    >
                      -
                    </button>
                    <span className="font-black text-slate-900 dark:text-white px-4 text-lg">
                      {cart.find(i => i._id === selectedFood._id)?.qty || 0} in Cart
                    </span>
                    <button
                      onClick={() => updateQuantity(selectedFood, (cart.find(i => i._id === selectedFood._id)?.qty || 0) + 1)}
                      className="w-12 h-12 rounded-xl bg-brand-500 text-white hover:bg-brand-600 font-extrabold flex items-center justify-center transition-all select-none shadow-md shadow-brand-500/20"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <Button onClick={() => updateQuantity(selectedFood, 1)} className="w-full gap-2 py-4 text-base rounded-2xl">
                    <ShoppingCart size={20} />
                    Add to Cart • ₹{selectedFood.price}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Cart Strip */}
      {cartCount > 0 && (
        <div className="fixed bottom-22 sm:bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-lg bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-800/80 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center justify-between z-[999] animate-fade-in">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {cartCount} {cartCount === 1 ? "Item" : "Items"} Added
            </span>
            <span className="text-lg font-black text-brand-400">
              ₹{cartTotal} <span className="text-xs text-slate-400 font-normal">plus taxes</span>
            </span>
          </div>
          <Button onClick={() => navigate("/user/cart")} className="gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/25">
            View Cart
            <ShoppingCart size={18} />
          </Button>
        </div>
      )}

      {/* BUDGET ASSISTANT MODAL FLOW */}
      <BudgetAssistant
        isOpen={isBudgetOpen}
        onClose={() => setIsBudgetOpen(false)}
        foods={foods}
        onAddToCart={updateQuantity}
      />
    </div>
  );
}

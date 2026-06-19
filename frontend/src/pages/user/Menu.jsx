import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ShoppingCart, UtensilsCrossed, Star, X, Heart, 
  MapPin, Bell, Sun, Moon, Sparkles, Navigation, Clock, ChevronDown, Plus, Mic, Grid3X3, Wallet, ChevronRight, Trash2, Users, Flame
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";
import { getToken } from "../../utils/getToken";
import BudgetAssistant from "../../components/dashboard/BudgetAssistant";

const API = getApiUrl();
const MotionDiv = motion.div;

/**
 * ComboItemsTicker Sub-component
 * 
 * Alternates display of items included in a food combo pack using a timed interval and framer-motion transitions.
 */
function ComboItemsTicker({ items = [] }) {
  const comboItems = items.filter((item) => item?.name);
  const [activeIndex, setActiveIndex] = useState(0);

  // Rotate through combo components every 3 seconds
  useEffect(() => {
    if (comboItems.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((index) => (index + 1) % comboItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [comboItems.length]);

  if (comboItems.length === 0) return null;

  const activeItem = comboItems[activeIndex] || comboItems[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Combo includes</span>
        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">{activeIndex + 1}/{comboItems.length}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeItem.name}-${activeIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex items-center justify-between gap-3"
        >
          <span className="truncate text-xs font-black text-slate-900 dark:text-white">{activeItem.name}</span>
          <span className="shrink-0 text-xs font-black text-emerald-700 dark:text-emerald-300">Rs. {activeItem.price || 0}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const defaultCategoriesList = [
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

/**
 * Menu Component
 * 
 * The main storefront dashboard page. Contains custom search inputs, auto-sliding deal banners,
 * horizontal category lists, popular/recommended lists, comprehensive details modal with variant customization/review lists,
 * and a floating cart summary drawer.
 */
export default function Menu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  /* --- STATE DECLARATIONS --- */
  
  // foods: Full inventory downloaded from API (restored from cache initially)
  const [foods, setFoods] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_foods");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  // search: Raw input text matching product labels
  const [search, setSearch] = useState("");
  // category: Active filtering tag category ("All", "Pizza", "Favorites", etc.)
  const [category, setCategory] = useState("All");
  // vegMode: Boolean filter to exclude non-veg dishes
  const [vegMode, setVegMode] = useState(false);
  // vegModeNotice: Floating notification message for veg toggle action
  const [vegModeNotice, setVegModeNotice] = useState("");
  // showAllCategories: Controls see-all overlay modal for categories
  const [showAllCategories, setShowAllCategories] = useState(false);
  // showAllFoods: Expands items section lists
  const [showAllFoods, setShowAllFoods] = useState(false);
  // loading: Spinner visibility tracker (false if cache exists)
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_foods");
      return cached ? JSON.parse(cached).length === 0 : true;
    } catch {
      return true;
    }
  });
  
  // selectedFood: Food item object actively opened in Details modal
  const [selectedFood, setSelectedFood] = useState(null);
  // selectedVariant: Active customization sub-option chosen (e.g. Regular, Medium, Large)
  const [selectedVariant, setSelectedVariant] = useState(null);
  // selectedFoodQty: Custom increment counter for active modal card
  const [selectedFoodQty, setSelectedFoodQty] = useState(1);
  // activeFoodCollection: Details list overlay for "See All" triggers on card grids
  const [activeFoodCollection, setActiveFoodCollection] = useState(null);
  // foodReviews: Downloaded review threads for selected modal product
  const [foodReviews, setFoodReviews] = useState([]);
  // favorites: Array of food identifiers liked by user
  const [favorites, setFavorites] = useState([]);
  // cart: Array containing quantities and names of checkout products
  const [cart, setCart] = useState([]);
  
  // isBudgetOpen: Controls state visibility for BudgetAssistant component
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);

  // notifications: Alerts sent to customer
  const [notifications, setNotifications] = useState([]);
  // user: Primary profile details, including address book list
  const [user, setUser] = useState({});
  // showAddressPicker: Toggles location chooser dropdown in navigation bar
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  // newAddress: Temporary form inputs for adding shipping locations
  const [newAddress, setNewAddress] = useState({ label: "Home", details: "", city: "", state: "" });

  // banners: Deals and promos list from backend
  const [banners, setBanners] = useState([]);
  // currentBannerIdx: Slide position of the hero offer banner
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);

  const [dynamicCategories, setDynamicCategories] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_categories");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const categoriesList = useMemo(() => {
    return dynamicCategories.length ? dynamicCategories : defaultCategoriesList;
  }, [dynamicCategories]);

  // defaultBanners: Fallbacks in case database banners are empty
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

  /* --- DATA FETCHING & EFFECTS --- */

  // Synchronizes category selection from location query string changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get("category");
    if (catParam) {
      setCategory(catParam);
    }
  }, [location.search]);

  // Clears veg mode bubble alert after a short duration
  useEffect(() => {
    if (!vegModeNotice) return;
    const timer = setTimeout(() => setVegModeNotice(""), 2800);
    return () => clearTimeout(timer);
  }, [vegModeNotice]);

  // Load menu assets and customer configs on initialization
  useEffect(() => {
    loadFoods();
    loadCategories();
    loadFavorites();
    loadCart();
    loadBanners();
    loadNotifications();
    loadUser();

    window.addEventListener("address-updated", loadUser);
    return () => {
      window.removeEventListener("address-updated", loadUser);
    };
  }, []);

  // Sets up slideshow timers for rotating hero discount banners
  useEffect(() => {
    const bannerCount = banners.length > 0 ? banners.length : defaultBanners.length;
    const timer = setInterval(() => {
      setCurrentBannerIdx((prevIdx) => (prevIdx + 1) % bannerCount);
    }, 3000);
    return () => clearInterval(timer);
  }, [banners, defaultBanners.length]);

  /**
   * loadUser: Fetches current customer profile and normalizes addresses array.
   */
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

  /**
   * loadNotifications: Retrieves system notices.
   */
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

  /**
   * loadBanners: Downloads home banners.
   */
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

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API}/api/categories`);
      if (res.ok) {
        const data = await res.json();
        const formatted = [
          { id: "All", name: "All", icon: "All", image: "/greengo-logo.png" },
          ...data.map(c => ({
            id: c.name,
            name: c.name,
            icon: c.name.slice(0, 2).toUpperCase(),
            image: c.image ? (c.image.startsWith("http") ? c.image : `${API}/uploads/${c.image}`) : ""
          }))
        ];
        setDynamicCategories(formatted);
        localStorage.setItem("cached_categories", JSON.stringify(formatted));
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  /**
   * loadCart: Retrieves items from LocalStorage and sets React state.
   */
  const loadCart = () => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(data);
  };

  /**
   * loadFavorites: Syncs loved menu list identifiers.
   */
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

  /* --- EVENT HANDLERS & HELPERS --- */

  /**
   * toggleFavoriteFood: Requests server toggle favorite dish status.
   */
  const toggleFavoriteFood = async (foodId) => {
    if (!requireLogin("/user/wishlist")) return;
    try {
      const token = await getToken();
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

  const isFavorite = useCallback((foodId) => {
    return favorites.includes(foodId);
  }, [favorites]);

  /**
   * loadFoods: Requests food items database.
   */
  const loadFoods = async () => {
    try {
      const res = await fetch(`${API}/api/foods`);
      if (res.ok) {
        const data = await res.json();
        setFoods(data);
        localStorage.setItem("cached_foods", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Failed to load foods:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * getVariantOptions: Formats list of pricing choices inside complex dish records.
   */
  const getVariantOptions = useCallback((food) => {
    const variants = Array.isArray(food?.variants) ? food.variants : [];
    return variants
      .map((variant) => {
        if (typeof variant === "string") {
          return { name: variant, price: Number(food.price || 0) };
        }
        return {
          name: String(variant?.name || "").trim(),
          price: Number(variant?.price || food.price || 0),
        };
      })
      .filter((variant) => variant.name);
  }, []);

  const hasVariantChoices = useCallback((food) => getVariantOptions(food).length > 0, [getVariantOptions]);

  /**
   * getFoodCategories: Collects categories list associated with a dish.
   */
  const getFoodCategories = useCallback((food) => {
    const categories = Array.isArray(food?.categories) && food.categories.length
      ? food.categories
      : [food?.category].filter(Boolean);
    return [...new Set(categories.map((item) => String(item || "").trim()).filter(Boolean))];
  }, []);

  const getFoodCategoryLabel = useCallback((food) => getFoodCategories(food).join(", ") || "Menu", [getFoodCategories]);

  const getComboItems = useCallback((food) => (
    Array.isArray(food?.comboItems) ? food.comboItems.filter((item) => item?.name) : []
  ), []);

  const getComboTotalPrice = useCallback((food) => getComboItems(food)
    .reduce((sum, item) => sum + Number(item.price || 0), 0), [getComboItems]);

  const getServingLabel = (servingSize) => {
    const next = Number(servingSize || 1);
    return next >= 4 ? "4+ Person" : `${next} Person`;
  };

  /**
   * withSelectedVariant: Enhances cart keys for variant-customized items to prevent overlap.
   */
  const withSelectedVariant = (food, variant = null) => {
    const selected = variant || getVariantOptions(food)[0] || null;
    if (!selected) return food;
    return {
      ...food,
      _cartId: `${food._id}:${selected.name}`,
      foodId: food._id,
      price: selected.price,
      variantName: selected.name,
    };
  };

  /**
   * updateQuantity: Syncs item choices into local storage and fires sync events.
   */
  const updateQuantity = (food, newQty) => {
    let currentCart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartId = food._cartId || food._id;
    const existingIndex = currentCart.findIndex(i => i._id === cartId);

    if (newQty <= 0) {
      if (existingIndex > -1) {
        currentCart.splice(existingIndex, 1);
      }
    } else {
      if (existingIndex > -1) {
        currentCart[existingIndex].qty = newQty;
      } else {
        currentCart.push({
          _id: cartId,
          foodId: food.foodId || food._id,
          name: food.variantName ? `${food.name} (${food.variantName})` : food.name,
          baseName: food.name,
          variantName: food.variantName || "",
          price: food.price,
          packingCharge: food.packingCharge || 0,
          servingSize: food.servingSize || 1,
          image: food.image,
          category: food.category,
          categories: getFoodCategories(food),
          qty: newQty
        });
      }
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));
    setCart(currentCart);
    window.dispatchEvent(new Event("cart-updated"));
  };

  /**
   * selectFoodDetails: Selects dish for displaying deep descriptions and downloads critiques.
   */
  const selectFoodDetails = async (food) => {
    setSelectedFood(food);
    setSelectedVariant(getVariantOptions(food)[0] || null);
    setSelectedFoodQty(1);
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

  const isNonVegFood = useCallback((food) => {
    const cat = getFoodCategories(food).join(" ").toLowerCase();
    const name = String(food.name || "").toLowerCase();
    if (food.veg === "egg") return false;
    return food.veg === false || food.veg === "false" || cat.includes("non-veg") || cat.includes("chicken") || name.includes("chicken") || name.includes("mutton");
  }, [getFoodCategories]);

  const isVegFood = useCallback((food) => !isNonVegFood(food), [isNonVegFood]);

  const matchesVegMode = useCallback((food) => !vegMode || isVegFood(food), [isVegFood, vegMode]);

  /* --- MEMOIZED DERIVED VALUES --- */

  // Performs searching, category filtering, and veg mode checking
  const filteredFoods = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const selectedCategory = category.toLowerCase();
    return foods.filter(food => {
      const foodName = (food.name || "").toLowerCase();
      const matchesSearch = foodName.includes(searchText) ||
                            (food.description || "").toLowerCase().includes(searchText);

      let matchesCategory = false;
      if (category === "All") {
        matchesCategory = true;
      } else if (category === "Favorites") {
        matchesCategory = isFavorite(food._id);
      } else {
        const foodCategories = getFoodCategories(food).map((item) => item.toLowerCase());
        const hasCategory = (value) => foodCategories.includes(value);
        const hasCategoryText = (value) => foodCategories.some((item) => item.includes(value));

        if (selectedCategory === "veg") {
          matchesCategory = food.veg === true || hasCategory("veg") || foodName.includes("veg") || foodName.includes("paneer");
        } else if (selectedCategory === "non-veg") {
          matchesCategory = food.veg === false || hasCategory("non-veg") || hasCategory("chicken") || foodName.includes("chicken") || foodName.includes("egg");
        } else if (selectedCategory === "drinks") {
          matchesCategory = hasCategory("drinks") || hasCategory("water") || hasCategory("cold drink");
        } else if (selectedCategory === "desserts") {
          matchesCategory = hasCategory("desserts") || hasCategory("sweet");
        } else {
          matchesCategory = hasCategory(selectedCategory) || hasCategoryText(selectedCategory) || foodName.includes(selectedCategory);
        }
      }

      return matchesSearch && matchesCategory && matchesVegMode(food);
    });
  }, [category, foods, getFoodCategories, isFavorite, matchesVegMode, search]);

  const popularDishes = useMemo(() => foods
    .filter(matchesVegMode)
    .filter(f => Number(f.rating || 0) >= 2.5)
    .sort((a, b) => b.rating - a.rating), [foods, matchesVegMode]);

  const recommendedFoods = useMemo(() => {
    const hour = new Date().getHours();
    let activeCategory = "";
    if (hour >= 6 && hour < 11) {
      activeCategory = "Breakfast";
    } else if (hour >= 11 && hour < 16) {
      activeCategory = "Lunch";
    } else if (hour >= 16 && hour < 23) {
      activeCategory = "Dinner";
    }

    return foods
      .filter(matchesVegMode)
      .filter(f => f.ratingCount >= 0)
      .filter(f => {
        const cat = f.mealCategory || "Anytime";
        if (cat === "Anytime") return true;
        return cat === activeCategory;
      })
      .sort((a, b) => b.ratingCount - a.ratingCount || new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [foods, matchesVegMode]);

  const allProductFoods = useMemo(() => foods.filter(matchesVegMode), [foods, matchesVegMode]);
  const comboFoods = useMemo(() => foods.filter(matchesVegMode).filter(f => f.foodType === "combo"), [foods, matchesVegMode]);
  const visibleCategories = categoriesList.slice(0, 8);

  const foodById = useMemo(() => new Map(foods.map((food) => [food._id, food])), [foods]);
  const cartItemsWithDetails = useMemo(() => cart.map((item) => {
    const foodDetails = foodById.get(item._id);
    return {
      ...item,
      category: item.category || foodDetails?.category,
      categories: item.categories || foodDetails?.categories,
      image: item.image || foodDetails?.image,
      name: item.name || foodDetails?.name,
    };
  }), [cart, foodById]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + ((Number(item.price || 0) + Number(item.packingCharge || 0)) * item.qty), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);
  const cartPreviewItem = cartItemsWithDetails[0];
  const orderedCategories = useMemo(() => [...new Set(cartItemsWithDetails.flatMap((item) => (
    Array.isArray(item.categories) && item.categories.length ? item.categories : [item.category]
  )).filter(Boolean))], [cartItemsWithDetails]);
  const unreadNotificationCount = useMemo(() => notifications.filter((item) => !(item.isRead || item.read)).length, [notifications]);
  const isLoggedIn = Boolean(localStorage.getItem("token") && localStorage.getItem("auth_state") === "logged_in");

  /**
   * requireLogin: Restricts account actions to logged-in customers.
   */
  const requireLogin = (from = "/user/menu") => {
    if (isLoggedIn) return true;
    navigate("/", {
      state: {
        from: { pathname: from },
        loginRequired: true,
      },
    });
    return false;
  };

  const activeBannersList = banners.length > 0 ? banners : defaultBanners;
  const currentBanner = activeBannersList[currentBannerIdx];
  const selectedFoodVariantOptions = selectedFood ? getVariantOptions(selectedFood) : [];
  const selectedFoodCartItem = selectedFood && selectedVariant
    ? cart.find((item) => item._id === `${selectedFood._id}:${selectedVariant.name}`)
    : selectedFood
      ? cart.find((item) => item._id === selectedFood._id || item.foodId === selectedFood._id)
      : null;
  const selectedFoodPrice = selectedVariant?.price || Number(selectedFood?.price || 0);

  const cleanAddressPart = (value = "") => String(value)
    .replace(/\b(?:Khagaria|)\b/gi, "")
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

  /**
   * getCategoryImage: Assigns images based on matches within the dynamic food list.
   */
  const getCategoryImage = (cat) => {
    if (cat.image) return cat.image;
    if (cat.id === "All") return "/greengo-logo.png";
    const selected = cat.id.toLowerCase();
    const match = foods.find((food) => {
      const foodCategories = getFoodCategories(food).map((item) => item.toLowerCase());
      if (foodCategories.includes(selected)) return true;
      if (selected === "drinks") return foodCategories.some((item) => ["drinks", "water", "cold drink"].includes(item));
      if (selected === "non-veg") return foodCategories.some((item) => ["non-veg", "chicken"].includes(item));
      return (food.name || "").toLowerCase().includes(selected);
    });
    const image = match?.categoryImage || match?.image || "";
    if (!image) return "";
    return image.startsWith("http") || image.startsWith("/") ? image : getImageUrl(image);
  };

  const getCartItem = (food) => cart.find((item) => item._id === food._id || item.foodId === food._id);

  const clearCart = () => {
    localStorage.removeItem("cart");
    setCart([]);
    window.dispatchEvent(new Event("cart-updated"));
  };

  const selectOrderedCategory = (categoryName) => {
    setCategory(categoryName);
    setShowAllFoods(false);
    setActiveFoodCollection(null);
    setShowAllCategories(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * renderCartAction: Render standard Add/Subtract increment counters on cards.
   */
  const renderCartAction = (food) => {
    const cartItem = getCartItem(food);
    if (!cartItem) {
      return (
        <button
          onClick={() => {
            hasVariantChoices(food) ? selectFoodDetails(food) : updateQuantity(food, 1);
          }}
          className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-black text-[8px] sm:text-[10px] md:text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all shrink-0"
        >
          + Add
        </button>
      );
    }

    return (
      <div className="flex items-center gap-1 shrink-0">
        <div className="flex items-center bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-800 rounded-lg p-0.5">
          <button
            onClick={() => {
              hasVariantChoices(food) ? selectFoodDetails(food) : updateQuantity(food, cartItem.qty - 1);
            }}
            className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-md bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-300 font-extrabold flex items-center justify-center border border-slate-100 dark:border-slate-800 text-[8px] sm:text-[9px]"
          >
            -
          </button>
          <span className="font-black text-slate-800 dark:text-white px-0.5 sm:px-1 text-[9px] sm:text-[10px] min-w-3 sm:min-w-4 text-center">
            {cartItem.qty}
          </span>
          <button
            onClick={() => {
              hasVariantChoices(food) ? selectFoodDetails(food) : updateQuantity(food, cartItem.qty + 1);
            }}
            className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-md bg-brand-500 text-white font-extrabold flex items-center justify-center shadow-sm text-[8px] sm:text-[9px]"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const openFoodCollection = (title, items) => {
    setActiveFoodCollection({ title, items });
  };

  /**
   * renderFoodCard: Render individual product elements inside scrolling streams.
   */
  const renderFoodCard = (food, options = {}) => {
    const {
      className = "",
      deliveryTime = "15-20 min",
      oldPriceFactor = 1.25,
      categoryPrefix = "Category:",
    } = options;
    const preparationTime = food.preparationTime || deliveryTime;

    return (
      <div
        key={food._id}
        className={`min-w-0 bg-white dark:bg-slate-900 rounded-2xl p-1.5 pb-2 md:p-2.5 border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col group relative overflow-hidden h-full ${className}`}
      >
        {/* Favorite & Rating overlays */}
        <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1">
          <button
            onClick={() => toggleFavoriteFood(food._id)}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border border-slate-100 dark:border-slate-800/50 text-slate-500 hover:text-red-500 transition-colors shadow-sm"
          >
            <Heart size={10} className={isFavorite(food._id) ? "fill-red-500 text-red-500" : ""} />
          </button>
        </div>

        <div className="absolute top-1.5 right-1.5 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[8px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-0.5 shadow-sm">
          <Star size={8} className="text-amber-500 fill-amber-500 shrink-0" />
          <span>{food.rating ? food.rating.toFixed(1) : "5.0"}</span>
        </div>

        {/* Food Image */}
        <div
          onClick={() => selectFoodDetails(food)}
          className="relative h-24 sm:h-28 md:h-32 w-full rounded-xl overflow-hidden mb-2 bg-slate-50 dark:bg-slate-950 cursor-pointer flex items-center justify-center"
        >
          <img
            src={getImageUrl(food.image)}
            alt={food.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
          />
        </div>

        {/* Title & Category info */}
        <div className="px-0.5 flex-1 flex flex-col">
          <h4
            onClick={() => selectFoodDetails(food)}
            className="font-black text-slate-900 dark:text-white text-[10px] sm:text-xs md:text-sm group-hover:text-brand-500 transition-colors line-clamp-1 mb-0.5 cursor-pointer leading-tight"
            title={food.name}
          >
            {food.name}
          </h4>
          <div className="flex items-center gap-1 mb-1">
            <span className={`w-2 h-2 flex items-center justify-center border ${isVegFood(food) ? "border-emerald-500" : "border-red-500"} p-0.5 rounded-sm shrink-0`}>
              <span className={`w-0.5 h-0.5 rounded-full ${isVegFood(food) ? "bg-emerald-500" : "bg-red-500"}`} />
            </span>
            <span className="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold truncate">
              {getFoodCategoryLabel(food)}
            </span>
          </div>

          {/* Prep time badge */}
          <div className="flex items-center gap-0.5 mb-1.5 bg-slate-50 dark:bg-slate-950 px-1 py-0.5 rounded-md w-fit text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-400 leading-none">
            <Clock size={8} className="text-brand-500 shrink-0" />
            <span>{preparationTime}</span>
          </div>
        </div>

        {/* Price & Action button */}
        <div className="flex items-center justify-between gap-1 mt-auto pt-1.5 border-t border-slate-100 dark:border-slate-800/50 px-0.5">
          <div className="flex flex-col">
            {food.originalPrice > food.price ? (
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 line-through leading-none mb-0.5">
                ₹{food.originalPrice}
              </span>
            ) : food.price && oldPriceFactor ? (
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 line-through leading-none mb-0.5">
                ₹{Math.round(food.price * oldPriceFactor)}
              </span>
            ) : null}
            <span className="text-[11px] sm:text-xs md:text-sm font-black text-slate-950 dark:text-white leading-none tabular-nums">
              ₹{food.price}
            </span>
          </div>

          {renderCartAction(food)}
        </div>
      </div>
    );
  };

  /**
   * saveAddresses: Saves address updates on servers.
   */
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
      
      {/* --- 1. HEADER SECTION --- */}
      {/* Tailwind: sticky top-0 keeps dashboard header pinned at the top. z-[9999] floats it above scroll elements */}
      <div className="sticky top-0 z-[9999] hidden md:flex items-center justify-between gap-3 py-2.5 mb-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        {/* Left: Branding logo & clickable Shipping Address popover */}
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 overflow-hidden border border-brand-100 dark:border-brand-900 bg-white [&>span]:hidden">
            <img src="/greengo-logo.png" alt="GreenGo" className="w-full h-full object-cover" />
            <span className="text-white text-xl">🍕</span>
          </div>
          <div className="min-w-0 relative flex-1">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-brand-500 text-xl sm:text-2xl tracking-tight">Green</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-xl sm:text-2xl tracking-tight">GO</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!requireLogin("/user/profile")) return;
                setShowAddressPicker(!showAddressPicker);
              }}
              className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 font-bold max-w-[150px] sm:max-w-[260px]"
            >
              <MapPin size={11} className="text-brand-500 shrink-0" />
              <span className="truncate">{primaryAddressText}</span>
              <ChevronDown size={12} className="shrink-0" />
            </button>
            {/* Popover selector modal overlay for registered address labels */}
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

        {/* Right Actions: Theme Toggle, Notifications, User Profile Avatar */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <button
            onClick={toggleTheme}
            className="w-9 h-11 sm:w-10 sm:h-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={() => requireLogin("/user/notifications") && navigate("/user/notifications")}
            className="w-9 h-11 sm:w-10 sm:h-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 relative"
          >
            <Bell size={16} />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          <MotionDiv 
            onClick={() => requireLogin("/user/profile") && navigate("/user/profile")}
            animate={vegMode ? {
              scale: [1, 1.08, 1],
              boxShadow: ["0px 0px 0px rgba(16, 185, 129, 0)", "0px 0px 12px rgba(16, 185, 129, 0.6)", "0px 0px 0px rgba(16, 185, 129, 0)"]
            } : { scale: 1 }}
            transition={vegMode ? {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
            className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center text-sm font-extrabold cursor-pointer ${
              vegMode ? "ring-2 ring-emerald-400" : "hover:scale-105 transition-transform"
            }`}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </MotionDiv>
        </div>
      </div>

      {/* --- 2. SEARCH BAR SECTION --- */}
      <div className="mb-3.5 flex items-stretch gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0 h-14">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-rose-500" />
          </div>
          <input
            type="text"
            placeholder={'Search "bread"'}
            value={search}
            readOnly
            onFocus={() => navigate("/user/search")}
            onClick={() => navigate("/user/search")}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowAllFoods(false);
            }}
            className="w-full h-full pl-12 pr-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 text-sm sm:text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 px-4 text-rose-500 border-l border-slate-100 dark:border-slate-800"
            title="Voice search"
          >
            <Mic size={20} />
          </button>
        </div>
        
        {/* Toggle vegMode with animated slider switch */}
        <button
          type="button"
          onClick={() => {
            const nextVegMode = !vegMode;
            setVegMode(nextVegMode);
            setVegModeNotice(nextVegMode ? "Veg mode is ON" : "Veg mode is OFF");
            if (nextVegMode && ["Non-Veg", "Chicken", "Kebabs"].includes(category)) setCategory("All");
          }}
          className={`relative overflow-hidden w-[72px] sm:w-[86px] h-14 rounded-2xl border shadow-sm flex flex-col items-center justify-center gap-1.5 px-1 transition-all duration-300 ${
            vegMode
              ? "border-emerald-300 bg-emerald-500/10 text-emerald-700 shadow-sm shadow-emerald-500/5 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "border-slate-200 bg-white text-slate-650 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350"
          }`}
          aria-pressed={vegMode}
        >
          <div className="flex items-center gap-1">
            <span className={`w-3.5 h-3.5 border flex items-center justify-center rounded-sm p-0.5 transition-colors ${vegMode ? "border-emerald-600 dark:border-emerald-500" : "border-slate-400 dark:border-slate-600"}`}>
              <span className={`w-1.5 h-1.5 rounded-full transition-all ${vegMode ? "bg-emerald-600 dark:bg-emerald-500 scale-100" : "bg-slate-400 dark:bg-slate-600 scale-75"}`} />
            </span>
            <span className="text-[10px] sm:text-[11px] font-black tracking-wider leading-none">VEG</span>
          </div>
          <span className={`relative h-5 w-10 rounded-full transition-colors duration-300 ${vegMode ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}>
            <span className={`absolute top-[3px] left-[3px] h-3.5 w-3.5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${vegMode ? "translate-x-[20px]" : "translate-x-0"}`}>
              {vegMode && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
            </span>
          </span>
        </button>
      </div>

      {/* Floating alert for Veg Mode changes */}
      <AnimatePresence>
        {vegModeNotice && (
          <MotionDiv
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className="fixed left-1/2 top-20 z-[1200] -translate-x-1/2 rounded-2xl border border-emerald-100 bg-white px-4 py-2.5 text-sm font-black text-emerald-700 shadow-xl shadow-emerald-950/10 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-300"
          >
            {vegModeNotice}
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* --- 3. AUTO SLIDING OFFER HERO BANNER --- */}
      {currentBanner && (
        <div className="relative w-full aspect-[2.3/1] sm:aspect-[3/1] md:aspect-[3.5/1] rounded-3xl overflow-hidden mb-4 shadow-md shadow-brand-500/5 transition-all animate-fade-in group bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
          <img
            src={currentBanner.image.startsWith("http") ? currentBanner.image : getImageUrl(currentBanner.image)}
            alt={currentBanner.title}
            className="absolute inset-0 h-full w-full object-cover z-0"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'; }}
          />
          
          {/* Text Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent flex flex-col justify-center p-4 sm:p-6 md:p-8 text-white z-10">
            {currentBanner.description && (
              <span className="text-[9px] sm:text-[10px] md:text-xs font-black tracking-widest text-brand-400 uppercase mb-0.5 sm:mb-1">
                {currentBanner.description}
              </span>
            )}
            {currentBanner.title && (
              <h2 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-black tracking-tight leading-tight max-w-[55%]">
                {currentBanner.title}
              </h2>
            )}
            {currentBanner.discountText && (
              <span className="mt-1 sm:mt-2 text-[10px] md:text-xs font-black bg-brand-500 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md w-fit shadow-sm uppercase">
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
              className="mt-2 sm:mt-3 bg-white hover:bg-slate-100 text-slate-950 px-3.5 py-1.5 sm:px-4.5 sm:py-2 rounded-xl text-[9px] sm:text-xs font-extrabold w-fit transition-all active:scale-95 shadow-lg shadow-black/25"
            >
              {currentBanner.buttonText || "ORDER NOW"}
            </button>
          </div>
          
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

      {/* --- 4. BUDGET ASSISTANT CARD SECTION --- */}
      <div className="mb-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Wallet size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-950 dark:text-white text-sm sm:text-base tracking-tight flex items-center gap-1 leading-none">
              Budget Assistant
              <Sparkles size={14} className="text-green-600 fill-green-600 shrink-0" />
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/user/budget-assistant")}
          className="shrink-0 px-4 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
        >
          Start <span className="hidden sm:inline">Now</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* --- 5. FOOD CATEGORIES HORIZONTAL SLIDER --- */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Food Categories</h3>
          <button
            type="button"
            onClick={() => setShowAllCategories(true)}
            className="text-xs font-black text-brand-600 dark:text-brand-300 flex items-center gap-1 px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/30"
          >
            See All <ChevronDown size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 flex-nowrap whitespace-nowrap">
          {visibleCategories.filter(cat => !(vegMode && ["Non-Veg", "Chicken", "Kebabs"].includes(cat.id))).map(cat => {
            const isSelected = category.toLowerCase() === cat.id.toLowerCase();
            const hasOrderedItems = orderedCategories.some((itemCategory) => itemCategory.toLowerCase() === cat.id.toLowerCase());
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
                    : hasOrderedItems
                      ? "text-emerald-600 dark:text-emerald-300"
                      : "text-slate-700 dark:text-slate-200"
                }`}
              >
                <span className={`relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full border flex items-center justify-center overflow-hidden shadow-sm transition-all ${
                  isSelected
                    ? "bg-brand-500 border-brand-500 shadow-brand-500/25"
                    : hasOrderedItems
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 ring-2 ring-emerald-400/25"
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700"
                }`}>
                  {categoryImage ? (
                    <img src={categoryImage} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className={`text-base font-black ${isSelected ? "text-white" : "text-slate-700 dark:text-slate-100"}`}>{cat.icon}</span>
                  )}
                  {hasOrderedItems && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-lg bg-emerald-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white">
                      Cart
                    </span>
                  )}
                </span>
                <span className="text-[11px] sm:text-xs font-extrabold tracking-wide text-center leading-tight">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories modal listing overlay */}
      <AnimatePresence>
        {showAllCategories && (
          <div className="fixed inset-0 z-[1800] flex items-end justify-center bg-slate-950/55 backdrop-blur-sm">
            <MotionDiv
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              className="w-full max-w-3xl max-h-[82vh] bg-white dark:bg-slate-950 rounded-t-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="relative px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Cuisines and dishes</h3>
                <button
                  type="button"
                  onClick={() => setShowAllCategories(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200 flex items-center justify-center shadow-sm"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[68vh]">
                <div className="grid grid-cols-4 gap-x-3 gap-y-6">
                  {categoriesList.filter(cat => !(vegMode && ["Non-Veg", "Chicken", "Kebabs"].includes(cat.id))).map((cat) => {
                    const isSelected = category.toLowerCase() === cat.id.toLowerCase();
                    const hasOrderedItems = orderedCategories.some((itemCategory) => itemCategory.toLowerCase() === cat.id.toLowerCase());
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
                            : hasOrderedItems
                              ? "bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-300"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        <span className="relative w-full aspect-[1.35] rounded-xl flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900">
                          {categoryImage ? (
                            <img src={categoryImage} alt={cat.name} className="w-full h-full object-contain" />
                          ) : (
                            <Grid3X3 size={22} className="text-slate-400" />
                          )}
                          {hasOrderedItems && (
                            <span className="absolute right-1 top-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[8px] font-black uppercase text-white">
                              Cart
                            </span>
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
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* --- 6. POPULAR DISHES GRID --- */}
      {category === "All" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Popular Dishes</h3>
            <button type="button" onClick={() => openFoodCollection("Popular Dishes", popularDishes)} className="text-xs font-black text-brand-600 dark:text-brand-300">See All</button>
          </div>
          <div className="flex gap-2 sm:gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2 flex-nowrap">
            {popularDishes.slice(0, 8).map((food) => (
              <div key={food._id} className="w-[115px] sm:w-[155px] md:w-[200px] shrink-0">
                {renderFoodCard(food, { deliveryTime: "25-30 min", oldPriceFactor: 1.25 })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- 7. RECOMMENDED FOR YOU GRID --- */}
      {category === "All" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Recommended For You</h3>
            <button type="button" onClick={() => openFoodCollection("Recommended For You", recommendedFoods)} className="text-xs font-black text-brand-600 dark:text-brand-300">See All</button>
          </div>
          <div className="flex gap-2 sm:gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2 flex-nowrap">
            {recommendedFoods.slice(0, 8).map((food) => (
              <div key={food._id} className="w-[115px] sm:w-[155px] md:w-[200px] shrink-0">
                {renderFoodCard(food, { deliveryTime: "20-25 min", oldPriceFactor: 1.2 })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- 8. COMBO ITEMS SECTION --- */}
      {category === "All" && search === "" && comboFoods.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Combo Items</h3>
            <button type="button" onClick={() => openFoodCollection("Combo Items", comboFoods)} className="text-xs font-black text-brand-600 dark:text-brand-300">See All</button>
          </div>
          <div className="flex gap-2 sm:gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2 flex-nowrap">
            {comboFoods.slice(0, 8).map((food) => (
              <div key={food._id} className="w-[115px] sm:w-[155px] md:w-[200px] shrink-0">
                {renderFoodCard(food, { deliveryTime: "25-35 min", oldPriceFactor: 1.2 })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- 9. ALL PRODUCTS LIST SECTION --- */}
      {category === "All" && search === "" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">All Products</h3>
            <button type="button" onClick={() => openFoodCollection("All Products", allProductFoods)} className="text-xs font-black text-brand-600 dark:text-brand-300">See All</button>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : allProductFoods.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 p-8 text-center">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No products available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4 lg:gap-6 py-2">
              {allProductFoods.slice(0, 12).map((food) => (
                <div key={food._id} className="w-full">
                  {renderFoodCard(food, { deliveryTime: "20-30 min", oldPriceFactor: 1.15, categoryPrefix: "Category:" })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- 9. DYNAMIC PRODUCTS FILTER LIST --- */}
      {(category !== "All" || search !== "") && (
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
                  className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 pb-5 border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden min-h-[410px] h-full"
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
                      <span>{food.preparationTime || "20-30 min"}</span>
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
                  <p className="text-[11px] text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider mb-2.5">Category: {getFoodCategoryLabel(food)}</p>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-600 ring-1 ring-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">
                      <Users size={10} /> {getServingLabel(food.servingSize)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[10px] font-black text-orange-700 ring-1 ring-orange-100 dark:bg-orange-950/20 dark:text-orange-300 dark:ring-orange-900/40">
                      <Flame size={10} /> {food.spiceLevel || "Medium"}
                    </span>
                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-300 dark:ring-indigo-900/40">
                      {food.sizeLevel || "Medium"}
                    </span>
                  </div>
                  {food.foodType === "combo" && getComboItems(food).length > 0 && (
                    <div className="mb-3 space-y-2">
                      <ComboItemsTicker items={getComboItems(food)} />
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-black text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                        <span>{getComboItems(food).length} items total ₹{getComboTotalPrice(food)}</span>
                        {getComboTotalPrice(food) > Number(food.price || 0) && (
                          <span className="text-emerald-600 dark:text-emerald-300">Save ₹{getComboTotalPrice(food) - Number(food.price || 0)}</span>
                        )}
                      </div>
                    </div>
                  )}
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

      {/* --- 10. PRODUCT COLLECTION POPUP --- */}
      <AnimatePresence>
        {activeFoodCollection && (
          <div className="fixed inset-0 z-[1900] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4">
            <MotionDiv
              initial={{ opacity: 0, y: 80, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.98 }}
              className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:rounded-[2rem]"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {activeFoodCollection.title}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                    {activeFoodCollection.items.length} products available
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveFoodCollection(null)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label="Close product list"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {activeFoodCollection.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 bg-slate-50 py-16 text-center dark:border-slate-800 dark:bg-slate-900/50">
                    <UtensilsCrossed size={34} className="mb-3 text-brand-500" />
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">No products found</h4>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Try another section or clear filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {activeFoodCollection.items.map((food) =>
                      renderFoodCard(food, {
                        className: "min-w-0",
                        deliveryTime: activeFoodCollection.title === "Popular Dishes" ? "25-30 min" : "20-30 min",
                        oldPriceFactor: activeFoodCollection.title === "Popular Dishes" ? 1.25 : 1.2,
                        categoryPrefix: activeFoodCollection.title === "All Products" ? "Category:" : "In Category:",
                      })
                    )}
                  </div>
                )}
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* --- 11. FOOD DETAILS & CUSTOMISATION MODAL --- */}
      <AnimatePresence>
        {selectedFood && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <MotionDiv 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800/60 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Banner Image */}
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

              {/* Scrollable details contents */}
              <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedFood.name}</h2>
                    <span className="text-2xl font-black text-brand-600 shrink-0">₹{selectedFoodPrice}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 rounded-xl w-fit border border-slate-100 dark:border-slate-800/60">
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                    <span>{selectedFood.rating > 0 ? `${selectedFood.rating.toFixed(1)} ★ (${selectedFood.ratingCount} reviews)` : "No reviews yet"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800">
                    <Clock size={14} /> {selectedFood.preparationTime || "20-30 min"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800">
                    <Users size={14} /> {getServingLabel(selectedFood.servingSize)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 px-3 py-2 text-xs font-black text-orange-700 ring-1 ring-orange-100 dark:bg-orange-950/20 dark:text-orange-300 dark:ring-orange-900/40">
                    <Flame size={14} /> {selectedFood.spiceLevel || "Medium"}
                  </span>
                  <span className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-300 dark:ring-indigo-900/40">
                    {selectedFood.sizeLevel || "Medium"}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{selectedFood.description || "No description available."}</p>
                </div>

                {/* Combo detail items checklist */}
                {selectedFood.foodType === "combo" && getComboItems(selectedFood).length > 0 && (
                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Combo Details</h3>
                        <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                          {getComboItems(selectedFood).length} items for {getServingLabel(selectedFood.servingSize)}
                        </p>
                      </div>
                      <span className="rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-300">
                        Save Rs. {Math.max(0, getComboTotalPrice(selectedFood) - selectedFoodPrice)}
                      </span>
                    </div>
                    <ComboItemsTicker items={getComboItems(selectedFood)} />
                    <div className="mt-4 divide-y divide-emerald-100 overflow-hidden rounded-2xl bg-white dark:divide-emerald-900/40 dark:bg-slate-950">
                      {getComboItems(selectedFood).map((item) => (
                        <div key={item.name} className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-bold">
                          <span className="min-w-0 truncate text-slate-700 dark:text-slate-200">{item.name}</span>
                          <span className="shrink-0 text-slate-900 dark:text-white">Rs. {item.price || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variant choice picker */}
                {selectedFoodVariantOptions.length > 0 && (
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Customisation</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">Select any 1</p>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                      {selectedFoodVariantOptions.map((variant) => {
                        const active = selectedVariant?.name === variant.name;
                        return (
                          <button
                            key={variant.name}
                            type="button"
                            onClick={() => setSelectedVariant(variant)}
                            className={`flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 text-left last:border-b-0 dark:border-slate-800 ${
                              active ? "bg-brand-50/70 dark:bg-brand-950/20" : "bg-white dark:bg-slate-950"
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${selectedFood.veg === false ? "border-red-500" : "border-emerald-500"}`}>
                                <span className={`h-2.5 w-2.5 rounded-full ${selectedFood.veg === false ? "bg-red-500" : "bg-emerald-500"}`} />
                              </span>
                              <span className="truncate text-base font-black text-slate-900 dark:text-white">{variant.name}</span>
                            </span>
                            <span className="flex shrink-0 items-center gap-3">
                              <span className="text-base font-black text-slate-700 dark:text-slate-200">₹{variant.price}</span>
                              <span className={`h-6 w-6 rounded-full border-2 ${active ? "border-brand-500 bg-brand-500 shadow-inner" : "border-slate-300 dark:border-slate-600"}`}>
                                {active && <span className="block h-full w-full rounded-full border-4 border-white dark:border-slate-950" />}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <hr className="border-slate-100 dark:border-slate-800/60" />

                {/* Customer Review Logs */}
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

              {/* Action Add/Update Toolbar */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 shrink-0 items-center rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => setSelectedFoodQty((qty) => Math.max(1, qty - 1))}
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-black text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/30"
                    >
                      -
                    </button>
                    <span className="w-10 text-center text-lg font-black text-slate-900 dark:text-white">{selectedFoodQty}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFoodQty((qty) => qty + 1)}
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-black text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/30"
                    >
                      +
                    </button>
                  </div>
                  <Button
                    onClick={() => {
                      updateQuantity(withSelectedVariant(selectedFood, selectedVariant), selectedFoodQty);
                      setSelectedFood(null);
                    }}
                    className="flex-1 gap-2 py-4 text-base rounded-2xl"
                  >
                    <ShoppingCart size={20} />
                    {selectedFoodCartItem ? "Update Item" : "Add Item"} | ₹{selectedFoodPrice * selectedFoodQty}
                  </Button>
                </div>
              </div>

              {/* Add to Cart fallback action panel */}
              <div className="hidden p-6 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
                {cart.find(i => i._id === selectedFood._id) ? (
                  <div className="flex items-center justify-between w-full bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 rounded-2xl p-2 shadow-sm">
                    <button
                      onClick={() => {
                        updateQuantity(selectedFood, (cart.find(i => i._id === selectedFood._id)?.qty || 0) - 1);
                      }}
                      className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-extrabold flex items-center justify-center transition-all select-none border border-slate-100 dark:border-slate-800"
                    >
                      -
                    </button>
                    <span className="font-black text-slate-900 dark:text-white px-4 text-lg">
                      {cart.find(i => i._id === selectedFood._id)?.qty || 0} in Cart
                    </span>
                    <button
                      onClick={() => {
                        updateQuantity(selectedFood, (cart.find(i => i._id === selectedFood._id)?.qty || 0) + 1);
                      }}
                      className="w-12 h-12 rounded-xl bg-brand-500 text-white hover:bg-brand-600 font-extrabold flex items-center justify-center transition-all select-none shadow-md shadow-brand-500/20"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      updateQuantity(selectedFood, 1);
                    }}
                    className="w-full gap-2 py-4 text-base rounded-2xl"
                  >
                    <ShoppingCart size={20} />
                    Add to Cart • ₹{selectedFood.price}
                  </Button>
                )}
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* --- 12. FLOATING BOTTOM CART PREVIEW BAR --- */}
      {/* Tailwind: fixed bottom-[5.25rem] pins it right above bottom navigation tab bars on mobile viewports */}
      {cartCount > 0 && (
        <div className="fixed bottom-[5.25rem] left-1/2 z-[999] w-[94%] max-w-3xl -translate-x-1/2 animate-fade-in overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-100 bg-white shadow-2xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-950 sm:bottom-20 md:bottom-6">
          <div className="flex items-center gap-2 p-2.5 sm:gap-4 sm:p-4">
            <button
              type="button"
              onClick={() => cartPreviewItem?.category && selectOrderedCategory(cartPreviewItem.category)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <img
                src={getImageUrl(cartPreviewItem?.image)}
                alt={cartPreviewItem?.name || "Selected food"}
                className="h-10 w-14 shrink-0 rounded-2xl border border-slate-100 bg-slate-50 object-cover dark:border-slate-800 dark:bg-slate-900 sm:h-14 sm:w-20"
                onError={(e) => { e.target.src = "https://placehold.co/120x120?text=Food"; }}
              />
              <div className="min-w-0">
                <p className="truncate text-base font-black text-slate-900 dark:text-white sm:text-lg">
                  {cartPreviewItem?.name}
                  {cart.length > 1 ? ` +${cart.length - 1} more` : ""}
                </p>
                <p className="hidden truncate text-xs font-bold text-slate-500 dark:text-slate-400 sm:block sm:text-sm">
                  {cartItemsWithDetails.map((item) => item.name).join(", ")}
                </p>
                <div className="mt-1 hidden max-w-full gap-1.5 overflow-x-auto no-scrollbar sm:flex">
                  {orderedCategories.map((categoryName) => (
                    <span
                      key={categoryName}
                      onClick={(event) => {
                        event.stopPropagation();
                        selectOrderedCategory(categoryName);
                      }}
                      className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800"
                    >
                      {categoryName}
                    </span>
                  ))}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => requireLogin("/user/checkout") && navigate("/user/checkout")}
              className="shrink-0 rounded-2xl bg-brand-500 px-3 py-2.5 text-center font-black text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 active:scale-95 sm:min-w-[170px] sm:px-6 sm:py-3"
            >
              <span className="block text-[10px] sm:text-sm">
                {cartCount} {cartCount === 1 ? "item" : "items"} | ₹{cartTotal}
              </span>
              <span className="block text-sm leading-tight sm:text-2xl">Checkout</span>
            </button>

            <button
              type="button"
              onClick={clearCart}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition-all hover:bg-rose-100 active:scale-95 dark:bg-rose-950/30 dark:text-rose-300 sm:h-16 sm:w-16"
              aria-label="Clear cart"
              title="Clear cart"
            >
              <Trash2 size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      )}

      {/* --- 13. BUDGET ASSISTANT POPUP FLOW --- */}
      <BudgetAssistant
        isOpen={isBudgetOpen}
        onClose={() => setIsBudgetOpen(false)}
        foods={foods}
        onAddToCart={updateQuantity}
      />
    </div>
  );
}

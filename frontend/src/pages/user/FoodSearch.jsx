import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, Mic, Search, ShoppingCart, SlidersHorizontal, Sparkles, X, Heart, Star, Clock, Users, Flame, Grid3X3 } from "lucide-react";
import Button from "../../components/ui/Button";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";

const API = getApiUrl();

// Quick suggestions tags displayed underneath the search box when empty
const quickPrompts = ["Light meals", "Need coffee ASAP", "Breakfast in bed", "Pizza cravings"];

const MotionDiv = motion.div;

function ComboItemsTicker({ items = [] }) {
  const comboItems = items.filter((item) => item?.name);
  const [activeIndex, setActiveIndex] = useState(0);

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

/* --- HELPERS & UTILITIES --- */

// Lowercases and trims text to simplify search matches
function normalize(value = "") {
  return String(value).toLowerCase().trim();
}

function isNonVegFood(food) {
  const cat = String(food.category || "").toLowerCase();
  const name = String(food.name || "").toLowerCase();
  return food.veg === false || food.veg === "false" || cat.includes("non-veg") || cat.includes("chicken") || name.includes("chicken") || name.includes("mutton");
}

/**
 * distanceRank: Scores how close a food item's text matches the search query.
 * Lower scores denote closer matches (e.g. 0 for exact match, up to 5 for no prefix match).
 */
function distanceRank(food, query) {
  const name = normalize(food.name);
  const category = normalize(food.category);
  const q = normalize(query);
  if (!q) return 0;
  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  if (category.startsWith(q)) return 2;
  if (name.includes(q)) return 3;
  if (category.includes(q)) return 4;
  return 5;
}

/**
 * FoodSearch Component
 * 
 * Provides interactive search input and smart distance ranking for dishes, including autocomplete dropdown lists,
 * category shortcut selection, veg filters, and a bottom floating cart preview toolbar.
 */
export default function FoodSearch() {
  const navigate = useNavigate();

  /* --- STATE DECLARATIONS --- */
  // searchParams: Controls the React Router query parameter ?q=... in the URL
  const [searchParams, setSearchParams] = useSearchParams();
  // inputRef: Points directly to the Search Input Element for auto-focusing on mount
  const inputRef = useRef(null);
  // foods: Array of products loaded from backend server
  const [foods, setFoods] = useState([]);
  // cart: Array containing active checkout items from local storage
  const [cart, setCart] = useState([]);
  // query: Current query search text in the input box
  const [query, setQuery] = useState(searchParams.get("q") || "");
  // activeCategory: Controls the horizontal sub-category selector filters
  const [activeCategory, setActiveCategory] = useState("All");
  // loading: Page spinner state while foods download from API
  const [loading, setLoading] = useState(true);
  const [dbCategories, setDbCategories] = useState([]);

  // Active filters states
  const [filterUnder100, setFilterUnder100] = useState(false);
  const [filterGreatOffers, setFilterGreatOffers] = useState(false);
  const [filterPureVeg, setFilterPureVeg] = useState(false);

  // Selected food item actively opened in details modal
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedFoodQty, setSelectedFoodQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [foodReviews, setFoodReviews] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState(() => {
    return JSON.parse(localStorage.getItem("recentSearches")) || [];
  });

  const saveRecentSearch = (searchQuery) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 3);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  };

  /* --- DATA FETCHING & EFFECTS --- */

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const startVoiceSearch = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    try {
      // Proactively request microphone permission using standard Web API.
      // This triggers the native browser/WebView permission prompt.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream tracks immediately so SpeechRecognition can use the microphone
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.error("Microphone permission request failed:", err);
      alert("Microphone permission is required for voice search. Please allow microphone access.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          alert("Microphone permission is denied. Please allow microphone access in your settings.");
        } else if (event.error === "network") {
          alert("Voice search requires an active internet connection.");
        } else if (event.error === "no-speech") {
          alert("No speech detected. Please try speaking again.");
        } else {
          alert(`Voice search error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQuery(transcript);
          saveRecentSearch(transcript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleVoiceSearchClick = () => {
    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };

  // Runs on mount: Loads foods list, populates cart state, and focuses search input
  useEffect(() => {
    loadFoods();
    loadCategories();
    loadCart();
    setTimeout(() => inputRef.current?.focus(), 80);

    if (searchParams.get("voice") === "true") {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("voice");
      setSearchParams(newParams, { replace: true });
      setTimeout(() => {
        startVoiceSearch();
      }, 300);
    }
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API}/api/categories`);
      if (res.ok) setDbCategories(await res.json());
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  // Syncs input query state with the browser location URL search parameter ?q=
  useEffect(() => {
    const next = query.trim();
    if (next) setSearchParams({ q: next }, { replace: true });
    else setSearchParams({}, { replace: true });
  }, [query, setSearchParams]);

  /**
   * loadFoods: Requests menu list from API.
   */
  const loadFoods = async () => {
    try {
      const res = await fetch(`${API}/api/foods`);
      if (res.ok) setFoods(await res.json());
    } catch (err) {
      console.error("Failed to load foods:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews whenever a food item is selected
  useEffect(() => {
    if (!selectedFood) {
      setFoodReviews([]);
      setSelectedVariant(null);
      setSelectedFoodQty(1);
      return;
    }

    const loadReviews = async () => {
      try {
        const res = await fetch(`${API}/api/reviews/food/${selectedFood._id}`);
        if (res.ok) setFoodReviews(await res.json());
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }
    };

    loadReviews();

    // Default variant configuration
    const variants = getVariantOptions(selectedFood);
    if (variants.length > 0) {
      setSelectedVariant(variants[0]);
    }
  }, [selectedFood]);

  // Utility helpers matching Menu.jsx detail modal
  const getVariantOptions = (food) => {
    if (!food) return [];
    if (Array.isArray(food.variants) && food.variants.length > 0) return food.variants;
    if (food.sizePrice && typeof food.sizePrice === "object") {
      return Object.entries(food.sizePrice)
        .filter(([_, price]) => price !== null && price !== undefined)
        .map(([name, price]) => ({ name, price: Number(price) }));
    }
    return [];
  };

  const getComboItems = (food) => {
    return Array.isArray(food?.comboItems) ? food.comboItems : [];
  };

  const getComboTotalPrice = (food) => {
    return getComboItems(food).reduce((sum, item) => sum + Number(item.price || 0), 0);
  };

  const getServingLabel = (serv) => {
    if (!serv) return "1 Person";
    if (String(serv).toLowerCase().includes("person") || String(serv).toLowerCase().includes("people")) return serv;
    return `${serv} Person`;
  };

  const withSelectedVariant = (food, variant) => {
    if (!food) return null;
    if (!variant) return food;
    return {
      ...food,
      _id: `${food._id}:${variant.name}`,
      foodId: food._id,
      variantName: variant.name,
      price: variant.price
    };
  };

  // Sync details variant selection cart match
  const selectedFoodVariantOptions = selectedFood ? getVariantOptions(selectedFood) : [];
  const selectedFoodCartItem = selectedFood && selectedVariant
    ? cart.find((item) => item._id === `${selectedFood._id}:${selectedVariant.name}`)
    : selectedFood
      ? cart.find((item) => item._id === selectedFood._id || item.foodId === selectedFood._id)
      : null;
  const selectedFoodPrice = selectedVariant?.price || Number(selectedFood?.price || 0);

  /**
   * loadCart: Retrieves items from LocalStorage and sets React state.
   */
  const loadCart = () => {
    setCart(JSON.parse(localStorage.getItem("cart")) || []);
  };

  /* --- EVENT HANDLERS --- */

  /**
   * updateQuantity: Modifies quantity for items in cart, saving updates in localStorage
   * and notifying other components via the window event.
   */
  const updateQuantity = (food, newQty) => {
    const currentCart = JSON.parse(localStorage.getItem("cart")) || [];
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
        category: food.category,
        qty: newQty
      });
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));
    setCart(currentCart);
    window.dispatchEvent(new Event("cart-updated"));
  };

  /* --- MEMOIZED DERIVED VALUES --- */

  // Extracts unique categories list from foods for bubble representation
  const categories = useMemo(() => {
    const map = new Map();
    foods.forEach((food) => {
      const name = food.category || "Other";
      if (!map.has(name)) {
        const match = dbCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
        const imageUrl = match?.image 
          ? (match.image.startsWith("http") ? match.image : `${API}/uploads/${match.image}`)
          : (food.categoryImage || food.image || "");
        map.set(name, imageUrl);
      }
    });
    return [
      { name: "All Food", image: "/logo/final-logo.png" },
      ...Array.from(map, ([name, image]) => ({ name, image }))
    ];
  }, [foods, dbCategories]);

  // Builds fuzzy search suggestions sorted by distanceRank for autocomplete dropdowns
  const [showSuggestions, setShowSuggestions] = useState(true);
  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q || !showSuggestions) return [];
    const dishSuggestions = foods
      .filter((food) => normalize(food.name).includes(q) || normalize(food.category).includes(q))
      .sort((a, b) => distanceRank(a, query) - distanceRank(b, query))
      .slice(0, 6);
    const categorySuggestions = categories
      .filter((cat) => cat.name !== "All Food" && normalize(cat.name).includes(q))
      .slice(0, 3)
      .map((cat) => ({ _id: `category-${cat.name}`, name: cat.name, category: "Category", image: cat.image, isCategory: true }));
    return [...dishSuggestions, ...categorySuggestions];
  }, [foods, categories, query, showSuggestions]);

  // Dynamically extracts categories that have dishes matching the typed query
  const matchingCategories = useMemo(() => {
    const q = normalize(query);
    const source = q
      ? foods.filter((food) => normalize(food.name).includes(q) || normalize(food.category).includes(q) || normalize(food.description).includes(q))
      : foods;
    const queryWords = q.split(/\s+/).filter(Boolean);
    const derivedNames = source.map((food) => {
      let name = String(food.name || food.category || "Dish");
      queryWords.forEach((word) => {
        name = name.replace(new RegExp(word, "ig"), "");
      });
      return name.replace(/\s+/g, " ").trim();
    }).filter((name) => name && normalize(name) !== q);
    return ["All", ...new Set([...source.map((food) => food.category || "Other"), ...derivedNames])].slice(0, 12);
  }, [foods, query]);

  // Filters and sorts the foods list to show in grid based on query and selected category
  const visibleFoods = useMemo(() => {
    const q = normalize(query);
    return foods
      .filter((food) => {
        const matchesQuery = !q || q === "all food" || normalize(food.name).includes(q) || normalize(food.category).includes(q) || normalize(food.description).includes(q);
        const active = normalize(activeCategory);
        let matchesCategory = false;
        if (activeCategory === "All" || activeCategory === "All Food") {
          matchesCategory = true;
        } else if (active === "veg") {
          matchesCategory = !isNonVegFood(food);
        } else if (active === "non-veg") {
          matchesCategory = isNonVegFood(food);
        } else {
          matchesCategory = normalize(food.category || "Other") === active || normalize(food.name).includes(active);
        }
        
        // Apply rupee filter <= 100
        if (filterUnder100 && Number(food.price) > 100) {
          return false;
        }

        // Apply great offers filter (featured or discount)
        if (filterGreatOffers && !food.featured) {
          return false;
        }

        // Apply pure veg filter
        if (filterPureVeg && food.veg !== true && food.veg !== "true") {
          return false;
        }

        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        const aAvail = a.isAvailable !== false ? 1 : 0;
        const bAvail = b.isAvailable !== false ? 1 : 0;
        if (aAvail !== bAvail) return bAvail - aAvail;
        return distanceRank(a, query) - distanceRank(b, query) || Number(b.rating || 0) - Number(a.rating || 0);
      });
  }, [foods, query, activeCategory, filterUnder100, filterGreatOffers, filterPureVeg]);

  // Active Category reset effect bypassed to prevent reset during categories filters selection

  // Memoized related foods builder
  const relatedFoods = useMemo(() => {
    if (!query || visibleFoods.length === 0) return [];
    
    // Check if the current search matches fast food or thali specifically
    const lowerQuery = query.toLowerCase();
    
    let targets = [];
    if (lowerQuery.includes("burger") || lowerQuery.includes("fastfood") || lowerQuery.includes("pizza") || lowerQuery.includes("chaomin") || lowerQuery.includes("chowmein") || lowerQuery.includes("noodle") || lowerQuery.includes("cold drink") || lowerQuery.includes("coke")) {
      targets = ["pizza", "burger", "chowmein", "chaomin", "noodle", "french fries", "cold drink", "coke", "fastfood"];
    } else if (lowerQuery.includes("thali") || lowerQuery.includes("rice") || lowerQuery.includes("dal") || lowerQuery.includes("paneer") || lowerQuery.includes("mushroom") || lowerQuery.includes("sabji") || lowerQuery.includes("roti")) {
      targets = ["rice", "dal", "paneer", "mushroom", "roti", "thali", "sabji", "chili combo"];
    }

    const visibleIds = new Set(visibleFoods.map(f => f._id));
    return foods.filter(f => {
      if (visibleIds.has(f._id)) return false;
      const name = f.name.toLowerCase();
      const cat = (f.category || "").toLowerCase();
      
      if (targets.length > 0) {
        return targets.some(target => name.includes(target) || cat.includes(target));
      }
      
      return visibleFoods.some(vf => (vf.category && vf.category === f.category));
    }).slice(0, 3); // limit to 3 related foods
  }, [foods, query, visibleFoods]);

  const cartCount = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);

  /* --- NAVIGATION & SELECTION HANDLERS --- */

  const chooseSuggestion = (item) => {
    setQuery(item.name);
    saveRecentSearch(item.name);
    setActiveCategory(item.isCategory ? item.name : "All");
    setShowSuggestions(false);
  };

  const chooseCategory = (name) => {
    setActiveCategory(name);
    // Setting query to name if it is not "All" to show proper filter label
    setQuery(name === "All" ? "" : name);
    if (name !== "All") saveRecentSearch(name);
    setShowSuggestions(false);
  };

  const goCheckout = () => {
    if (cartCount > 0) navigate("/user/checkout");
  };

  return (
    /* --- MAIN LAYOUT WRAPPER --- */
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 md:px-6">
      
      {/* --- STICKY SEARCH BAR HEADER --- */}
      <div className="sticky top-0 z-30 -mx-4 bg-slate-50/95 px-4 pb-3 pt-1.5 backdrop-blur-md dark:bg-slate-900/95 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex max-w-4xl mx-auto items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-1.5 shadow-sm transition-all focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25 dark:border-slate-800 dark:bg-slate-950">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 transition-colors dark:text-slate-200 dark:hover:bg-slate-900"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <Search size={20} className="shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveCategory("All");
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                saveRecentSearch(query);
                setShowSuggestions(false);
              }
            }}
            placeholder="Search delicious food..."
            className="min-w-0 flex-1 bg-transparent text-base font-extrabold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white sm:text-lg"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory("All");
                setShowSuggestions(true);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors dark:hover:bg-slate-900"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={handleVoiceSearchClick}
            className={`flex h-10 w-10 shrink-0 items-center justify-center border-l border-slate-100 pl-3 transition-colors dark:border-slate-800 ${
              isListening ? "text-rose-600 animate-pulse" : "text-brand-500 hover:text-brand-600"
            }`}
            title={isListening ? "Listening... Click to stop" : "Voice search"}
          >
            <Mic size={20} />
          </button>
        </div>
      </div>

      {/* --- QUICK PROMPTS / RECENT SEARCHES INSPIRATION TAGS --- */}
      {!query && (
        <section className="mb-8 overflow-hidden max-w-4xl mx-auto">
          <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {recentSearches.length > 0 ? (
              recentSearches.map((searchItem) => (
                <button
                  key={searchItem}
                  type="button"
                  onClick={() => {
                    setQuery(searchItem);
                    setShowSuggestions(false);
                    saveRecentSearch(searchItem);
                  }}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 flex items-center gap-1.5"
                >
                  <Search size={12} className="text-slate-400" />
                  {searchItem}
                </button>
              ))
            ) : (
              quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setQuery(prompt);
                    setShowSuggestions(false);
                    saveRecentSearch(prompt);
                  }}
                  className="shrink-0 rounded-full border border-brand-100 hover:border-brand-300 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition-all hover:bg-brand-50/30 dark:border-brand-900/40 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-brand-950/20"
                >
                  <Sparkles size={14} className="inline text-brand-500" />
                  {prompt}
                </button>
              ))
            )}
          </div>
        </section>
      )}

      {/* --- AUTO-COMPLETE SEARCH SUGGESTIONS POPUP --- */}
      {query && suggestions.length > 0 && (
        <section className="mb-8 rounded-3xl border border-slate-100 bg-white p-2 shadow-lg dark:border-slate-800/80 dark:bg-slate-950">
          {suggestions.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => chooseSuggestion(item)}
              className="flex w-full items-center gap-3.5 rounded-2xl p-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-905/70"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-center">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  className="h-full w-full object-cover rounded-full"
                  onError={(e) => { e.target.src = "https://placehold.co/120x120?text=Food"; }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black text-slate-900 dark:text-white">{item.name}</p>
                <p className="text-xs font-bold text-slate-405 dark:text-slate-400">{item.isCategory ? "Category" : "Dish"}</p>
              </div>
              <ChevronRight size={18} className="text-slate-300 dark:text-slate-700" />
            </button>
          ))}
        </section>
      )}

      {/* --- CATEGORY HORIZONTAL SLIDING LIST --- */}
      {!query && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-black text-slate-900 dark:text-white tracking-tight">Food Categories</h2>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="flex shrink-0 flex-col items-center gap-2">
                  <div className="h-20 w-20 rounded-full bg-slate-150 animate-pulse dark:bg-slate-800 sm:h-[72px] sm:w-[72px]" />
                  <div className="h-3 w-14 rounded bg-slate-150 animate-pulse dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 flex-nowrap whitespace-nowrap scroll-smooth">
              {categories.map((cat) => {
                const isSelected = activeCategory.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button 
                    key={cat.name} 
                    type="button" 
                    onClick={() => chooseCategory(cat.name === "All Food" ? "All" : cat.name)} 
                    className={`flex min-w-[76px] sm:min-w-[88px] flex-col items-center gap-2 transition-all select-none duration-300 ${
                      isSelected
                        ? "text-brand-600 dark:text-brand-300 scale-105 font-black"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <span className={`relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full border flex items-center justify-center overflow-hidden shadow-sm transition-all ${
                      isSelected
                        ? "bg-brand-500 border-brand-500 shadow-brand-500/25"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700"
                    }`}>
                      <img
                        src={cat.image.startsWith("/") ? cat.image : getImageUrl(cat.image)}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => { e.target.src = "https://placehold.co/160x160?text=Food"; }}
                      />
                    </span>
                    <span className="text-xs font-bold tracking-tight line-clamp-1 w-20 text-center">
                      {cat.name === "All Food" ? "All" : cat.name}
                    </span>
                  </button>
                );
              })}

              {/* Trailing circle trigger to reset category filters/show dialog */}
              <button
                type="button"
                onClick={() => setShowAllCategories(true)}
                className="flex min-w-[76px] sm:min-w-[88px] flex-col items-center gap-2 transition-all select-none duration-300"
              >
                <span className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm overflow-hidden hover:scale-105 transition-transform">
                  <img src="/logo/final-logo.png" alt="See All" className="w-full h-full object-cover" />
                </span>
                <span className="text-[11px] sm:text-xs font-black text-slate-500 dark:text-slate-400 tracking-tight">See All</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* --- DYNAMIC MATCHED CATEGORIES TAGS BAR --- */}
      {query && (
        <section className="mb-5">
          <h2 className="mb-4 text-xl font-black text-slate-900 dark:text-white">
            {query ? `Showing results for "${query}"` : "All Food"}
          </h2>
        </section>
      )}

      {/* --- EXTRA FILTERS SCROLL ROW --- */}
      <section className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
        <button
          type="button"
          onClick={() => setFilterUnder100(!filterUnder100)}
          className={`shrink-0 rounded-2xl border px-4 py-2 text-xs font-black transition-all duration-200 ${
            filterUnder100
              ? "border-brand-500 bg-brand-500 text-white shadow-md shadow-brand-500/25"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900/50"
          }`}
        >
          <SlidersHorizontal size={14} className="mr-1.5 inline" /> Under ₹100
        </button>
        <button
          type="button"
          onClick={() => setFilterGreatOffers(!filterGreatOffers)}
          className={`shrink-0 rounded-2xl border px-4 py-2 text-xs font-black transition-all duration-200 ${
            filterGreatOffers
              ? "border-brand-500 bg-brand-500 text-white shadow-md shadow-brand-500/25"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900/50"
          }`}
        >
          Great offers
        </button>
        <button
          type="button"
          onClick={() => setFilterPureVeg(!filterPureVeg)}
          className={`shrink-0 rounded-2xl border px-4 py-2 text-xs font-black transition-all duration-200 ${
            filterPureVeg
              ? "border-brand-500 bg-brand-500 text-white shadow-md shadow-brand-500/25"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900/50"
          }`}
        >
          Pure Veg
        </button>
      </section>

      {/* --- SEARCH RESULTS DISHES GRID --- */}
      <section>
        <h2 className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
          {query ? "Recommended for you" : "Recommended with deals"}
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => <div key={index} className="h-56 rounded-3xl bg-slate-100 animate-pulse dark:bg-slate-800" />)}
          </div>
        ) : visibleFoods.length === 0 ? (
          <div className="rounded-3xl border border-slate-150/70 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-950">
            <Search className="mx-auto text-slate-300 dark:text-slate-700" size={32} />
            <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">No matching food found</h3>
            <p className="mt-1 text-sm font-semibold text-slate-450 dark:text-slate-500">Try another dish name or category.</p>
          </div>
        ) : (
          <div>
            {/* Renders 1 item if query is present and it is not a category filter, otherwise displays all items in rows of 3 to continue indefinitely */}
            <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleFoods.slice(0, (query && query !== activeCategory) ? 1 : visibleFoods.length).map((food) => (
                <FoodResultCard key={food._id} food={food} cartItem={cart.find((item) => item._id === food._id)} onQuantity={updateQuantity} onClick={setSelectedFood} />
              ))}
            </div>

            {/* Related Foods Section */}
            {query && relatedFoods.length > 0 && (
              <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800/60">
                <h3 className="mb-5 text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">
                  Related to this food
                </h3>
                <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedFoods.map((food) => (
                    <FoodResultCard key={food._id} food={food} cartItem={cart.find((item) => item._id === food._id)} onQuantity={updateQuantity} onClick={setSelectedFood} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* --- FLOATING BOTTOM CART BAR --- */}
      {cartCount > 0 && (
        <div className="fixed bottom-[5.5rem] left-1/2 z-40 w-[92%] max-w-3xl -translate-x-1/2 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95 backdrop-blur-md md:bottom-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-650 dark:bg-brand-950/40 dark:text-brand-300">
              <ShoppingCart size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900 dark:text-white">{cartCount} {cartCount === 1 ? "item" : "items"} selected</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Total ₹{cartTotal}</p>
            </div>
            <Button onClick={goCheckout} className="rounded-xl px-5 h-10 text-sm font-black">
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Categories modal listing overlay */}
      <AnimatePresence>
        {showAllCategories && (
          <div className="fixed inset-0 z-[1800] flex items-end justify-center bg-slate-955/55 backdrop-blur-sm">
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
                  className="w-10 h-10 rounded-full bg-slate-105 text-slate-700 dark:bg-slate-900 dark:text-slate-200 flex items-center justify-center shadow-sm"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[68vh]">
                <div className="grid grid-cols-4 gap-x-3 gap-y-6">
                  {categories.map((cat) => {
                    const isSelected = activeCategory.toLowerCase() === cat.name.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={cat.name}
                        onClick={() => {
                          chooseCategory(cat.name === "All Food" ? "All" : cat.name);
                          setShowAllCategories(false);
                        }}
                        className={`min-w-0 rounded-2xl p-2 flex flex-col items-center gap-2 transition-all ${
                          isSelected
                            ? "bg-rose-50 dark:bg-rose-950/20 ring-1 ring-rose-300"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        <span className="relative w-full aspect-[1.35] rounded-xl flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900">
                          <img 
                            src={cat.image.startsWith("/") ? cat.image : getImageUrl(cat.image)} 
                            alt={cat.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.src = "https://placehold.co/160x160?text=Food"; }}
                          />
                        </span>
                        <span className={`w-full text-center text-[11px] sm:text-sm font-bold leading-tight break-words ${isSelected ? "text-slate-950 dark:text-white" : "text-slate-505 dark:text-slate-300"}`}>
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

      {/* --- FOOD DETAILS & CUSTOMISATION MODAL --- */}
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
                      {(() => {
                        const total = getComboTotalPrice(selectedFood);
                        const saving = Math.max(0, total - selectedFoodPrice);
                        const percent = total > 0 ? Math.round((saving / total) * 100) : 0;
                        return saving > 0 ? (
                          <span className="rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-75 shadow-sm dark:bg-slate-950 dark:text-emerald-350">
                            You Save: ₹{saving} ({percent}%)
                          </span>
                        ) : null;
                      })()}
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
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * FoodResultCard Sub-component
 * 
 * Renders detail parameters for search matching food results, rating stars, and custom counter quantity buttons.
 */
function FoodResultCard({ food, cartItem, onQuantity, onClick }) {
  const isOut = food.isAvailable === false;
  return (
    <div 
      onClick={() => onClick && onClick(food)}
      className={`overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer dark:border-slate-800/80 dark:bg-slate-950 ${isOut ? "opacity-60 grayscale filter" : ""}`}
    >
      <div className="relative h-44 bg-slate-50 p-2.5 dark:bg-slate-900">
        <img
          src={getImageUrl(food.image)}
          alt={food.name}
          className="h-full w-full rounded-2xl object-cover"
          onError={(e) => { e.target.src = "https://placehold.co/400x300?text=Food"; }}
        />
        {isOut && (
          <div className="absolute inset-0 bg-slate-955/70 flex items-center justify-center rounded-2xl m-2.5">
            <span className="bg-red-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow-md uppercase tracking-wider">Out of Stock</span>
          </div>
        )}
        {food.featured && !isOut && (
          <span className="absolute left-5 top-5 rounded-lg bg-slate-950/80 backdrop-blur-sm px-2 py-1 text-[10px] font-black text-white">
            10% OFF select items
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className={`line-clamp-1 text-lg font-black text-slate-900 dark:text-white ${isOut ? "text-slate-400" : ""}`}>{food.name}</h3>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{food.category || "Dish"}</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-black text-white">{food.rating ? food.rating.toFixed(1) : "4.3"} ★</span>
        </div>
        <p className="mb-4 line-clamp-2 min-h-10 text-sm font-semibold text-slate-500 dark:text-slate-400">{food.description || "Freshly prepared and ready to order."}</p>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-lg font-black text-slate-950 dark:text-white">₹{food.price}</span>
          {isOut ? (
            <button
              disabled
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl bg-slate-200 dark:bg-slate-800 px-4 py-2 text-xs font-black text-slate-400 dark:text-slate-500 cursor-not-allowed select-none"
            >
              Out of Stock
            </button>
          ) : !cartItem ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuantity(food, 1);
              }}
              className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-black text-white shadow-md shadow-brand-500/20 transition-all hover:bg-brand-600 active:scale-95"
            >
              Add
            </button>
          ) : (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="flex items-center rounded-xl border border-brand-100 bg-brand-50 p-1 dark:border-brand-800/40 dark:bg-brand-950/30"
            >
              <button type="button" onClick={(e) => { e.stopPropagation(); onQuantity(food, cartItem.qty - 1); }} className="h-8 w-8 rounded-lg bg-white text-base font-black text-brand-600 dark:bg-slate-900 dark:text-brand-350 shadow-sm">-</button>
              <span className="min-w-8 px-1 text-center text-xs font-black text-slate-900 dark:text-white">{cartItem.qty}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); onQuantity(food, cartItem.qty + 1); }} className="h-8 w-8 rounded-lg bg-brand-500 text-base font-black text-white">+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

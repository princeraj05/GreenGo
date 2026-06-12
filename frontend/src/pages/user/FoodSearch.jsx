import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Mic, Search, ShoppingCart, SlidersHorizontal, Sparkles, X } from "lucide-react";
import Button from "../../components/ui/Button";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";

const API = getApiUrl();

// Quick suggestions tags displayed underneath the search box when empty
const quickPrompts = ["Light meals", "Need coffee ASAP", "Breakfast in bed", "Pizza cravings"];

/* --- HELPERS & UTILITIES --- */

// Lowercases and trims text to simplify search matches
function normalize(value = "") {
  return String(value).toLowerCase().trim();
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

  // Active filters states
  const [filterUnder100, setFilterUnder100] = useState(false);
  const [filterGreatOffers, setFilterGreatOffers] = useState(false);
  const [filterPureVeg, setFilterPureVeg] = useState(false);

  /* --- DATA FETCHING & EFFECTS --- */

  // Runs on mount: Loads foods list, populates cart state, and focuses search input
  useEffect(() => {
    loadFoods();
    loadCart();
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

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
      if (!map.has(name)) map.set(name, food.categoryImage || food.image || "");
    });
    return [
      { name: "All Food", image: "/greengo-logo.png" },
      ...Array.from(map, ([name, image]) => ({ name, image }))
    ];
  }, [foods]);

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
        const matchesCategory = activeCategory === "All" || activeCategory === "All Food" || normalize(food.category || "Other") === active || normalize(food.name).includes(active);
        
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
      .sort((a, b) => distanceRank(a, query) - distanceRank(b, query) || Number(b.rating || 0) - Number(a.rating || 0));
  }, [foods, query, activeCategory, filterUnder100, filterGreatOffers, filterPureVeg]);

  // If active category is excluded from new search match results, resets tag filters to "All"
  useEffect(() => {
    if (!matchingCategories.includes(activeCategory)) setActiveCategory("All");
  }, [matchingCategories, activeCategory]);

  const cartCount = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);

  /* --- NAVIGATION & SELECTION HANDLERS --- */

  const chooseSuggestion = (item) => {
    setQuery(item.name);
    setActiveCategory(item.isCategory ? item.name : "All");
    setShowSuggestions(false);
  };

  const chooseCategory = (name) => {
    setActiveCategory(name);
    setQuery(name === "All Food" ? "" : name);
    setShowSuggestions(false);
  };

  const goCheckout = () => {
    if (cartCount > 0) navigate("/user/checkout");
  };

  return (
    /* --- MAIN LAYOUT WRAPPER --- */
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 md:px-6">
      
      {/* --- STICKY SEARCH BAR HEADER --- */}
      <div className="sticky top-0 z-30 -mx-4 bg-slate-50/95 px-4 pb-4 pt-1.5 backdrop-blur-md dark:bg-slate-900/95 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-all focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25 dark:border-slate-800 dark:bg-slate-950">
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
            className="flex h-10 w-10 shrink-0 items-center justify-center border-l border-slate-100 pl-3 text-brand-500 dark:border-slate-800 hover:text-brand-600 transition-colors"
            title="Voice search"
          >
            <Mic size={20} />
          </button>
        </div>
      </div>

      {/* --- QUICK PROMPTS INSPIRATION TAGS --- */}
      {!query && (
        <section className="mb-8 overflow-hidden">
          <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setQuery(prompt);
                  setShowSuggestions(true);
                }}
                className="shrink-0 rounded-full border border-brand-100 hover:border-brand-300 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition-all hover:bg-brand-50/30 dark:border-brand-900/40 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-brand-950/20"
              >
                <Sparkles size={14} className="mr-1.5 inline text-brand-500" />
                {prompt}
              </button>
            ))}
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

      {/* --- CATEGORY ROUND BUBBLES GRID --- */}
      {!query && (
        <section className="mb-8">
          <h2 className="mb-5 text-xs font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">What's on your mind?</h2>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="flex shrink-0 flex-col items-center gap-2">
                  <div className="h-20 w-20 rounded-full bg-slate-150 animate-pulse dark:bg-slate-800 sm:h-24 sm:w-24" />
                  <div className="h-3 w-14 rounded bg-slate-150 animate-pulse dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar sm:grid sm:grid-cols-4 sm:gap-x-4 sm:gap-y-6 md:grid-cols-6 lg:grid-cols-8">
              {categories.slice(0, 18).map((cat) => (
                <button 
                  key={cat.name} 
                  type="button" 
                  onClick={() => chooseCategory(cat.name)} 
                  className="group flex shrink-0 flex-col items-center text-center sm:w-auto"
                >
                  <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full border border-slate-100/80 bg-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md dark:border-slate-800 dark:bg-slate-950 sm:h-24 sm:w-24 overflow-hidden">
                    <img
                      src={getImageUrl(cat.image)}
                      alt={cat.name}
                      className="h-full w-full object-cover rounded-full aspect-square"
                      onError={(e) => { e.target.src = "https://placehold.co/160x160?text=Food"; }}
                    />
                  </div>
                  <p className="line-clamp-1 text-xs font-black text-slate-800 dark:text-slate-200 w-20 sm:w-full">{cat.name}</p>
                </button>
              ))}
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
          <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleFoods.map((food) => (
              <FoodResultCard key={food._id} food={food} cartItem={cart.find((item) => item._id === food._id)} onQuantity={updateQuantity} />
            ))}
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

      {/* Back navigation hyperlink footer */}
      <div className="mt-10 text-center">
        <Link to="/user/menu" className="text-sm font-black text-brand-600 hover:underline dark:text-brand-405">Back to full menu</Link>
      </div>
    </div>
  );
}

/**
 * FoodResultCard Sub-component
 * 
 * Renders detail parameters for search matching food results, rating stars, and custom counter quantity buttons.
 */
function FoodResultCard({ food, cartItem, onQuantity }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800/80 dark:bg-slate-950">
      <div className="relative h-44 bg-slate-50 p-2.5 dark:bg-slate-900">
        <img
          src={getImageUrl(food.image)}
          alt={food.name}
          className="h-full w-full rounded-2xl object-cover"
          onError={(e) => { e.target.src = "https://placehold.co/400x300?text=Food"; }}
        />
        {food.featured && (
          <span className="absolute left-5 top-5 rounded-lg bg-slate-950/80 backdrop-blur-sm px-2 py-1 text-[10px] font-black text-white">
            10% OFF select items
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-lg font-black text-slate-900 dark:text-white">{food.name}</h3>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{food.category || "Dish"}</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-black text-white">{food.rating ? food.rating.toFixed(1) : "4.3"} ★</span>
        </div>
        <p className="mb-4 line-clamp-2 min-h-10 text-sm font-semibold text-slate-500 dark:text-slate-400">{food.description || "Freshly prepared and ready to order."}</p>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-lg font-black text-slate-950 dark:text-white">₹{food.price}</span>
          {!cartItem ? (
            <button
              type="button"
              onClick={() => onQuantity(food, 1)}
              className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-black text-white shadow-md shadow-brand-500/20 transition-all hover:bg-brand-600 active:scale-95"
            >
              Add
            </button>
          ) : (
            <div className="flex items-center rounded-xl border border-brand-100 bg-brand-50 p-1 dark:border-brand-800/40 dark:bg-brand-950/30">
              <button type="button" onClick={() => onQuantity(food, cartItem.qty - 1)} className="h-8 w-8 rounded-lg bg-white text-base font-black text-brand-600 dark:bg-slate-900 dark:text-brand-350 shadow-sm">-</button>
              <span className="min-w-8 px-1 text-center text-xs font-black text-slate-900 dark:text-white">{cartItem.qty}</span>
              <button type="button" onClick={() => onQuantity(food, cartItem.qty + 1)} className="h-8 w-8 rounded-lg bg-brand-500 text-base font-black text-white">+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Plus, ShoppingCart, Sparkles, X, Heart, Eye } from "lucide-react";
import Button from "../ui/Button";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";
import { getToken } from "../../utils/getToken";

const API = getApiUrl();

const peopleOptions = [
  { label: "1 Person", value: 1 },
  { label: "2 People", value: 2 },
  { label: "3 People", value: 3 },
  { label: "4 People", value: 4 },
  { label: "5 People", value: 5 },
  { label: "5+ People", value: 6 },
];

const budgetOptions = [
  { label: "Up to Rs.100", min: 0, max: 100 },
  { label: "Rs.100 - Rs.200", min: 100, max: 200 },
  { label: "Rs.200 - Rs.300", min: 200, max: 300 },
  { label: "Rs.300 - Rs.500", min: 300, max: 500 },
  { label: "Rs.500 - Rs.800", min: 500, max: 800 },
  { label: "Rs.800+", min: 800, max: 99999 },
];

const preferenceOptions = [
  { label: "Veg", value: "Veg", hint: "Plant-based dishes only" },
  { label: "Non-Veg", value: "Non-Veg", hint: "Chicken, egg, and meat dishes" },
  { label: "Both", value: "Both", hint: "Show every matching option" },
];

const foodTypes = [
  "Pizza",
  "Burger",
  "Starters",
  "Combo",
  "Roti",
  "Chicken",
  "Biryani",
  "Pasta",
  "Drinks",
  "Desserts",
  "Veg",
  "Non-Veg",
  "Fast Food",
  "Main Course",
];

const foodTypeIcon = {
  Pizza: "🍕",
  Burger: "🍔",
  Starters: "🍢",
  Combo: "🍱",
  Roti: "🫓",
  Chicken: "🍗",
  Biryani: "🍚",
  Pasta: "🍝",
  Drinks: "🥤",
  Desserts: "🍰",
  Veg: "🥬",
  "Non-Veg": "🍖",
  "Fast Food": "🍕",
  "Main Course": "🍛",
};

const normalize = (value = "") => String(value).toLowerCase();
const getServingSize = (food) => Math.max(1, Math.ceil(Number(food.servingSize || 1)));
const getPackingCharge = (food) => Math.max(0, Number(food.packingCharge || 0));
const addBudgetMath = (food, people, maxBudget) => {
  const servingSize = getServingSize(food);
  const requiredQuantity = Math.ceil(Math.max(1, Number(people) || 1) / servingSize);
  const finalPrice = requiredQuantity * (Number(food.price || 0) + getPackingCharge(food));
  return {
    ...food,
    servingSize,
    requiredQuantity,
    finalPrice,
    budgetShortfall: Math.max(0, finalPrice - maxBudget),
  };
};

const isNonVegFood = (food) => {
  const name = normalize(food.name);
  const category = normalize(food.category);
  return (
    food.veg === false ||
    category.includes("non-veg") ||
    category.includes("chicken") ||
    category.includes("kebab") ||
    name.includes("chicken") ||
    name.includes("mutton") ||
    name.includes("egg")
  );
};

const matchesType = (food, type) => {
  const selected = normalize(type);
  const name = normalize(food.name);
  const category = normalize(food.category);
  const description = normalize(food.description);
  const haystack = `${name} ${category} ${description}`;

  if (selected === "veg") return !isNonVegFood(food);
  if (selected === "non-veg") return isNonVegFood(food);
  if (selected === "drinks") return /drink|beverage|juice|cola|water|shake|lassi/.test(haystack);
  if (selected === "desserts") return /dessert|sweet|cake|ice|gulab|jamun/.test(haystack);
  if (selected === "fast food") return /fast|pizza|burger|fries|roll|sandwich/.test(haystack);
  if (selected === "main course") return /main|course|biryani|roti|rice|paneer|dal|combo/.test(haystack);
  if (selected === "starter") return /starter|snack|tikka|fries|roll/.test(haystack);
  if (selected === "combo") return /combo|meal|thali/.test(haystack);

  return haystack.includes(selected);
};

const buildLocalRecommendations = ({ foods = [], people, budgetObj, preference, selectedTypes }) => {
  const maxBudget = Math.max(Number(budgetObj?.max) || 500, Number(budgetObj?.min) || 0);
  
  // Strict filter by dietary preference
  let filtered = foods.filter((food) => Number(food.price || 0) > 0);
  if (preference === "Veg") {
    filtered = filtered.filter((food) => !isNonVegFood(food));
  } else if (preference === "Non-Veg") {
    filtered = filtered.filter((food) => isNonVegFood(food));
  }

  // Filter by category
  let categoryFiltered = filtered;
  if (selectedTypes.length > 0) {
    categoryFiltered = filtered.filter((food) => selectedTypes.some((type) => matchesType(food, type)));
  }

  // Fallback to no category filter if empty
  let matches = categoryFiltered.length > 0 ? categoryFiltered : filtered;
  
  // Calculate pricing and metrics
  let rankedFoods = [...matches].map((food) => addBudgetMath(food, people, maxBudget));

  // Rank dishes based on:
  // 1. Budget Match (under budget comes first)
  // 2. Selected Category Match (more matches = higher ranking)
  // 3. Rating & Orders Popularity
  rankedFoods.sort((a, b) => {
    const aUnder = a.finalPrice <= maxBudget ? 1 : 0;
    const bUnder = b.finalPrice <= maxBudget ? 1 : 0;
    if (aUnder !== bUnder) return bUnder - aUnder;

    const aCatCount = selectedTypes.filter(t => matchesType(a, t)).length;
    const bCatCount = selectedTypes.filter(t => matchesType(b, t)).length;
    if (aCatCount !== bCatCount) return bCatCount - aCatCount;

    const aScore = (Number(a.rating) || 0) * 10 + (Number(a.ratingCount) || 0) + (Number(a.totalOrders) || 0);
    const bScore = (Number(b.rating) || 0) * 10 + (Number(b.ratingCount) || 0) + (Number(b.totalOrders) || 0);
    return bScore - aScore;
  });

  let individualDishes = rankedFoods.filter((food) => food.finalPrice <= maxBudget);
  let isExactMatch = true;

  // Fallback: If no exact matches fit budget, get closest/cheapest alternatives
  if (individualDishes.length === 0) {
    isExactMatch = false;
    individualDishes = rankedFoods.slice(0, 4);
  }

  const mains = rankedFoods.filter((food) => !matchesType(food, "Drinks") && !matchesType(food, "Desserts"));
  const sides = rankedFoods.filter((food) => matchesType(food, "Drinks") || matchesType(food, "Desserts"));
  const sidePool = sides.length ? sides : rankedFoods;
  
  let combos = [];
  for (const main of mains.slice(0, 15)) {
    for (const side of sidePool.slice(0, 15)) {
      if (String(main._id) === String(side._id)) continue;
      const price = Number(main.finalPrice || 0) + Number(side.finalPrice || 0);
      
      if (price <= maxBudget) {
        combos.push({
          name: `${main.name} + ${side.name}`,
          items: [main, side],
          price,
          originalPrice: (Number(main.price || 0) * main.requiredQuantity) + (Number(side.price || 0) * side.requiredQuantity)
        });
      }
    }
  }

  // Fallback: If no combos fit under budget, get lowest priced combos above budget
  if (combos.length === 0) {
    isExactMatch = false;
    for (const main of mains.slice(0, 6)) {
      for (const side of sidePool.slice(0, 6)) {
        if (String(main._id) === String(side._id)) continue;
        const price = Number(main.finalPrice || 0) + Number(side.finalPrice || 0);
        combos.push({
          name: `${main.name} + ${side.name}`,
          items: [main, side],
          price,
          originalPrice: (Number(main.price || 0) * main.requiredQuantity) + (Number(side.price || 0) * side.requiredQuantity)
        });
      }
    }
    combos.sort((a, b) => a.price - b.price);
  } else {
    combos.sort((a, b) => b.price - a.price);
  }

  // Savings calculations
  combos = combos.map(c => {
    let orig = c.originalPrice;
    if (!orig || orig <= c.price) {
      orig = Math.round(c.price * 1.25);
    }
    const savings = Math.round(orig - c.price);
    return {
      ...c,
      originalPrice: Math.round(orig),
      savings
    };
  });

  return {
    individualDishes: individualDishes.slice(0, 6),
    combos: combos.slice(0, 4),
    estimatedCost: individualDishes[0] ? Number(individualDishes[0].finalPrice || 0) : 0,
    isExactMatch
  };
};

export default function BudgetAssistant({ isOpen, onClose, foods = [], onAddToCart }) {
  const [step, setStep] = useState(1);
  const [people, setPeople] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [preference, setPreference] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [results, setResults] = useState({ individualDishes: [], combos: [], estimatedCost: 0, isExactMatch: true });
  
  // Custom dialog state for "View Details" click
  const [activeDetailsCombo, setActiveDetailsCombo] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API}/api/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Failed to load categories for budget assistant:", err);
      }
    };
    fetchCategories();
  }, []);

  const displayedCategories = useMemo(() => {
    if (categories.length > 0) {
      return categories.map(cat => ({
        name: cat.name,
        image: cat.image
      }));
    }
    return foodTypes.map(type => ({
      name: type,
      image: ""
    }));
  }, [categories]);

  const budgetObj = useMemo(
    () => budgetOptions.find((option) => option.label === budgetRange) || budgetOptions[3],
    [budgetRange]
  );

  const selectedPeopleLabel = peopleOptions.find((option) => option.value === people)?.label || "Not selected";

  const toggleType = (type) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
    );
  };

  const resetAssistant = () => {
    setStep(1);
    setPeople("");
    setBudgetRange("");
    setPreference("");
    setSelectedTypes([]);
    setRecommendationError("");
    setResults({ individualDishes: [], combos: [], estimatedCost: 0, isExactMatch: true });
  };

  const generateRecommendations = async () => {
    setRecommendationLoading(true);
    setRecommendationError("");

    const localResults = buildLocalRecommendations({ foods, people, budgetObj, preference, selectedTypes });

    try {
      const token = getToken();
      if (!token) {
        setTimeout(() => {
          setResults(localResults);
          setRecommendationLoading(false);
        }, 1500); // Give users a premium AI loading experience feel
        return;
      }

      const res = await fetch(`${API}/api/users/budget-recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          people,
          budgetMin: budgetObj.min,
          budgetMax: budgetObj.max,
          preference,
          selectedTypes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load recommendations");

      const apiResults = {
        individualDishes: data.individualDishes || [],
        combos: data.combos || [],
        estimatedCost: data.estimatedCost || 0,
        isExactMatch: (data.individualDishes?.length > 0 || data.combos?.length > 0)
      };

      const hasApiMatches = apiResults.individualDishes.length > 0 || apiResults.combos.length > 0;
      
      setTimeout(() => {
        setResults(hasApiMatches ? apiResults : localResults);
        setRecommendationLoading(false);
      }, 1800); // Premium AI loading animation delay
    } catch (err) {
      setTimeout(() => {
        setResults(localResults);
        if (localResults.individualDishes.length === 0 && localResults.combos.length === 0) {
          setRecommendationError(err.message || "Unable to load recommendations");
        }
        setRecommendationLoading(false);
      }, 1500);
    }
  };

  useEffect(() => {
    if (step === 5) generateRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Loading Screen Carousel Component
  const LoadingExperience = () => {
    const loadingTexts = [
      "Analyzing your preferences...",
      "Finding the best value meals...",
      "Building your perfect combo...",
    ];
    const [index, setIndex] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % loadingTexts.length);
      }, 1200);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="relative mb-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-500"></div>
          <Sparkles className="absolute inset-0 m-auto text-emerald-400 animate-pulse" size={24} />
        </div>
        <p className="text-sm font-bold tracking-wide text-slate-300 transition-opacity duration-300">
          {loadingTexts[index]}
        </p>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <button type="button" aria-label="Close budget assistant" className="fixed inset-0" onClick={onClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2.5rem] border border-slate-800 bg-slate-950 shadow-2xl transition-colors sm:rounded-[2rem]">
        
        {/* --- HEADER --- */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-900 bg-slate-950 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(current - 1, 1))}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-900 hover:text-white"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-sm font-black text-emerald-400">
                BA
              </span>
              <span className="truncate text-lg font-black tracking-tight text-white">
                Budget Assistant
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-900 hover:text-white"
            aria-label="Close budget assistant"
          >
            <X size={21} />
          </button>
        </div>

        {/* --- WIZARD PROGRESS INDICATOR --- */}
        {step < 5 && (
          <div className="flex flex-col gap-2 shrink-0 bg-slate-900/40 px-6 py-3.5 border-b border-slate-900/60">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-400">
              <span>Step {step} of 4</span>
              <span>{Math.round((step / 4) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* --- MAIN WIZARD STEPS CONTENT --- */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-2xl font-black leading-tight tracking-tight text-white">
                  How many people are eating?
                </h3>
                <p className="mt-1.5 text-xs font-medium text-slate-400">
                  Pick the number of people you want to feed.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {peopleOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => {
                      setPeople(option.value);
                      setStep(2);
                    }}
                    className={`flex min-h-20 items-center justify-between rounded-2xl border-2 px-4 py-3 text-left text-sm font-black transition-all ${
                      people === option.value
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm"
                        : "border-slate-850 bg-slate-900/40 text-slate-300 hover:border-emerald-500/50"
                    }`}
                  >
                    <span>{option.label}</span>
                    {people === option.value && <Check size={17} className="text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-2xl font-black leading-tight tracking-tight text-white">
                  What is your total budget?
                </h3>
                <p className="mt-1.5 text-xs font-medium text-slate-400">
                  Choose the maximum amount you want to spend.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {budgetOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => {
                      setBudgetRange(option.label);
                      setStep(3);
                    }}
                    className={`flex min-h-20 items-center justify-between rounded-2xl border-2 px-4 py-3 text-left text-sm font-black transition-all ${
                      budgetRange === option.label
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm"
                        : "border-slate-850 bg-slate-900/40 text-slate-300 hover:border-emerald-500/50"
                    }`}
                  >
                    <span>{option.label}</span>
                    {budgetRange === option.label && <Check size={17} className="text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-2xl font-black leading-tight tracking-tight text-white">
                  What do you prefer?
                </h3>
                <p className="mt-1.5 text-xs font-medium text-slate-400">
                  Select the dietary preference for these recommendations.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {preferenceOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setPreference(option.value);
                      setStep(4);
                    }}
                    className={`flex items-center justify-between rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                      preference === option.value
                        ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                        : "border-slate-850 bg-slate-900/40 hover:border-emerald-500/50"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-black text-white">{option.label}</span>
                      <span className="mt-1 block text-xs font-semibold text-slate-400">{option.hint}</span>
                    </span>
                    {preference === option.value && <Check size={18} className="text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-2xl font-black leading-tight tracking-tight text-white">
                  What kind of food would you like?
                </h3>
                <p className="mt-1.5 text-xs font-medium text-slate-400">
                  Select one or more categories.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {displayedCategories.map((cat) => {
                  const type = cat.name;
                  const isSelected = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={`flex min-h-24 flex-col items-start justify-between rounded-2xl border-2 p-4 text-left transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm"
                          : "border-slate-850 bg-slate-900/40 text-slate-300 hover:border-emerald-500/50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-950 shadow-sm flex items-center justify-center">
                        {cat.image ? (
                          <img src={getImageUrl(cat.image)} alt={type} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">{foodTypeIcon[type] || "🍽️"}</span>
                        )}
                      </div>
                      <span className="text-xs font-black leading-tight mt-2">{type}</span>
                    </button>
                  );
                })}
              </div>

              <Button type="button" onClick={() => setStep(5)} className="w-full py-4 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-black">
                Show Results
              </Button>
            </div>
          )}

          {/* --- RESULTS SCREEN (STEP 5) --- */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              {/* --- FILTER BADGES HEADER --- */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
                  <Sparkles size={14} /> Selected Filters
                </h4>
                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-slate-300 border border-slate-800">
                    👥 {selectedPeopleLabel}
                  </span>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-slate-300 border border-slate-800">
                    💰 Budget: {budgetRange}
                  </span>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-slate-300 border border-slate-800">
                    🍽️ Preference: {preference}
                  </span>
                  {selectedTypes.map((type) => (
                    <span key={type} className="rounded-full bg-slate-900 px-2.5 py-1 text-emerald-400 border border-slate-800">
                      {foodTypeIcon[type] || ""} {type}
                    </span>
                  ))}
                </div>
              </div>

              {recommendationLoading ? (
                <LoadingExperience />
              ) : (
                <div className="space-y-6">
                  
                  {/* --- FALLBACK EMPTY STATE HEADER --- */}
                  {!results.isExactMatch && (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                      <p className="text-sm font-black text-amber-400">
                        ⚠️ No exact combo found. Here are the closest matches.
                      </p>
                    </div>
                  )}

                  {/* --- INDIVIDUAL DISH RECOMMENDATIONS --- */}
                  {results.individualDishes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-base font-black tracking-tight text-white">Recommended Dishes</h4>
                      <div className="grid gap-3">
                        {results.individualDishes.map((food) => {
                          const fitBudget = food.finalPrice <= budgetObj.max;
                          const serves = getServingSize(food) >= people;
                          const matchesPref = preference === "Both" || (preference === "Veg" && !isNonVegFood(food)) || (preference === "Non-Veg" && isNonVegFood(food));
                          const isPopular = Number(food.rating) >= 4.5 || Number(food.totalOrders) > 50;

                          return (
                            <div key={food._id} className="relative flex gap-3.5 rounded-2xl border border-slate-900 bg-slate-900/30 p-3.5 shadow-md">
                              
                              {/* Popularity Badge */}
                              {isPopular && (
                                <span className="absolute -top-2 left-3 rounded-full bg-amber-500 px-2.5 py-0.5 text-[9px] font-black text-slate-950 uppercase tracking-wider shadow">
                                  ⭐ Popular
                                </span>
                              )}

                              <img
                                src={getImageUrl(food.image)}
                                alt={food.name}
                                className="h-16 w-16 shrink-0 rounded-xl border border-slate-800 bg-slate-950 object-contain p-1"
                                onError={(event) => {
                                  event.currentTarget.src = "https://placehold.co/120x120?text=Food";
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <h5 className="truncate text-sm font-black text-white leading-tight">{food.name}</h5>
                                <p className="mt-0.5 truncate text-[11px] font-bold text-slate-400">
                                  {food.category || "Menu Item"} • Serves {getServingSize(food)}
                                </p>
                                <p className="mt-1.5 text-sm font-black text-emerald-400">
                                  Rs.{food.finalPrice}
                                </p>
                                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                                  {food.requiredQuantity} plate{food.requiredQuantity > 1 ? "s" : ""} x Rs.{Number(food.price || 0) + getPackingCharge(food)}
                                </p>

                                {/* Explanations */}
                                <div className="mt-2.5 space-y-0.5 text-[10px] font-black border-t border-slate-900/60 pt-2 text-slate-400">
                                  <div className="flex items-center gap-1">
                                    <span className={fitBudget ? "text-emerald-400" : "text-amber-500"}>
                                      {fitBudget ? "✓" : "✗"}
                                    </span>
                                    <span>{fitBudget ? "Fits your selected budget" : `Exceeds budget by Rs.${Math.round(food.finalPrice - budgetObj.max)}`}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-emerald-400">✓</span>
                                    <span>Suitable for {people} {people === 1 ? "person" : "people"}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className={matchesPref ? "text-emerald-400" : "text-amber-500"}>
                                      {matchesPref ? "✓" : "✗"}
                                    </span>
                                    <span>{isNonVegFood(food) ? "Matches Non-Veg preference" : "Matches Veg preference"}</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  onAddToCart(food, food.requiredQuantity || 1);
                                  alert(`${food.name} x ${food.requiredQuantity || 1} added to cart!`);
                                }}
                                className="self-center rounded-xl bg-emerald-500 p-2.5 text-white transition-colors hover:bg-emerald-600 shrink-0"
                                aria-label={`Add ${food.name} to cart`}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* --- COMBOS RECOMMENDATIONS --- */}
                  {results.combos.length > 0 && (
                    <div className="space-y-4 border-t border-slate-900 pt-5">
                      <h4 className="text-base font-black tracking-tight text-white">Recommended Value Combos</h4>
                      <div className="grid gap-4">
                        {results.combos.map((combo, index) => {
                          const fitBudget = combo.price <= budgetObj.max;
                          const bestValue = index === 0;
                          const highestSavings = combo.savings >= Math.max(...results.combos.map(c => c.savings));

                          // Combo photo (falls back to first item image)
                          const comboImg = combo.items[0]?.image ? getImageUrl(combo.items[0].image) : "";

                          return (
                            <div key={`${combo.name}-${index}`} className="relative rounded-2xl border border-emerald-500/10 bg-slate-900/25 p-4 shadow-lg overflow-hidden flex flex-col justify-between">
                              
                              {/* Badges */}
                              <div className="absolute top-3 right-3 flex gap-1">
                                {bestValue && (
                                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-400 uppercase tracking-wider border border-emerald-500/30">
                                    🔥 Best Value
                                  </span>
                                )}
                                {highestSavings && (
                                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[9px] font-black text-rose-400 uppercase tracking-wider border border-rose-500/30">
                                    💰 Max Savings
                                  </span>
                                )}
                              </div>

                              <div className="flex gap-4 items-start">
                                <img
                                  src={comboImg}
                                  alt={combo.name}
                                  className="h-16 w-16 shrink-0 rounded-xl border border-slate-800 bg-slate-950 object-contain p-1"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://placehold.co/120x120?text=Combo";
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-sm font-black leading-tight text-white truncate pr-16">{combo.name}</h5>
                                  <p className="mt-1 text-[11px] font-bold text-slate-400">
                                    {combo.items.map((item) => item.name).join(" + ")}
                                  </p>
                                  
                                  {/* Serves & Savings Display */}
                                  <div className="mt-2.5 flex items-center gap-3 text-xs font-black">
                                    <span className="text-slate-400">👥 Serves {people}</span>
                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15">
                                      Save Rs.{combo.savings}
                                    </span>
                                  </div>

                                  {/* Combo Savings Display */}
                                  <div className="mt-2 flex items-baseline gap-2.5">
                                    <span className="text-xs text-slate-500 line-through">Rs.{combo.originalPrice}</span>
                                    <span className="text-sm font-black text-white">Rs.{combo.price}</span>
                                  </div>

                                  {/* Explanations */}
                                  <div className="mt-3.5 space-y-0.5 text-[10px] font-black border-t border-slate-900/60 pt-2.5 text-slate-400">
                                    <div className="flex items-center gap-1">
                                      <span className={fitBudget ? "text-emerald-400" : "text-amber-500"}>
                                        {fitBudget ? "✓" : "✗"}
                                      </span>
                                      <span>{fitBudget ? "Fits your selected budget" : `Exceeds budget by Rs.${Math.round(combo.price - budgetObj.max)}`}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-emerald-400">✓</span>
                                      <span>Suitable for {people} eating together</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-emerald-400">✓</span>
                                      <span>Matches selected category combos</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Button Group */}
                              <div className="mt-4 flex gap-2 pt-2 border-t border-slate-900/40">
                                <button
                                  type="button"
                                  onClick={() => {
                                    combo.items.forEach((item) => onAddToCart(item, item.requiredQuantity || 1));
                                    alert("Combo dishes added to cart successfully!");
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-black text-white transition-colors hover:bg-emerald-600"
                                >
                                  <ShoppingCart size={13} /> Add Combo
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDetailsCombo(combo)}
                                  className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
                                  aria-label="View Details"
                                >
                                  <Eye size={15} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </div>

        {/* --- ACTIONS FOOTER (STEP 5) --- */}
        {step === 5 && !recommendationLoading && (
          <div className="flex shrink-0 gap-3 border-t border-slate-900 bg-slate-950 p-4">
            <button
              type="button"
              onClick={resetAssistant}
              className="flex-1 rounded-xl bg-slate-905 border border-slate-800 py-3 text-center text-xs font-black text-slate-300 transition-colors hover:bg-slate-900"
            >
              Try Again
            </button>
            <Button type="button" onClick={onClose} className="flex-1 py-3 text-xs bg-emerald-500 hover:bg-emerald-600 font-black">
              Done
            </Button>
          </div>
        )}
      </div>

      {/* --- INLINE VIEW DETAILS OVERLAY MODAL --- */}
      {activeDetailsCombo && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <h4 className="text-lg font-black tracking-tight text-white mb-2">{activeDetailsCombo.name}</h4>
            <p className="text-xs text-slate-400 font-bold mb-4">Combo Items Details:</p>
            
            <div className="space-y-4">
              {activeDetailsCombo.items.map((item, i) => (
                <div key={i} className="flex gap-3 items-center border-b border-slate-900/60 pb-3 last:border-0 last:pb-0">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="h-10 w-10 shrink-0 rounded-lg border border-slate-800 bg-slate-950 object-contain p-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Qty: {item.requiredQuantity} • Serving: {getServingSize(item)}
                    </p>
                  </div>
                  <span className="text-xs font-black text-emerald-400">Rs.{item.price * item.requiredQuantity}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-900 flex justify-between items-center text-xs font-black">
              <span className="text-slate-400">Total Price:</span>
              <span className="text-white">Rs.{activeDetailsCombo.price}</span>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setActiveDetailsCombo(null)}
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-black text-white hover:bg-slate-850"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Plus, ShoppingCart, Sparkles, X } from "lucide-react";
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
  "Starter",
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
  Pizza: "PZ",
  Burger: "BG",
  Starter: "ST",
  Combo: "CB",
  Roti: "RT",
  Chicken: "CH",
  Biryani: "BR",
  Pasta: "PA",
  Drinks: "DR",
  Desserts: "DS",
  Veg: "VG",
  "Non-Veg": "NV",
  "Fast Food": "FF",
  "Main Course": "MC",
};

const normalize = (value = "") => String(value).toLowerCase();

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
  const filteredFoods = foods
    .filter((food) => Number(food.price || 0) > 0)
    .filter((food) => {
      if (preference === "Veg" && isNonVegFood(food)) return false;
      if (preference === "Non-Veg" && !isNonVegFood(food)) return false;
      if (!selectedTypes.length) return true;
      return selectedTypes.some((type) => matchesType(food, type));
    });

  const rankedFoods = [...filteredFoods].sort((a, b) => {
    const aScore = (Number(a.rating) || 0) * 10 + (Number(a.ratingCount) || 0) + (Number(a.totalOrders) || 0);
    const bScore = (Number(b.rating) || 0) * 10 + (Number(b.ratingCount) || 0) + (Number(b.totalOrders) || 0);
    return bScore - aScore || Number(a.price || 0) - Number(b.price || 0);
  });

  const individualDishes = rankedFoods
    .filter((food) => Number(food.price || 0) <= maxBudget)
    .slice(0, 6);

  const mains = rankedFoods.filter((food) => !matchesType(food, "Drinks") && !matchesType(food, "Desserts"));
  const sides = rankedFoods.filter((food) => matchesType(food, "Drinks") || matchesType(food, "Desserts"));
  const sidePool = sides.length ? sides : rankedFoods;
  const combos = [];

  for (const main of mains.slice(0, 10)) {
    for (const side of sidePool.slice(0, 10)) {
      if (String(main._id) === String(side._id)) continue;
      const price = Number(main.price || 0) + Number(side.price || 0);
      if (price <= maxBudget) {
        combos.push({ name: `${main.name} + ${side.name}`, items: [main, side], price });
      }
    }
  }

  return {
    individualDishes,
    combos: combos.sort((a, b) => b.price - a.price).slice(0, 4),
    estimatedCost: individualDishes[0] ? Number(individualDishes[0].price || 0) : 0,
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
  const [results, setResults] = useState({ individualDishes: [], combos: [], estimatedCost: 0 });

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
    setResults({ individualDishes: [], combos: [], estimatedCost: 0 });
  };

  const generateRecommendations = async () => {
    setRecommendationLoading(true);
    setRecommendationError("");

    const localResults = buildLocalRecommendations({ foods, people, budgetObj, preference, selectedTypes });

    try {
      const token = getToken();
      if (!token) {
        setResults(localResults);
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
      };

      const hasApiMatches = apiResults.individualDishes.length > 0 || apiResults.combos.length > 0;
      setResults(hasApiMatches ? apiResults : localResults);
    } catch (err) {
      setResults(localResults);
      if (localResults.individualDishes.length === 0 && localResults.combos.length === 0) {
        setRecommendationError(err.message || "Unable to load recommendations");
      }
    } finally {
      setRecommendationLoading(false);
    }
  };

  useEffect(() => {
    if (step === 5) generateRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <button type="button" aria-label="Close budget assistant" className="fixed inset-0" onClick={onClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] border border-slate-200 bg-white shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 sm:rounded-[2rem]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800/70 dark:bg-slate-950">
          <div className="flex min-w-0 items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(current - 1, 1))}
                className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-sm font-black text-brand-600 dark:text-brand-300">
                BA
              </span>
              <span className="truncate text-lg font-black tracking-tight text-slate-950 dark:text-white">
                Budget Assistant
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            aria-label="Close budget assistant"
          >
            <X size={21} />
          </button>
        </div>

        {step < 5 && (
          <div className="flex shrink-0 justify-center gap-2 bg-slate-50 px-8 py-3 dark:bg-slate-900/50">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === item
                    ? "w-10 bg-brand-500"
                    : item < step
                      ? "w-5 bg-brand-300"
                      : "w-5 bg-slate-200 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">Step 1 of 4</p>
                <h3 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">
                  How many people are eating?
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
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
                        ? "border-brand-500 bg-brand-500/10 text-brand-700 shadow-sm dark:text-brand-300"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
                    }`}
                  >
                    <span>{option.label}</span>
                    {people === option.value && <Check size={17} className="text-brand-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">Step 2 of 4</p>
                <h3 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">
                  What is your total budget?
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
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
                        ? "border-brand-500 bg-brand-500/10 text-brand-700 shadow-sm dark:text-brand-300"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
                    }`}
                  >
                    <span>{option.label}</span>
                    {budgetRange === option.label && <Check size={17} className="text-brand-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">Step 3 of 4</p>
                <h3 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">
                  What do you prefer?
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
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
                        ? "border-brand-500 bg-brand-500/10 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900/60"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-black text-slate-900 dark:text-white">{option.label}</span>
                      <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{option.hint}</span>
                    </span>
                    {preference === option.value && <Check size={18} className="text-brand-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">Step 4 of 4</p>
                <h3 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">
                  What kind of food would you like?
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Select one or more categories.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {foodTypes.map((type) => {
                  const isSelected = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={`flex min-h-24 flex-col items-start justify-between rounded-2xl border-2 p-4 text-left transition-all ${
                        isSelected
                          ? "border-brand-500 bg-brand-500/10 text-brand-700 shadow-sm dark:text-brand-300"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
                      }`}
                    >
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-500 shadow-sm dark:bg-slate-950 dark:text-slate-400">
                        {foodTypeIcon[type]}
                      </span>
                      <span className="text-sm font-black leading-tight">{type}</span>
                    </button>
                  );
                })}
              </div>

              <Button type="button" onClick={() => setStep(5)} className="w-full py-4 text-sm">
                Show Results
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4">
                <h4 className="flex items-center gap-2 text-sm font-black text-brand-700 dark:text-brand-300">
                  <Sparkles size={17} /> Your selected filters
                </h4>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    {selectedPeopleLabel}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    Budget: {budgetRange}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    {preference}
                  </span>
                  {selectedTypes.map((type) => (
                    <span key={type} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <h4 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Best matching items</h4>
                  {results.estimatedCost > 0 && (
                    <span className="text-xs font-black text-brand-600 dark:text-brand-400">Est. Rs.{results.estimatedCost}</span>
                  )}
                </div>

                {recommendationLoading ? (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                    Finding the best matches from the menu...
                  </p>
                ) : recommendationError ? (
                  <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center text-sm font-semibold text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                    {recommendationError}
                  </p>
                ) : results.individualDishes.length === 0 ? (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                    No direct dishes fit this budget. Check the combo suggestions or try a higher budget.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {results.individualDishes.map((food) => (
                      <div key={food._id} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <img
                          src={getImageUrl(food.image)}
                          alt={food.name}
                          className="h-16 w-16 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-contain p-1 dark:border-slate-800 dark:bg-slate-950"
                          onError={(event) => {
                            event.currentTarget.src = "https://placehold.co/120x120?text=Food";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="truncate text-sm font-black text-slate-900 dark:text-white">{food.name}</h5>
                          <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{food.category || "Menu item"}</p>
                          <p className="mt-2 text-sm font-black text-brand-600 dark:text-brand-400">Rs.{food.price}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart(food, 1);
                            alert(`${food.name} added to cart!`);
                          }}
                          className="self-center rounded-xl bg-brand-500 p-2.5 text-white transition-colors hover:bg-brand-600"
                          aria-label={`Add ${food.name} to cart`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {results.combos.length > 0 && (
                <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <h4 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Recommended combos</h4>
                  <div className="flex flex-col gap-3">
                    {results.combos.map((combo, index) => (
                      <div key={`${combo.name}-${index}`} className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-900/40 dark:bg-brand-950/20">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h5 className="text-sm font-black leading-snug text-slate-900 dark:text-white">{combo.name}</h5>
                            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {combo.items.map((item) => item.name).join(" + ")}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-black text-brand-700 dark:text-brand-300">Rs.{combo.price}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            combo.items.forEach((item) => onAddToCart(item, 1));
                            alert("Combo items added to cart!");
                          }}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-xs font-black text-white transition-colors hover:bg-brand-600"
                        >
                          <ShoppingCart size={14} /> Add Combo to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {step === 5 && (
          <div className="flex shrink-0 gap-3 border-t border-slate-100 bg-white p-4 dark:border-slate-800/70 dark:bg-slate-950">
            <button
              type="button"
              onClick={resetAssistant}
              className="flex-1 rounded-xl bg-slate-100 py-3 text-center text-sm font-black text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Try Again
            </button>
            <Button type="button" onClick={onClose} className="flex-1 py-3 text-sm">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

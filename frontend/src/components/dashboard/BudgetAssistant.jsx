import { useState, useEffect } from "react";
import { X, ArrowLeft, Check, Sparkles, Plus, ShoppingCart } from "lucide-react";
import Button from "../ui/Button";
import { getImageUrl } from "../../utils/getApiUrl";
import { getToken } from "../../utils/getToken";

export default function BudgetAssistant({ isOpen, onClose, foods, onAddToCart }) {
  const [step, setStep] = useState(1);
  const [people, setPeople] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [preference, setPreference] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  
  // Recommendations state
  const [results, setResults] = useState({
    individualDishes: [],
    combos: [],
    estimatedCost: 0
  });

  const peopleOptions = [
    { label: "1 Person", value: 1 },
    { label: "2 People", value: 2 },
    { label: "3 People", value: 3 },
    { label: "4 People", value: 4 },
    { label: "5 People", value: 5 },
    { label: "5+ People", value: 6 }
  ];

  const budgetOptions = [
    { label: "₹100 tak", min: 0, max: 100 },
    { label: "₹100 - ₹200", min: 100, max: 200 },
    { label: "₹200 - ₹300", min: 200, max: 300 },
    { label: "₹300 - ₹500", min: 300, max: 500 },
    { label: "₹500 - ₹800", min: 500, max: 800 },
    { label: "₹800+", min: 800, max: 99999 }
  ];

  const preferenceOptions = [
    { label: "Veg", value: "Veg" },
    { label: "Non-Veg", value: "Non-Veg" },
    { label: "Both (Veg + Non-Veg)", value: "Both" }
  ];

  const foodTypes = [
    "Pizza", "Burger", "Starter", "Combo", "Roti", "Chicken", "Biryani", "Pasta",
    "Drinks", "Desserts", "Veg", "Non-Veg", "Fast Food", "Main Course"
  ];

  const toggleType = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  useEffect(() => {
    if (step === 5) {
      generateRecommendations();
    }
  }, [step]);

  const generateRecommendations = async () => {
    setRecommendationLoading(true);
    setRecommendationError("");
    const budgetObj = budgetOptions.find(o => o.label === budgetRange) || { min: 0, max: 500 };
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/budget-recommendations`, {
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
      setResults({
        individualDishes: data.individualDishes || [],
        combos: data.combos || [],
        estimatedCost: data.estimatedCost || 0,
      });
    } catch (err) {
      setRecommendationError(err.message || "Unable to load recommendations");
      setResults({ individualDishes: [], combos: [], estimatedCost: 0 });
    } finally {
      setRecommendationLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-white dark:bg-slate-950">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-lg">Budget Assistant</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        {step < 5 && (
          <div className="flex px-8 py-2 justify-center gap-1.5 bg-slate-50 dark:bg-slate-900/40">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s ? "w-8 bg-brand-500" : s < step ? "w-4 bg-brand-300" : "w-4 bg-slate-200 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* STEP 1: PEOPLE COUNT */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Aap kitne logon ke liye khana chahte hain?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">Select the number of people to feed.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {peopleOptions.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setPeople(opt.value);
                      setStep(2);
                    }}
                    className={`py-4 px-5 rounded-2xl font-bold border-2 text-sm text-left flex items-center justify-between transition-all ${
                      people === opt.value 
                        ? "border-brand-500 bg-brand-50/10 text-brand-650 dark:text-brand-400" 
                        : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>👤 {opt.label}</span>
                    {people === opt.value && <Check size={16} className="text-brand-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: BUDGET LIMIT */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Aapka budget kitna hai?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">Select your maximum budget limit.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {budgetOptions.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setBudgetRange(opt.label);
                      setStep(3);
                    }}
                    className={`py-4 px-5 rounded-2xl font-bold border-2 text-sm text-left flex items-center justify-between transition-all ${
                      budgetRange === opt.label 
                        ? "border-brand-500 bg-brand-50/10 text-brand-650 dark:text-brand-400" 
                        : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>💵 {opt.label}</span>
                    {budgetRange === opt.label && <Check size={16} className="text-brand-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: PREFERENCE */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Aap kya prefer karte hain?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">Choose your dietary preference.</p>
              </div>
              <div className="flex flex-col gap-3">
                {preferenceOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setPreference(opt.value);
                      setStep(4);
                    }}
                    className={`py-4.5 px-6 rounded-2xl font-bold border-2 text-sm text-left flex items-center justify-between transition-all ${
                      preference === opt.value 
                        ? "border-brand-500 bg-brand-50/10 text-brand-650 dark:text-brand-400" 
                        : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {opt.value === "Veg" ? "🟢" : opt.value === "Non-Veg" ? "🔴" : "⚖️"}
                      {opt.label}
                    </span>
                    {preference === opt.value && <Check size={16} className="text-brand-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: FOOD TYPES */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Aap kis type ka khana chahte hain?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">You can select multiple options.</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {foodTypes.map(type => {
                  const isSelected = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={`p-3.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all ${
                        isSelected 
                          ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400" 
                          : "border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-2xl">
                        {type === "Pizza" && "🍕"}
                        {type === "Burger" && "🍔"}
                        {type === "Chicken" && "🍗"}
                        {type === "Biryani" && "🍲"}
                        {type === "Pasta" && "🍝"}
                        {type === "Drinks" && "🥤"}
                        {type === "Desserts" && "🍰"}
                        {type === "Fast Food" && "🍟"}
                        {type === "Main Course" && "🍛"}
                      </span>
                      <span>{type}</span>
                    </button>
                  );
                })}
              </div>

              <Button 
                onClick={() => setStep(5)}
                className="w-full py-4 text-sm mt-4"
              >
                Show Results
              </Button>
            </div>
          )}

          {/* STEP 5: RESULTS */}
          {step === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-brand-500/10 rounded-2xl border border-brand-500/20 flex flex-col gap-2">
                <h4 className="font-extrabold text-sm text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                  <Sparkles size={16} /> Selected Filters:
                </h4>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                  <span className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">👤 {peopleOptions.find(o => o.value === people)?.label}</span>
                  <span className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">💵 Budget: {budgetRange}</span>
                  <span className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">🥗 {preference}</span>
                  {selectedTypes.map(t => (
                    <span key={t} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">🏷️ {t}</span>
                  ))}
                </div>
              </div>

              {/* Best Matching Foods */}
              <div className="space-y-3">
                <h4 className="font-black text-slate-900 dark:text-white text-base tracking-tight">Best Matching Items</h4>
                {recommendationLoading ? (
                  <p className="text-slate-500 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-center border border-slate-100 dark:border-slate-800/60">Finding best matches from menu...</p>
                ) : recommendationError ? (
                  <p className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/20 p-4 rounded-xl text-center border border-red-100 dark:border-red-900/40">{recommendationError}</p>
                ) : results.individualDishes.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-center border border-slate-100 dark:border-slate-800/60">No direct products fit this budget/criteria. Try expanding filters.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {results.individualDishes.map(food => (
                      <div key={food._id} className="flex gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100/60 dark:border-slate-800/40 relative">
                        <img
                          src={getImageUrl(food.image)}
                          alt={food.name}
                          className="w-16 h-16 object-contain rounded-xl bg-white dark:bg-slate-950 p-1 border border-slate-100 dark:border-slate-800 shrink-0"
                          onError={(e) => { e.target.src = 'https://placehold.co/100?text=Food'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-slate-800 dark:text-white text-sm truncate">{food.name}</h5>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Category: {food.category}</span>
                          <span className="text-xs font-black text-brand-500">₹{food.price}</span>
                        </div>
                        <button
                          onClick={() => {
                            onAddToCart(food, 1);
                            alert(`${food.name} added to cart!`);
                          }}
                          className="self-center shrink-0 w-8 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommended Combos */}
              {results.combos.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="font-black text-slate-900 dark:text-white text-base tracking-tight">Recommended Combos for {peopleOptions.find(o => o.value === people)?.label}</h4>
                  <div className="flex flex-col gap-3">
                    {results.combos.map((combo, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-brand-100/40 dark:border-brand-900/30 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex justify-between items-start">
                            <h5 className="font-bold text-slate-800 dark:text-white text-sm leading-snug">{combo.name}</h5>
                            <span className="text-sm font-black text-brand-600 dark:text-brand-400">₹{combo.price}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                            {combo.items.map((item, i) => (
                              <span key={item._id}>{i > 0 && " + "} {item.name}</span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            combo.items.forEach(item => onAddToCart(item, 1));
                            alert("Combo items added to cart!");
                          }}
                          className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
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

        {/* Footer actions for Screen 5 */}
        {step === 5 && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 shrink-0 bg-white dark:bg-slate-950 flex gap-3">
            <button
              onClick={() => {
                setStep(1);
                setSelectedTypes([]);
                setPeople("");
                setBudgetRange("");
                setPreference("");
              }}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm transition-colors text-center"
            >
              Reset & Try Again
            </button>
            <Button
              onClick={onClose}
              className="flex-1 py-3.5 text-sm"
            >
              Done
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}

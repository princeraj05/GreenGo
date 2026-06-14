import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, UploadCloud, X, UtensilsCrossed, Clock, Flame, Users, Pencil } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

// Framer Motion helper for animated layouts
const MotionDiv = motion.div;

// Pre-defined menu category labels
const CATEGORY_OPTIONS = [
  "Starter",
  "Combo",
  "Roti",
  "Pizza",
  "Burger",
  "Biryani",
  "Rolls",
  "Fries",
  "North Indian",
  "Desserts",
  "Bowl",
  "Veg Meal",
  "Paneer",
  "Paratha",
  "Sandwich",
  "Rice",
  "Cake",
  "Dal",
  "Thali",
  "Aloo Paratha",
  "Italian",
  "Shawarma",
  "Noodles",
  "Shake",
  "Pasta",
  "Dal Makhani",
  "Patty",
  "Paneer Biryani",
  "Rajma Rice",
  "Mousse",
  "Milkshake",
  "Sweets",
  "Ice Cream",
  "Cold Coffee",
  "Cheesecake",
  "Brownie",
  "Tea",
  "Gulab Jamun",
  "Pastry",
  "Chaap",
  "Rajma",
  "Kulche",
  "Kebabs",
  "Maggi",
  "Bhurji",
  "Juice",
  "Chicken",
  "Non-Veg",
  "Drinks",
];

// Pre-defined variant size labels
const VARIANT_OPTIONS = ["Full Plate", "Half Plate", "Regular", "Large", "Small"];

// Pre-defined spice indicators
const SPICE_LEVELS = ["Mild", "Medium", "Hot", "Extra Hot"];

// Pre-defined preparation range choices
const PREP_TIME_OPTIONS = ["5 - 10 min", "10 - 15 min", "15 - 20 min", "20 - 30 min", "30 - 45 min", "45+ min"];

// Default form shape for menu additions/edits
const INITIAL_FORM = {
  name: "",
  price: "",
  offerPrice: "",
  description: "",
  categories: ["Starter"],
  veg: "true",
  foodType: "single",
  mealCategory: "Anytime",
  servingSize: "1",
  packingCharge: "",
  variants: ["Full Plate"],
  variantPrices: { "Full Plate": "" },
  customVariant: "",
  comboItems: [{ name: "", price: "" }],
  preparationTime: "15 - 20 min",
  spiceLevel: "Medium",
  sizeLevel: "Medium",
  categoryImage: "",
  image: null,
  categoryImageFile: null,
};

// Styling helper for reuse across input parameters
const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none text-slate-900 dark:text-white font-medium text-sm transition-all placeholder:text-slate-400";

/**
 * ManageFoods Component
 * Comprehensive product catalog CRUD manager. Enables admins to register food items,
 * assign multiple categories, toggle dietary classifications (veg/non-veg/egg), configure variants
 * with independent prices, and build customized combos.
 */
export default function ManageFoods() {
  
  // ==========================================
  // STATE DECLARATIONS
  // ==========================================

  // Catalog items list retrieved from the endpoint
  const [foods, setFoods] = useState([]);

  // Active form state model tracking all input details
  const [form, setForm] = useState(INITIAL_FORM);

  // Stores base64 or object-url representation of food image preview
  const [preview, setPreview] = useState(null);

  // Targets current food item ID being edited, or null if creating new
  const [editingId, setEditingId] = useState(null);

  // Global loading state during write operations
  const [loading, setLoading] = useState(false);

  // Boolean state denoting if custom variant input box is visible
  const [showCustomVariant, setShowCustomVariant] = useState(false);

  // Active filter category selection string for bottom list
  const [filterCategory, setFilterCategory] = useState("All");

  const [customCategories, setCustomCategories] = useState(() => {
    const saved = localStorage.getItem("admin_custom_categories");
    return saved ? JSON.parse(saved) : [];
  });
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const allCategories = useMemo(() => {
    return [...CATEGORY_OPTIONS, ...customCategories];
  }, [customCategories]);

  const handleAddCategory = () => {
    const clean = newCategoryInput.trim();
    if (!clean) return;
    if (allCategories.some(cat => cat.toLowerCase() === clean.toLowerCase())) {
      alert("Category already exists.");
      return;
    }
    const updated = [...customCategories, clean];
    setCustomCategories(updated);
    localStorage.setItem("admin_custom_categories", JSON.stringify(updated));
    setNewCategoryInput("");
  };

  // ==========================================
  // DATA FETCHING & EVENT HANDLERS
  // ==========================================

  // Automatically fetch catalog items on mount
  useEffect(() => { loadFoods(); }, []);

  /**
   * Loads list of food items from API.
   */
  const loadFoods = async () => {
    try {
      const res = await API.get("/api/foods");
      setFoods(res.data);
    } catch (err) { console.log(err); }
  };

  /**
   * Standardized input form field changes handler.
   * Special case for handling binary uploads.
   */
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setForm(f => ({ ...f, image: file }));
      setPreview(file ? URL.createObjectURL(file) : null);
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  /**
   * Toggles the presence of a selected category tags.
   */
  const toggleCategory = (cat) => {
    setForm(f => {
      const next = f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat];
      return { ...f, categories: next.length ? next : [cat] };
    });
  };

  /**
   * Handles toggle changes inside the variant selection list.
   */
  const toggleVariant = (variant) => {
    setForm(f => ({
      ...f,
      variants: f.variants.includes(variant)
        ? f.variants.filter(v => v !== variant)
        : [...f.variants, variant],
      variantPrices: { ...f.variantPrices, [variant]: f.variantPrices?.[variant] || f.price || "" },
    }));
  };

  /**
   * Submits a custom variant addition into the selected variants pool.
   */
  const addCustomVariant = () => {
    const name = form.customVariant.trim();
    if (!name) return;
    setForm(f => ({
      ...f,
      variants: f.variants.includes(name) ? f.variants : [...f.variants, name],
      variantPrices: { ...f.variantPrices, [name]: f.price || "" },
      customVariant: "",
    }));
    setShowCustomVariant(false);
  };

  /**
   * Binds independent pricing strings onto unique size/variant combinations.
   */
  const handleVariantPrice = (variant, value) => {
    setForm(f => ({ ...f, variantPrices: { ...f.variantPrices, [variant]: value } }));
  };

  /**
   * Modifies dynamic details inside the dynamic combo list grid rows.
   */
  const updateComboItem = (index, field, value) => {
    setForm(f => ({
      ...f,
      comboItems: f.comboItems.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  // Appends an empty row item template structure onto the combo items array
  const addComboRow = () => setForm(f => ({ ...f, comboItems: [...f.comboItems, { name: "", price: "" }] }));

  // Removes a specified row index item from the current combo setup layout
  const removeComboRow = (index) => setForm(f => ({
    ...f,
    comboItems: f.comboItems.length > 1 ? f.comboItems.filter((_, i) => i !== index) : [{ name: "", price: "" }],
  }));

  // Compiles and cleans raw UI inputs inside combo records into uniform database schemas
  const parseComboItems = () => form.comboItems
    .map(item => ({ name: String(item.name || "").trim(), price: Number(item.price || 0) }))
    .filter(item => item.name);

  // Memoized pricing statistics output summaries for combo items configuration
  const comboSummary = useMemo(() => {
    const items = form.comboItems
      .map(item => ({ name: String(item.name || "").trim(), price: Number(item.price || 0) }))
      .filter(item => item.name);
    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
    const comboPrice = Number(form.price || 0);
    const saving = Math.max(0, totalPrice - comboPrice);
    const savingPercent = totalPrice > 0 ? Math.round((saving / totalPrice) * 100) : 0;
    return { items, totalPrice, comboPrice, saving, savingPercent };
  }, [form.comboItems, form.price]);

  /**
   * Finalizes item creation or update procedures.
   * Compiles data payload into Form Data format to deliver uploads.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.description || (!form.image && !editingId)) {
      alert("All required fields must be filled."); return;
    }
    if (!form.categories.length) { alert("Select at least one category."); return; }
    if (form.foodType === "combo" && parseComboItems().length < 2) {
      alert("Combo needs at least 2 items."); return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("price", form.offerPrice || form.price);
      fd.append("description", form.description);
      fd.append("category", form.categories[0] || "Starter");
      fd.append("categories", JSON.stringify(form.categories));
      fd.append("veg", form.veg);
      fd.append("foodType", form.foodType);
      fd.append("mealCategory", form.mealCategory);
      fd.append("servingSize", form.servingSize);
      fd.append("packingCharge", form.packingCharge || 0);
      fd.append("variants", JSON.stringify(form.variants.map(v => ({
        name: v, price: Number(form.variantPrices?.[v] || form.price || 0),
      }))));
      fd.append("comboItems", JSON.stringify(form.foodType === "combo" ? parseComboItems() : []));
      fd.append("preparationTime", form.preparationTime);
      fd.append("spiceLevel", form.spiceLevel);
      fd.append("sizeLevel", form.sizeLevel);
      fd.append("categoryImageCurrent", form.categoryImage || "");
      if (form.image) fd.append("image", form.image);
      if (form.categoryImageFile) fd.append("categoryImage", form.categoryImageFile);

      const headers = { Authorization: `Bearer ${token}` };
      if (editingId) {
        await API.put(`/api/foods/${editingId}`, fd, { headers });
      } else {
        await API.post("/api/foods", fd, { headers });
      }
      resetForm();
      loadFoods();
    } catch (err) { console.log(err); } finally { setLoading(false); }
  };

  // Flushes temporary parameters out of form inputs back to clean defaults
  const resetForm = () => {
    setForm(INITIAL_FORM);
    setPreview(null);
    setEditingId(null);
    const inp = document.getElementById("foodImageInput");
    if (inp) inp.value = "";
  };

  /**
   * Initializes editing actions by loading parameters from an item index.
   */
  const startEdit = (food) => {
    setForm({
      ...INITIAL_FORM,
      name: food.name,
      price: food.price,
      offerPrice: "",
      description: food.description,
      categories: Array.isArray(food.categories) && food.categories.length ? food.categories : [food.category || "Starter"],
      veg: food.veg === false ? "false" : "true",
      foodType: food.foodType || "single",
      mealCategory: food.mealCategory || "Anytime",
      servingSize: String(food.servingSize || 1),
      packingCharge: food.packingCharge ? String(food.packingCharge) : "",
      variants: Array.isArray(food.variants) && food.variants.length
        ? food.variants.map(v => typeof v === "string" ? v : v.name).filter(Boolean)
        : ["Full Plate"],
      variantPrices: Array.isArray(food.variants) && food.variants.length
        ? food.variants.reduce((acc, v) => {
            const name = typeof v === "string" ? v : v.name;
            if (name) acc[name] = typeof v === "string" ? String(food.price || "") : String(v.price || food.price || "");
            return acc;
          }, {})
        : { "Full Plate": String(food.price || "") },
      comboItems: Array.isArray(food.comboItems) && food.comboItems.length
        ? food.comboItems.map(item => ({ name: item.name || "", price: String(item.price || "") }))
        : [{ name: "", price: "" }],
      preparationTime: food.preparationTime || "15 - 20 min",
      spiceLevel: food.spiceLevel || "Medium",
      sizeLevel: food.sizeLevel || "Medium",
      categoryImage: food.categoryImage || "",
      image: null,
      categoryImageFile: null,
    });
    setPreview(food.image?.startsWith("http") ? food.image : `${import.meta.env.VITE_API_URL}/uploads/${food.image}`);
    setEditingId(food._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Submits a deletion request for a catalog record.
   */
  const deleteFood = async (id) => {
    if (!window.confirm("Delete this food item?")) return;
    try {
      const token = await getToken();
      await API.delete(`/api/foods/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadFoods();
    } catch (err) { console.log(err); }
  };

  // Compiles all dynamically configured category filters in bottom menu selections list
  const allCategoryFilters = ["All", ...new Set(foods.flatMap(f =>
    Array.isArray(f.categories) && f.categories.length ? f.categories : [f.category || "Starter"]
  ))];

  // Filters list of items rendered inside current menu container based on selected category tags
  const displayedFoods = filterCategory === "All" ? foods : foods.filter(f => {
    const cats = Array.isArray(f.categories) && f.categories.length ? f.categories : [f.category || ""];
    return cats.includes(filterCategory);
  });

  return (
    // Outer page structure with bottom padding margins
    <div className="w-full pt-6 md:pt-0 pb-16">

      {/* --- HEADER SECTION --- */}
      {/* Tailwind classes: flex layouts wrap items on smaller viewports; tracking-tight aligns font spacings */}
      <MotionDiv initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {editingId ? "Edit Food Item" : "Add Food Item"}
          </h1>
          <nav className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-400">
            <span>Dashboard</span><span>/</span><span>Menu</span><span>/</span>
            <span className="text-emerald-600">{editingId ? "Edit Food" : "Add Food"}</span>
          </nav>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={resetForm} variant="ghost" className="rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
            Cancel
          </Button>
          <Button type="submit" form="food-form" disabled={loading} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2 min-w-[140px]">
            {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
            {editingId ? "Save Food Item" : "Save Food Item"}
          </Button>
        </div>
      </MotionDiv>
      {/* --- END HEADER SECTION --- */}

      {/* --- CRUD FORM LAYOUT --- */}
      {/* Uses a 2-column layout on extra large viewports ('xl:grid-cols-[1fr_300px]') to separate form content and media previews */}
      <form id="food-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">

          {/* ── LEFT COLUMN: FORM SECTIONS ── */}
          <div className="space-y-5">

            {/* Section 1: Basic Info */}
            <Card className="p-6 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <SectionTitle num={1} title="Basic Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Food Name <Required /></FieldLabel>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Enter food name" className={inputCls} />
                </div>
                <div>
                  <FieldLabel>Packing Charge (₹)</FieldLabel>
                  <input name="packingCharge" type="number" min="0" value={form.packingCharge} onChange={handleChange} placeholder="0 for no charge" className={inputCls} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Description <Required /></FieldLabel>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                    placeholder="Write a short description about this food..." maxLength={200}
                    className={inputCls + " resize-none"} />
                  <div className="text-right text-[10px] text-slate-400 mt-1">{form.description.length}/200</div>
                </div>
              </div>
            </Card>

            {/* Section 2: Food Type (Single/Combo) */}
            <Card className="p-6 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <SectionTitle num={2} title="Food Type" />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "single", label: "Single Item", sub: "This is a single food item" },
                  { value: "combo", label: "Combo", sub: "This is a combo of multiple items" },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, foodType: opt.value }))}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      form.foodType === opt.value
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    }`}>
                    <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      form.foodType === opt.value ? "border-emerald-500" : "border-slate-300"
                    }`}>
                      {form.foodType === opt.value && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{opt.label}</div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">{opt.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Section 3 + 4: Categories & Veg Type */}
            <Card className="p-6 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
                <div>
                  <SectionTitle num={3} title="Categories" sub="Select Multiple" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-2">
                    {allCategories.map(cat => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer select-none">
                        <span
                          onClick={() => toggleCategory(cat)}
                          className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 transition-all cursor-pointer ${
                            form.categories.includes(cat)
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-slate-300 dark:border-slate-600 hover:border-emerald-400"
                          }`}>
                          {form.categories.includes(cat) && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </span>
                        <span onClick={() => toggleCategory(cat)} className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-tight cursor-pointer">{cat}</span>
                      </label>
                    ))}
                  </div>

                  {/* Add Custom Category Input */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex gap-2 max-w-sm">
                    <input
                      type="text"
                      placeholder="Add custom category..."
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-850 dark:bg-slate-900 text-xs font-semibold text-slate-850 dark:text-slate-200 outline-none focus:border-brand-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-sm transition-all"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div>
                  <SectionTitle num={4} title="Food Type" sub="Veg / Non-Veg" />
                  <div className="space-y-2">
                    {[
                      { value: "true", label: "Veg", emoji: "🥦", active: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300" },
                      { value: "false", label: "Non-Veg", emoji: "🍗", active: "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300" },
                      { value: "egg", label: "Egg", emoji: "🥚", active: "border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300" },
                    ].map(opt => (
                      <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, veg: opt.value }))}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all ${
                          form.veg === opt.value ? opt.active : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                        }`}>
                        <span className="text-lg">{opt.emoji}</span>
                        <span className="font-bold text-sm">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 5: Meal Category */}
            <Card className="p-6 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <SectionTitle num={5} title="Meal Category" sub="When is it served?" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: "Breakfast", label: "Breakfast", sub: "Morning (6 AM – 11 AM)", icon: "🌅" },
                  { value: "Lunch", label: "Lunch", sub: "Afternoon (11 AM – 4 PM)", icon: "☀️" },
                  { value: "Dinner", label: "Dinner", sub: "Evening (4 PM – 11 PM)", icon: "🌙" },
                  { value: "Anytime", label: "Anytime", sub: "All Day", icon: "🕐" },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, mealCategory: opt.value }))}
                    className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-left transition-all ${
                      form.mealCategory === opt.value
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    }`}>
                    <span className="text-xl">{opt.icon}</span>
                    <div>
                      <div className={`font-bold text-sm ${form.mealCategory === opt.value ? "text-emerald-700 dark:text-emerald-300" : "text-slate-800 dark:text-slate-200"}`}>{opt.label}</div>
                      <div className="text-[10px] text-slate-400 font-medium leading-tight">{opt.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Section 6 + 7: Serving For + Pricing */}
            <Card className="p-6 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <SectionTitle num={6} title="Serving For" sub="How many people it serves" />
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: "1", label: "1 Person", icon: "👤" },
                      { value: "2", label: "2 Person", icon: "👥" },
                      { value: "3", label: "3 Person", icon: "👨‍👩‍👦" },
                      { value: "4", label: "4+ Person", icon: "👨‍👩‍👧‍👦" },
                    ].map(opt => (
                      <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, servingSize: opt.value }))}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                          form.servingSize === opt.value
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}>
                        <span>{opt.icon}</span> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionTitle num={7} title="Pricing" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Price (₹) <Required /></FieldLabel>
                      <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Enter price" className={inputCls} />
                    </div>
                    <div>
                      <FieldLabel>Offer Price (₹)</FieldLabel>
                      <input name="offerPrice" type="number" value={form.offerPrice} onChange={handleChange} placeholder="Enter offer price (optional)" className={inputCls} />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 8: Variants */}
            <Card className="p-6 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <SectionTitle num={8} title="Quantity / Variant" sub="Select or add variants" />
              <div className="flex flex-wrap gap-2 mb-4">
                {VARIANT_OPTIONS.map(v => (
                  <button key={v} type="button" onClick={() => toggleVariant(v)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                      form.variants.includes(v)
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}>
                    {v}
                  </button>
                ))}
                {form.variants.filter(v => !VARIANT_OPTIONS.includes(v)).map(v => (
                  <button key={v} type="button" onClick={() => toggleVariant(v)}
                    className="px-4 py-2 rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-sm font-bold">
                    ✏️ {v}
                  </button>
                ))}
                <button type="button" onClick={() => setShowCustomVariant(v => !v)}
                  className="px-4 py-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm font-bold flex items-center gap-1.5 hover:border-emerald-400 transition-colors">
                  <Plus size={13} /> Add New Variant
                </button>
              </div>

              {showCustomVariant && (
                <div className="flex gap-2 mb-4">
                  <input value={form.customVariant} onChange={e => setForm(f => ({ ...f, customVariant: e.target.value }))}
                    placeholder="e.g. Extra Large" className={inputCls + " flex-1"}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomVariant())} />
                  <button type="button" onClick={addCustomVariant} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm">Add</button>
                  <button type="button" onClick={() => setShowCustomVariant(false)} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl">
                    <X size={16} />
                  </button>
                </div>
              )}

              {form.variants.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {form.variants.map(v => (
                    <div key={v} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wide mb-1.5">{v} Price (₹)</label>
                      <input type="number" min="0" placeholder="Enter price"
                        value={form.variantPrices?.[v] || ""}
                        onChange={e => handleVariantPrice(v, e.target.value)}
                        className={inputCls} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Section 9: Combo Details */}
            {form.foodType === "combo" && (
              <Card className="p-6 border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10">
                <SectionTitle num={9} title="Combo Details" sub="Only if Combo selected" />

                <div className="mb-4">
                  <FieldLabel>Combo For (Serves)</FieldLabel>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {[
                      { value: "1", label: "1 Person" },
                      { value: "2", label: "2 Person" },
                      { value: "3", label: "3 Person" },
                      { value: "4", label: "4+ Person" },
                    ].map(opt => (
                      <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, servingSize: opt.value }))}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                          form.servingSize === opt.value
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900"
                        }`}>
                        <Users size={13} /> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <FieldLabel>Combo Items</FieldLabel>
                  <div className="space-y-2 mt-1">
                    {form.comboItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-[1fr_130px_44px] gap-2 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <input placeholder="Food name, e.g. Chicken Roll" value={item.name}
                          onChange={e => updateComboItem(index, "name", e.target.value)} className={inputCls} />
                        <input type="number" min="0" placeholder="₹ Price" value={item.price}
                          onChange={e => updateComboItem(index, "price", e.target.value)} className={inputCls} />
                        <button type="button" onClick={() => removeComboRow(index)}
                          className="h-[46px] w-11 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-100 dark:border-red-900/40 flex items-center justify-center">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addComboRow}
                    className="mt-2 w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors">
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                <div className="mb-4">
                  <FieldLabel>Combo Price (₹) <Required /></FieldLabel>
                  <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Enter combo price" className={inputCls + " mt-1"} />
                </div>

                {/* Summary Box */}
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-white dark:bg-slate-950 overflow-hidden">
                  <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30">
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Combo Summary</span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {[
                      { label: "Total Items", value: String(comboSummary.items.length) },
                      { label: "Total Price", value: `₹${comboSummary.totalPrice}` },
                      { label: "Combo Price", value: `₹${comboSummary.comboPrice}`, bold: true },
                      { label: "You Save", value: `₹${comboSummary.saving} (${comboSummary.savingPercent}%)`, green: true },
                    ].map(row => (
                      <div key={row.label}>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{row.label}</div>
                        <div className={`text-sm font-black mt-0.5 ${row.green ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-white"}`}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Section 10: Additional Info */}
            <Card className="p-6 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <SectionTitle num={10} title="Additional Information" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel><Clock size={13} className="inline mr-1" />Preparation Time</FieldLabel>
                  <select name="preparationTime" value={form.preparationTime} onChange={handleChange} className={inputCls + " mt-1"}>
                    {PREP_TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel><Flame size={13} className="inline mr-1" />Spice Level</FieldLabel>
                  <select name="spiceLevel" value={form.spiceLevel} onChange={handleChange} className={inputCls + " mt-1"}>
                    {SPICE_LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </Card>

          </div>

          {/* ── RIGHT COLUMN: DYNAMIC UPLOAD CONTROL CARD ── */}
          {/* Card is locked sticky relative to scrolling boundaries */}
          <div>
            <Card className="p-6 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 sticky top-20">
              <h2 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                Food Image <span className="text-red-500">*</span>
                <span className="font-semibold text-slate-400 ml-1 text-xs">(1:1 Ratio)</span>
              </h2>
              <div className="border-b border-slate-100 dark:border-slate-800 mb-4" />

              <div className="relative mb-5">
                <input id="foodImageInput" name="image" type="file" onChange={handleChange} accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors overflow-hidden ${
                  preview ? "border-emerald-300 dark:border-emerald-700" : "border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                }`}>
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                        <UploadCloud size={22} className="text-slate-400" />
                      </div>
                      <div className="text-center px-4">
                        <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">Upload Image</div>
                        <div className="text-xs text-slate-400 mt-1">Recommended size 800x800px</div>
                        <div className="text-xs text-slate-400">JPG, PNG up to 2MB</div>
                      </div>
                    </>
                  )}
                </div>
                {preview && (
                  <button type="button" onClick={() => { setPreview(null); setForm(f => ({ ...f, image: null })); const inp = document.getElementById("foodImageInput"); if (inp) inp.value = ""; }}
                    className="absolute top-2 right-2 z-20 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <Button type="button" onClick={resetForm} variant="ghost" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                  {editingId ? "Save Food Item" : "Save Food Item"}
                </Button>
              </div>
            </Card>
          </div>

        </div>
      </form>
      {/* --- END CRUD FORM LAYOUT --- */}

      {/* --- BOTTOM SECTION: CATALOG ITEMS DISPLAY & SEARCH/FILTER --- */}
      <div className="mt-14 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Current Menu ({foods.length})</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {allCategoryFilters.slice(0, 10).map(cat => (
              <button key={cat} type="button" onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filterCategory === cat
                    ? "bg-emerald-500 text-white"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Catalog items Grid rendering */}
      <MotionDiv layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {displayedFoods.map((f, i) => (
            <MotionDiv key={f._id} layout
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04 }}>
              <Card hover className="overflow-hidden flex flex-col h-full border-slate-100 dark:border-slate-800/60 p-2 bg-white dark:bg-slate-950 group">
                <div className="relative h-48 overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center p-2">
                  <img
                    src={f.image?.startsWith("http") ? f.image : `${import.meta.env.VITE_API_URL}/uploads/${f.image}`}
                    className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-500 group-hover:scale-105"
                    alt={f.name} />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button onClick={() => startEdit(f)} className="w-8 h-8 rounded-lg bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-center text-blue-600 shadow-sm hover:bg-blue-500 hover:text-white transition-all">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteFood(f._id)} className="w-8 h-8 rounded-lg bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-center text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className={`absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full border-2 ${f.veg === false ? "border-red-500 bg-red-500" : "border-emerald-500 bg-emerald-500"}`} />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-black text-slate-950 dark:text-white text-base leading-tight mb-1.5 group-hover:text-emerald-600 transition-colors">{f.name}</h3>
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {(Array.isArray(f.categories) && f.categories.length ? f.categories : [f.category || "Food"]).slice(0, 2).map(c => (
                      <span key={c} className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 rounded-md">{c}</span>
                    ))}
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${f.veg === false ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"}`}>
                      {f.veg === false ? "Non-Veg" : "Veg"}
                    </span>
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs line-clamp-2 mb-3 flex-1 font-medium">{f.description}</p>
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    <span className="font-black text-emerald-600 text-xl">₹{f.price}</span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock size={10} />{f.preparationTime || "15-20 min"}
                    </span>
                  </div>
                </div>
              </Card>
            </MotionDiv>
          ))}
        </AnimatePresence>

        {/* Empty catalog fallback interface */}
        {displayedFoods.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/60">
            <UtensilsCrossed size={28} className="text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-950 dark:text-white mb-1">No foods found</h3>
            <p className="text-slate-400 font-medium text-sm">Your menu is empty. Add a new item above.</p>
          </div>
        )}
      </MotionDiv>
      {/* --- END BOTTOM CATALOG SECTION --- */}

    </div>
  );
}

// ==========================================
// FORM HELPER COMPONENTS
// ==========================================

function SectionTitle({ num, title, sub }) {
  return (
    <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
      <h2 className="text-base font-black text-slate-900 dark:text-white">
        {num}. {title}
        {sub && <span className="text-xs font-semibold text-slate-400 ml-2">({sub})</span>}
      </h2>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">{children}</label>;
}

function Required() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

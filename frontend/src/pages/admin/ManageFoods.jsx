import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Star, ImagePlus, UploadCloud, X, UtensilsCrossed } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";

export default function ManageFoods() {
  const categoryOptions = [
    "All", "Party Chakhna", "Pizza", "Momo", "Fast Food", "Chinese", "Starter",
    "Main Course", "Biryani", "Roti & Breads", "Drinks", "Cake", "Dessert",
    "Snacks", "Thali", "Roll & Wraps", "Sandwich", "Soup", "Tea & Coffee"
  ];
  const variantOptions = ["Full Plate", "Half Plate", "Regular", "Large", "Small"];
  const [foods, setFoods] = useState([]);
  const initialForm = {
    name: "",
    price: "",
    description: "",
    category: "Fast Food",
    veg: "true",
    foodType: "single",
    mealCategory: "Anytime",
    servingSize: "1",
    packingCharge: "",
    variants: ["Regular"],
    comboItemsText: "",
    categoryImage: "",
    image: null,
    categoryImageFile: null
  };
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState(null);
  const [categoryPreview, setCategoryPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadFoods(); }, []);

  const loadFoods = async () => {
    try {
      const res = await API.get("/api/foods");
      setFoods(res.data);
    } catch (err) { console.log(err); }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setForm({ ...form, image: file });
      if (file) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview(null);
      }
    } else if (name === "categoryImage") {
      const file = files[0];
      setForm({ ...form, categoryImageFile: file });
      if (file) {
        setCategoryPreview(URL.createObjectURL(file));
      } else {
        setCategoryPreview(form.categoryImage || null);
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };
  const toggleVariant = (variant) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.includes(variant)
        ? current.variants.filter((item) => item !== variant)
        : [...current.variants, variant]
    }));
  };

  const parseComboItems = () => form.comboItemsText
    .split("\n")
    .map((line) => {
      const [name, price] = line.split("|").map((part) => String(part || "").trim());
      return { name, price: Number(price || 0) };
    })
    .filter((item) => item.name);

  const addFood = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.description || (!form.image && !editingId)) {
      alert("All fields are required."); return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("price", form.price);
      fd.append("description", form.description);
      fd.append("category", form.category || "Pizza");
      fd.append("veg", form.veg);
      fd.append("foodType", form.foodType);
      fd.append("mealCategory", form.mealCategory);
      fd.append("servingSize", form.foodType === "combo" ? 1 : form.servingSize);
      fd.append("packingCharge", form.packingCharge || 0);
      fd.append("variants", JSON.stringify(form.variants));
      fd.append("comboItems", JSON.stringify(form.foodType === "combo" ? parseComboItems() : []));
      fd.append("categoryImageCurrent", form.categoryImage || "");
      if (form.image) fd.append("image", form.image);
      if (form.categoryImageFile) fd.append("categoryImage", form.categoryImageFile);
      
      if (editingId) {
        await API.put(`/api/foods/${editingId}`, fd, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await API.post("/api/foods", fd, { headers: { Authorization: `Bearer ${token}` } });
      }
      
      resetForm();
      loadFoods();
    } catch (err) { console.log(err); } finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm(initialForm);
    setPreview(null);
    setCategoryPreview(null);
    setEditingId(null);
    const input = document.getElementById("foodImageInput");
    if (input) input.value = "";
    const categoryInput = document.getElementById("categoryImageInput");
    if (categoryInput) categoryInput.value = "";
  };

  const startEdit = (food) => {
    setForm({
      ...initialForm,
      name: food.name,
      price: food.price,
      description: food.description,
      category: food.category || "Fast Food",
      veg: food.veg === false ? "false" : "true",
      foodType: food.foodType || "single",
      mealCategory: food.mealCategory || "Anytime",
      servingSize: String(food.servingSize || 1),
      packingCharge: food.packingCharge ? String(food.packingCharge) : "",
      variants: Array.isArray(food.variants) && food.variants.length ? food.variants : ["Regular"],
      comboItemsText: Array.isArray(food.comboItems) ? food.comboItems.map((item) => `${item.name}|${item.price || 0}`).join("\n") : "",
      categoryImage: food.categoryImage || "",
      image: null,
      categoryImageFile: null
    });
    setPreview(food.image?.startsWith('http') ? food.image : `${import.meta.env.VITE_API_URL}/uploads/${food.image}`);
    setCategoryPreview(food.categoryImage || null);
    setEditingId(food._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteFood = async (id) => {
    try {
      const token = await getToken();
      if (!window.confirm("Are you sure you want to delete this food item?")) return;
      await API.delete(`/api/foods/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadFoods();
    } catch (err) { console.log(err); }
  };

  const toggleFeatured = async (id, currentFeatured) => {
    try {
      const token = await getToken();
      await API.put(`/api/foods/${id}`, { featured: !currentFeatured }, { headers: { Authorization: `Bearer ${token}` } });
      loadFoods();
    } catch (err) { console.log(err); }
  };

  return (
    <div className="w-full pb-10">
      
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Manage Foods</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base md:text-lg font-medium">Add new items to the menu or manage existing ones.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-5 md:p-8 mb-8 md:mb-12 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
          <h2 className="text-base md:text-xl font-bold text-slate-900 dark:text-white mb-5 md:mb-8 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
            </div>
            {editingId ? "Edit Item" : "Add New Item"}
          </h2>
          
          <form onSubmit={addFood} className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
            
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Food Name</label>
                  <Input name="name" placeholder="e.g. Spicy Chicken Burger" value={form.name} onChange={handleChange} className="bg-slate-50 dark:bg-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Price (₹)</label>
                  <Input name="price" type="number" placeholder="e.g. 249" value={form.price} onChange={handleChange} className="bg-slate-50 dark:bg-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <select 
                    name="category" 
                    value={form.category || "Veg"} 
                    onChange={handleChange} 
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none text-slate-900 dark:text-white font-medium"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option} className="bg-white dark:bg-slate-900">{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Veg / Non-Veg</label>
                  <select
                    name="veg"
                    value={form.veg}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none text-slate-900 dark:text-white font-medium"
                  >
                    <option value="true" className="bg-white dark:bg-slate-900">Veg</option>
                    <option value="false" className="bg-white dark:bg-slate-900">Non-Veg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 rounded-3xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/40 p-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Item Type</label>
                  <select
                    name="foodType"
                    value={form.foodType}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none text-slate-900 dark:text-white font-medium"
                  >
                    <option value="single" className="bg-white dark:bg-slate-900">Single Item</option>
                    <option value="combo" className="bg-white dark:bg-slate-900">Combo</option>
                  </select>
                </div>
                {form.foodType !== "combo" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Serving For</label>
                    <select
                      name="servingSize"
                      value={form.servingSize}
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none text-slate-900 dark:text-white font-medium"
                    >
                      <option value="1" className="bg-white dark:bg-slate-900">1 Person</option>
                      <option value="2" className="bg-white dark:bg-slate-900">2 Person</option>
                      <option value="3" className="bg-white dark:bg-slate-900">3 Person</option>
                      <option value="4" className="bg-white dark:bg-slate-900">4+ Person</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Meal Category</label>
                  <select
                    name="mealCategory"
                    value={form.mealCategory}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none text-slate-900 dark:text-white font-medium"
                  >
                    <option className="bg-white dark:bg-slate-900">Breakfast</option>
                    <option className="bg-white dark:bg-slate-900">Lunch</option>
                    <option className="bg-white dark:bg-slate-900">Dinner</option>
                    <option className="bg-white dark:bg-slate-900">Anytime</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Packing Charge (Rs.)</label>
                  <Input name="packingCharge" type="number" min="0" placeholder="0 for no charge" value={form.packingCharge} onChange={handleChange} className="bg-white dark:bg-slate-950" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Quantity / Variant</label>
                <div className="flex flex-wrap gap-2">
                  {variantOptions.map((variant) => (
                    <button
                      key={variant}
                      type="button"
                      onClick={() => toggleVariant(variant)}
                      className={`rounded-xl border px-3 py-2 text-xs font-black transition-all ${
                        form.variants.includes(variant)
                          ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                      }`}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              </div>

              {form.foodType === "combo" && (
                <div className="rounded-3xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-900/40 dark:bg-brand-950/20">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Combo Items</label>
                  <textarea
                    name="comboItemsText"
                    placeholder={"Chicken Roll|120\nFrench Fries|90\nCold Drink|40"}
                    value={form.comboItemsText}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-5 py-4 rounded-2xl border border-brand-100 dark:border-brand-900/50 bg-white dark:bg-slate-950 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-y text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder:text-slate-500"
                  />
                  <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Combo me person option nahi dikhega. Har line me item name aur price ko pipe se likhein.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea name="description" placeholder="A short, tasty description..." value={form.description} onChange={handleChange} rows={4}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-y text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder:text-slate-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category Image</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label className="relative flex-1 cursor-pointer">
                    <input id="categoryImageInput" name="categoryImage" type="file" onChange={handleChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="w-full px-5 py-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400 hover:border-brand-300 transition-colors">
                      <ImagePlus size={20} className="text-brand-500" />
                      <span className="font-medium">Choose category icon image</span>
                    </div>
                  </label>
                  <div className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
                    {categoryPreview ? (
                      <img src={categoryPreview} alt="Category preview" className="w-full h-full object-cover" />
                    ) : (
                      <UtensilsCrossed size={22} className="text-slate-400 dark:text-slate-600" />
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Same category ke liye ye image tab tak rahegi jab tak admin nayi image upload nahi karta.
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Upload Image</label>
                <div className="relative">
                  <input id="foodImageInput" name="image" type="file" onChange={handleChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-full px-5 py-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400 group-hover:border-brand-300 transition-colors">
                    <UploadCloud size={20} className="text-brand-500" />
                    <span className="font-medium">Choose a file or drag & drop</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-4 flex flex-col justify-between gap-6">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Image Preview</label>
                <div className="w-full h-56 rounded-[1.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden relative group p-3">
                  {preview ? (
                    <img src={preview} alt="Preview" className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl" />
                  ) : (
                    <div className="text-center text-slate-400 dark:text-slate-500 p-4 flex flex-col items-center gap-3">
                      <ImagePlus size={32} className="text-slate-300 dark:text-slate-700" />
                      <span className="text-sm font-medium">Select an image to preview</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={loading} size="lg" className="w-full rounded-2xl gap-2 shadow-brand-500/25">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                  {editingId ? "Update Item" : "Publish Item"}
                </Button>
                {editingId && (
                  <Button type="button" onClick={resetForm} variant="ghost" className="w-full rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white">
                    <X size={18} className="mr-2" /> Cancel Edit
                  </Button>
                )}
              </div>
            </div>
            
          </form>
        </Card>
      </motion.div>

      <div className="mb-6 flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Current Menu ({foods.length})</h2>
      </div>
      
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
        <AnimatePresence>
          {foods.map((f, i) => (
            <motion.div 
              key={f._id} 
              layout
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card hover className="overflow-hidden flex flex-col h-full border-slate-100 dark:border-slate-800/60 p-2 bg-white dark:bg-slate-950 group">
                
                <div className="relative h-56 overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center p-3">
                  <img src={f.image?.startsWith('http') ? f.image : `${import.meta.env.VITE_API_URL}/uploads/${f.image}`}
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl transition-transform duration-500 group-hover:scale-105" alt={f.name} />
                    
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                       onClick={() => startEdit(f)}
                       className="w-10 h-10 rounded-xl bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-all"
                       title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                       onClick={() => deleteFood(f._id)}
                       className="w-10 h-10 rounded-xl bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-center text-red-500 dark:text-red-400 shadow-sm hover:bg-red-500 hover:text-white dark:hover:bg-red-600 transition-all"
                       title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xl leading-tight group-hover:text-brand-600 transition-colors">{f.name}</h3>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 rounded-md">
                      {f.category || "Pizza"}
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-md">
                      {f.foodType === "combo" ? "Combo" : `${f.servingSize || 1} Person`}
                    </span>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md ${
                      f.veg === false
                        ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                        : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {f.veg === false ? "Non-Veg" : "Veg"}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mt-1 mb-4 flex-1 font-medium">{f.description}</p>
                  <div className="flex items-center justify-between mt-auto border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    <span className="font-black text-brand-600 text-2xl">₹{f.price}</span>
                  </div>
                </div>
                
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {foods.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/60 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <UtensilsCrossed size={32} className="text-slate-300 dark:text-slate-700" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No foods found</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Your menu is empty. Add a new item above.</p>
          </div>
        )}
      </motion.div>

    </div>
  );
}

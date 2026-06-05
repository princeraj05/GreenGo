import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Star, ImagePlus, UploadCloud, X, UtensilsCrossed } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";

export default function ManageFoods() {
  const [foods, setFoods] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", description: "", category: "Veg", image: null });
  const [preview, setPreview] = useState(null);
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
    } else {
      setForm({ ...form, [name]: value });
    }
  };

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
      fd.append("category", form.category || "Veg");
      if (form.image) fd.append("image", form.image);
      
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
    setForm({ name: "", price: "", description: "", category: "Veg", image: null });
    setPreview(null);
    setEditingId(null);
    const input = document.getElementById("foodImageInput");
    if (input) input.value = "";
  };

  const startEdit = (food) => {
    setForm({ name: food.name, price: food.price, description: food.description, category: food.category || "Veg", image: null });
    setPreview(food.image?.startsWith('http') ? food.image : `${import.meta.env.VITE_API_URL}/uploads/${food.image}`);
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
      
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manage Foods</h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">Add new items to the menu or manage existing ones.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-8 mb-12 border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
            </div>
            {editingId ? "Edit Item" : "Add New Item"}
          </h2>
          
          <form onSubmit={addFood} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Food Name</label>
                  <Input name="name" placeholder="e.g. Spicy Chicken Burger" value={form.name} onChange={handleChange} className="bg-slate-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price (₹)</label>
                  <Input name="price" type="number" placeholder="e.g. 249" value={form.price} onChange={handleChange} className="bg-slate-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                  <select 
                    name="category" 
                    value={form.category || "Veg"} 
                    onChange={handleChange} 
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none text-slate-900 font-medium"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Sweet">Sweet</option>
                    <option value="Water">Water</option>
                    <option value="Cold Drink">Cold Drink</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                <textarea name="description" placeholder="A short, tasty description..." value={form.description} onChange={handleChange} rows={4}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-y text-slate-900 font-medium placeholder-slate-400" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upload Image</label>
                <div className="relative">
                  <input id="foodImageInput" name="image" type="file" onChange={handleChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-full px-5 py-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center gap-3 text-slate-500 group-hover:border-brand-300 transition-colors">
                    <UploadCloud size={20} className="text-brand-500" />
                    <span className="font-medium">Choose a file or drag & drop</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-4 flex flex-col justify-between gap-6">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Image Preview</label>
                <div className="w-full h-56 rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative group">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-slate-400 p-4 flex flex-col items-center gap-3">
                      <ImagePlus size={32} className="text-slate-300" />
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
                  <Button type="button" onClick={resetForm} variant="ghost" className="w-full rounded-2xl text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                    <X size={18} className="mr-2" /> Cancel Edit
                  </Button>
                )}
              </div>
            </div>
            
          </form>
        </Card>
      </motion.div>

      <div className="mb-6 flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Current Menu ({foods.length})</h2>
      </div>
      
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
              <Card hover className="overflow-hidden flex flex-col h-full border-slate-100 p-2 group">
                
                <div className="relative h-56 overflow-hidden bg-slate-50 rounded-2xl">
                  <img src={f.image?.startsWith('http') ? f.image : `${import.meta.env.VITE_API_URL}/uploads/${f.image}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={f.name} />
                    
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                       onClick={() => toggleFeatured(f._id, f.featured)}
                       className={`w-10 h-10 rounded-xl backdrop-blur-md flex items-center justify-center shadow-sm transition-all ${f.featured ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-white/90 text-slate-400 hover:text-amber-500'}`}
                       title={f.featured ? "Remove from Featured" : "Mark as Featured"}
                    >
                      <Star size={18} fill={f.featured ? "currentColor" : "none"} />
                    </button>
                    <button 
                       onClick={() => startEdit(f)}
                       className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-blue-600 shadow-sm hover:bg-blue-500 hover:text-white transition-all"
                       title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                       onClick={() => deleteFood(f._id)}
                       className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-all"
                       title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-bold text-slate-900 text-xl leading-tight group-hover:text-brand-600 transition-colors">{f.name}</h3>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-brand-50 text-brand-600 rounded-md">
                      {f.category || "Veg"}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-2 mt-1 mb-4 flex-1 font-medium">{f.description}</p>
                  <div className="flex items-center justify-between mt-auto border-t border-slate-100 pt-4">
                    <span className="font-black text-brand-600 text-2xl">₹{f.price}</span>
                  </div>
                </div>
                
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {foods.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <UtensilsCrossed size={32} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No foods found</h3>
            <p className="text-slate-500 font-medium">Your menu is empty. Add a new item above.</p>
          </div>
        )}
      </motion.div>

    </div>
  );
}
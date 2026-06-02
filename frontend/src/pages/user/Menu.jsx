import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, UtensilsCrossed } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";

const API = getApiUrl();

export default function Menu() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      const res = await fetch(`${API}/api/foods`);
      if(res.ok) {
        const data = await res.json();
        setFoods(data);
      }
    } catch (err) {
      console.error("Failed to load foods", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase()) || (food.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || (food.category && food.category.toLowerCase() === category.toLowerCase()) || (food.description || "").toLowerCase().includes(category.toLowerCase()) || food.name.toLowerCase().includes(category.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const addToCart = (food) => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find(i => i._id === food._id);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        _id: food._id,
        name: food.name,
        price: food.price,
        image: food.image,
        qty: 1
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    // Provide a tiny vibration/feedback or visual cue (could add toast later)
    navigate("/user/checkout");
  };

  const categories = ["All", "Veg", "Non-Veg", "Spicy", "Sweet", "Beverages"];

  return (
    <div className="max-w-7xl mx-auto w-full pb-10">
      
      {/* HEADER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-50 rounded-full blur-[80px] -z-10 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-blue-50 rounded-full blur-[60px] -z-10 translate-y-1/3" />
        
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Our Menu
          </h1>
          <p className="text-slate-500 mt-3 text-lg font-medium">Discover delicious meals tailored for you.</p>
        </div>
        
        <div className="relative w-full md:w-[400px]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <Input
            type="text"
            placeholder="Search for your cravings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-white/60 backdrop-blur-sm border-slate-200 shadow-sm rounded-2xl py-3.5"
          />
        </div>
      </motion.div>

      {/* CATEGORY FILTERS */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 mb-10"
      >
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
              category === cat 
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-105" 
              : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          <AnimatePresence>
            {filteredFoods.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-brand-500">
                  <UtensilsCrossed size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">No food found</h3>
                <p className="text-slate-500 max-w-sm mb-8 font-medium">Try adjusting your search criteria or category filter to find what you're looking for.</p>
                <Button onClick={() => {setSearch(""); setCategory("All");}} variant="secondary" className="rounded-full">
                  Clear Filters
                </Button>
              </motion.div>
            ) : (
              filteredFoods.map((food, i) => (
                <motion.div 
                  key={food._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card hover className="h-full flex flex-col overflow-hidden group border-slate-100">
                    <div className="relative h-56 overflow-hidden bg-slate-50 p-2">
                      <img
                        src={getImageUrl(food.image)}
                        alt={food.name}
                        className="w-full h-full object-cover rounded-[1.25rem] transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Food'; }}
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-black text-slate-900 shadow-sm">
                        ₹{food.price}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-brand-600 transition-colors">{food.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 flex-1 mb-6 font-medium leading-relaxed">{food.description}</p>
                      
                      <Button onClick={() => addToCart(food)} className="w-full gap-2 group-hover:shadow-brand-500/30">
                        <ShoppingCart size={18} />
                        Add to Cart
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
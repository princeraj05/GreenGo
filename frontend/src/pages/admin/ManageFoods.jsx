import { useEffect, useState } from "react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";

export default function ManageFoods() {
  const [foods, setFoods] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", description: "", image: null });
  const [preview, setPreview] = useState(null); // Image preview state

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
      // Create a local URL for the image preview
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
    if (!form.name || !form.price || !form.description || !form.image) {
      alert("All fields are required."); return;
    }
    try {
      const token = await getToken();
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("price", form.price);
      fd.append("description", form.description);
      fd.append("image", form.image);
      
      await API.post("/api/foods", fd, { headers: { Authorization: `Bearer ${token}` } });
      
      // Reset form and preview
      setForm({ name: "", price: "", description: "", image: null });
      setPreview(null);
      document.getElementById("foodImageInput").value = ""; // Clear file input
      
      loadFoods();
    } catch (err) { console.log(err); }
  };

  const deleteFood = async (id) => {
    try {
      const token = await getToken();
      if (!window.confirm("Are you sure you want to delete this food item?")) return;
      await API.delete(`/api/foods/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadFoods();
    } catch (err) { console.log(err); }
  };

  return (
    <div className="w-full h-full animate-fade-in pb-10">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manage Foods</h1>
        <p className="text-slate-500 mt-1">Add new items to the menu or manage existing ones.</p>
      </div>

      {/* Add Food Form */}
      <div className="bg-white rounded-3xl p-8 mb-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Item
        </h2>
        
        <form onSubmit={addFood} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Fields */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Food Name</label>
                <input name="name" placeholder="e.g. Spicy Chicken Burger" value={form.name} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Price (₹)</label>
                <input name="price" type="number" placeholder="e.g. 249" value={form.price} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-medium" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea name="description" placeholder="A short, tasty description..." value={form.description} onChange={handleChange} rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-medium resize-none" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Upload Image</label>
              <input id="foodImageInput" name="image" type="file" onChange={handleChange} accept="image/*"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-600 hover:file:bg-emerald-100 transition-all cursor-pointer" />
            </div>
          </div>
          
          {/* Image Preview & Submit */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-6">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-2">Image Preview</label>
              <div className="w-full h-48 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative group">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400 p-4">
                    <svg className="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">Select an image to preview</span>
                  </div>
                )}
              </div>
            </div>
            
            <button type="submit"
              className="w-full py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 transition-all active:scale-95 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              Publish Item
            </button>
          </div>
          
        </form>
      </div>

      {/* Food Grid (Exposed Options) */}
      <div className="mb-6">
         <h2 className="text-xl font-bold text-slate-900">Current Menu ({foods.length})</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {foods.map(f => (
          <div key={f._id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 flex flex-col">
            
            <div className="relative h-48 overflow-hidden bg-slate-100">
              <img src={`${import.meta.env.VITE_API_URL}/uploads/${f.image}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={f.name} />
                
              {/* Exposed Options Floating on the Image */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button 
                   className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-blue-600 shadow-lg hover:bg-blue-50 transition-colors"
                   title="Edit (Coming soon)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button 
                   onClick={() => deleteFood(f._id)}
                   className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-red-600 shadow-lg hover:bg-red-50 transition-colors"
                   title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-bold text-slate-900 text-lg leading-tight">{f.name}</h3>
                <span className="font-black text-emerald-600 text-lg bg-emerald-50 px-2 py-0.5 rounded-lg">₹{f.price}</span>
              </div>
              <p className="text-slate-500 text-sm line-clamp-2 mt-1">{f.description}</p>
            </div>
            
          </div>
        ))}
        
        {foods.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">No foods found</h3>
            <p className="text-slate-500 text-sm mt-1">Your menu is empty. Add a new item above.</p>
          </div>
        )}
      </div>

    </div>
  );
}
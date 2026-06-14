import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, UploadCloud, X, LayoutGrid, Image } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ImageCropModal from "../../components/ui/ImageCropModal";

const MotionDiv = motion.div;
const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none text-slate-900 dark:text-white font-medium text-sm transition-all placeholder:text-slate-400";

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  
  // Cropper State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawFile, setRawFile] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await API.get("/api/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRawFile(file);
    setCropperOpen(true);
  };

  const handleCroppedSave = (croppedFile, previewUrl) => {
    setImageFile(croppedFile);
    setPreview(previewUrl);
    setCropperOpen(false);
    setRawFile(null);
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setRawFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Category name is required.");
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      const fd = new FormData();
      fd.append("name", name.trim());
      if (imageFile) {
        fd.append("image", imageFile);
      }

      const headers = { Authorization: `Bearer ${token}` };
      if (editingId) {
        await API.put(`/api/categories/${editingId}`, fd, { headers });
      } else {
        await API.post("/api/categories", fd, { headers });
      }
      resetForm();
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cat) => {
    setName(cat.name);
    setEditingId(cat._id);
    setImageFile(null);
    setPreview(cat.image?.startsWith("http") ? cat.image : `${import.meta.env.VITE_API_URL}/uploads/${cat.image}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const token = await getToken();
      await API.delete(`/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const resetForm = () => {
    setName("");
    setImageFile(null);
    setPreview("");
    setEditingId(null);
    const inp = document.getElementById("categoryImageInput");
    if (inp) inp.value = "";
  };

  return (
    <div className="w-full pt-6 md:pt-0 pb-16">
      
      {/* Header Section */}
      <MotionDiv initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {editingId ? "Edit Category" : "Add Category"}
          </h1>
          <nav className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-400">
            <span>Dashboard</span><span>/</span><span>Menu</span><span>/</span>
            <span className="text-emerald-600">{editingId ? "Edit Category" : "Add Category"}</span>
          </nav>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={resetForm} variant="ghost" className="rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={loading} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2 min-w-[140px]">
            {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
            {editingId ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      </MotionDiv>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        
        {/* Left Column: Form Info */}
        <div className="space-y-6">
          <form id="category-form" onSubmit={handleSubmit}>
            <Card className="p-6 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <h2 className="text-sm font-black text-slate-900 dark:text-white mb-4">Category Specifications</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Pizza, Burger, Noodles"
                    className={inputCls}
                  />
                </div>
              </div>
            </Card>
          </form>

          {/* List of categories */}
          <Card className="p-6 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
            <h2 className="text-sm font-black text-slate-900 dark:text-white mb-4">Existing Categories ({categories.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <AnimatePresence>
                {categories.map((cat, i) => (
                  <MotionDiv
                    key={cat._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.02 }}
                    className="group border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-2xl flex flex-col items-center justify-between text-center relative overflow-hidden"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 flex items-center justify-center p-1.5 mb-2.5">
                      {cat.image ? (
                        <img
                          src={cat.image?.startsWith("http") ? cat.image : `${import.meta.env.VITE_API_URL}/uploads/${cat.image}`}
                          alt={cat.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <LayoutGrid size={24} className="text-slate-300 dark:text-slate-700" />
                      )}
                    </div>
                    <div className="font-black text-xs text-slate-800 dark:text-slate-200 line-clamp-1 mb-2">{cat.name}</div>
                    
                    {/* Action Overlay */}
                    <div className="flex gap-1.5 mt-1.5">
                      <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => deleteCategory(cat._id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </MotionDiv>
                ))}
              </AnimatePresence>

              {categories.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-400 text-sm font-semibold">
                  No categories found.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Image Selection Card */}
        <div>
          <Card className="p-6 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 sticky top-20">
            <h2 className="text-sm font-black text-slate-900 dark:text-white mb-1">
              Category Image
              <span className="font-semibold text-slate-400 ml-1 text-xs">(1:1 Ratio)</span>
            </h2>
            <div className="border-b border-slate-100 dark:border-slate-800 mb-4" />

            <div className="relative mb-5">
              <input
                id="categoryImageInput"
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
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
                      <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">Upload Photo</div>
                      <div className="text-[10px] text-slate-400 mt-1">Recommended size 400x400px</div>
                    </div>
                  </>
                )}
              </div>
              {preview && (
                <button
                  type="button"
                  onClick={() => { setPreview(""); setImageFile(null); const inp = document.getElementById("categoryImageInput"); if (inp) inp.value = ""; }}
                  className="absolute top-2 right-2 z-20 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Button type="button" onClick={resetForm} variant="ghost" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                Cancel
              </Button>
              <Button type="submit" form="category-form" disabled={loading} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                {editingId ? "Save Category" : "Save Category"}
              </Button>
            </div>
          </Card>
        </div>

      </div>

      {/* Interactive Crop & Rotate Modal */}
      <ImageCropModal
        isOpen={cropperOpen}
        imageFile={rawFile}
        onCancel={handleCropCancel}
        onSave={handleCroppedSave}
      />

    </div>
  );
}

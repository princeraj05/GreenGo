import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";
import { getImageUrl } from "../../utils/getApiUrl";
import Button from "../../components/ui/Button";

/**
 * ManageBanners Component
 * Interface allowing administrators to upload, customize, prioritize,
 * and toggle promotional sliding image banners on the store homepage.
 */
export default function ManageBanners() {
  
  // ==========================================
  // STATE DECLARATIONS
  // ==========================================

  // Array of promotional banner records fetched from the database
  const [banners, setBanners] = useState([]);

  // Loading indicator for async operations
  const [loading, setLoading] = useState(true);

  // Form input field configurations for creating or updating a banner
  const [form, setForm] = useState({
    title: "Banner",
    description: "",
    discountText: "",
    buttonText: "",
    displayOrder: 0,
    active: true
  });

  // Local state container for files selected via standard file inputs
  const [imageFile, setImageFile] = useState(null);

  // Stores the target banner ID being actively edited
  const [editingId, setEditingId] = useState(null);

  // ==========================================
  // DATA FETCHING & EVENT HANDLERS
  // ==========================================

  // Load all banners on initial component rendering
  useEffect(() => {
    loadBanners();
  }, []);

  /**
   * Fetches all banners (both active and inactive status) for admin management views.
   */
  const loadBanners = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/banners/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load banners:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles submission of the create/edit banner form.
   * Utilizes FormData API to handle binary image file uploads.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("discountText", form.discountText);
      formData.append("buttonText", form.buttonText);
      formData.append("displayOrder", form.displayOrder);
      formData.append("active", form.active);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      let url = `${import.meta.env.VITE_API_URL}/api/banners/admin`;
      let method = "POST";

      if (editingId) {
        url = `${import.meta.env.VITE_API_URL}/api/banners/admin/${editingId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        loadBanners();
        resetForm();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to save banner");
      }
    } catch (err) {
      console.error("Error saving banner:", err);
    }
  };

  /**
   * Loads banner details into the form state for editing.
   */
  const handleEdit = (banner) => {
    setEditingId(banner._id);
    setForm({
      title: banner.title,
      description: banner.description || "",
      discountText: banner.discountText || "",
      buttonText: banner.buttonText || "ORDER NOW",
      displayOrder: banner.displayOrder || 0,
      active: banner.active
    });
    setImageFile(null);
  };

  /**
   * Requests deletion of a specific banner.
   */
  const handleDelete = async (id) => {
    if (!confirm("Delete this banner?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/banners/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadBanners();
      }
    } catch (err) {
      console.error("Error deleting banner:", err);
    }
  };

  /**
   * Resets all form fields and editing configurations.
   */
  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "Banner",
      description: "",
      discountText: "",
      buttonText: "",
      displayOrder: 0,
      active: true
    });
    setImageFile(null);
  };

  return (
    // Outer wrap containing entry anim parameters
    <div className="animate-fade-in pt-6 md:pt-0">
      
      {/* --- HEADER SECTION --- */}
      <div className="mb-8 animate-slide-in">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Manage Banners</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Add, edit, or delete sliding offer banners for GoGreen Home Page.</p>
      </div>
      {/* --- END HEADER SECTION --- */}

      {/* --- SPLIT GRID PANELS --- */}
      {/* Uses 1 column on smaller viewport screens and 3 columns on desktop 'lg' screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- FORM PANEL SECTION --- */}
        {/* Col span 1 handles form dimensions */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-fit transition-colors">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            {editingId ? "Edit Banner" : "New Banner"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Banner Image</label>
              <input
                type="file"
                accept="image/*"
                required={!editingId}
                onChange={(e) => setImageFile(e.target.files[0])}
                className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 dark:file:bg-brand-950/40 dark:file:text-brand-400 hover:file:bg-brand-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Display Order</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                <select
                  value={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <Button type="submit" className="flex-1 py-3 text-sm">
                {editingId ? "Save Changes" : "Create Banner"}
              </Button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        {/* --- END FORM PANEL SECTION --- */}

        {/* --- BANNERS CARD LIST PANEL --- */}
        {/* Col span 2 displays banners list layout */}
        <div className="lg:col-span-2">
          {loading ? (
            <p className="text-slate-500 dark:text-slate-400">Loading banners...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((banner) => (
                <div key={banner._id} className={`p-4 rounded-3xl border-2 transition-all flex flex-col justify-between ${banner.active ? 'border-brand-100 dark:border-brand-900/50 bg-brand-50/10 dark:bg-brand-950/10' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20'}`}>
                  <div>
                    {/* Banner Card Header Details */}
                    <div className="relative h-32 rounded-2xl overflow-hidden mb-3 bg-slate-950/20">
                      <img
                        src={getImageUrl(banner.image)}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 text-xs px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white font-extrabold">
                        Order: {banner.displayOrder}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${banner.active ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {banner.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Banner Card Footer controls */}
                  <div className="flex justify-end items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-100 dark:border-slate-800 shadow-sm"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(banner._id)}
                        className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg transition-colors border border-red-100 dark:border-red-950/20 shadow-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* --- END BANNERS CARD LIST PANEL --- */}

      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";
import { getImageUrl } from "../../utils/getApiUrl";
import Button from "../../components/ui/Button";

export default function ManageBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    discountText: "",
    buttonText: "ORDER NOW",
    displayOrder: 0,
    active: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadBanners();
  }, []);

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

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      discountText: "",
      buttonText: "ORDER NOW",
      displayOrder: 0,
      active: true
    });
    setImageFile(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8 animate-slide-in">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Manage Banners</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Add, edit, or delete sliding offer banners for GoGreen Home Page.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create/Edit Form */}
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

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Banner Title</label>
              <input
                type="text"
                placeholder="e.g. 50% OFF First Order"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
              <input
                type="text"
                placeholder="e.g. On your first purchase of the month"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Discount Text</label>
                <input
                  type="text"
                  placeholder="e.g. UPTO 60% OFF"
                  value={form.discountText}
                  onChange={(e) => setForm({ ...form, discountText: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Button Text</label>
                <input
                  type="text"
                  placeholder="e.g. ORDER NOW"
                  value={form.buttonText}
                  onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                />
              </div>
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

        {/* Banners List */}
        <div className="lg:col-span-2">
          {loading ? (
            <p className="text-slate-500 dark:text-slate-400">Loading banners...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((banner) => (
                <div key={banner._id} className={`p-4 rounded-3xl border-2 transition-all flex flex-col justify-between ${banner.active ? 'border-brand-100 dark:border-brand-900/50 bg-brand-50/10 dark:bg-brand-950/10' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20'}`}>
                  <div>
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

                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-base">{banner.title}</h3>
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${banner.active ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400' : 'bg-slate-250 text-slate-550 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {banner.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-3">{banner.description}</p>
                    {banner.discountText && (
                      <span className="inline-block text-xs font-black text-brand-500 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-md mb-4 border border-brand-100/50 dark:border-brand-900/40">
                        {banner.discountText}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-400">Btn: "{banner.buttonText}"</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-lg transition-colors border border-slate-100 dark:border-slate-800 shadow-sm"
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
      </div>
    </div>
  );
}

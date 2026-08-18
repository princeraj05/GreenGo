import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";
import { getApiUrl } from "../../utils/getApiUrl";

/**
 * ManageCoupons Component
 * Offers administrative inputs to configure discount codes,
 * set minimum purchase orders, handle dates constraints,
 * and view/delete coupon codes.
 */
export default function ManageCoupons() {
  
  // ==========================================
  // STATE DECLARATIONS
  // ==========================================

  // Array storing coupons fetched from endpoints
  const [coupons, setCoupons] = useState([]);

  // Loading indicator for fetching configurations
  const [loading, setLoading] = useState(true);

  // Form input configurations initialized with default values
  const [form, setForm] = useState({ 
    title: "", 
    code: "", 
    discountType: "percentage", 
    discountValue: 0, 
    minimumOrder: 0, 
    expiryDate: "" 
  });

  // ==========================================
  // DATA FETCHING & EVENT HANDLERS
  // ==========================================

  // Load all coupons on rendering
  useEffect(() => {
    loadCoupons();
  }, []);

  /**
   * Loads all discount coupons from the backend.
   */
  const loadCoupons = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${getApiUrl()}/api/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const filtered = data.filter(c => !(c.title && c.title.toLowerCase().includes("referral")));
        setCoupons(filtered);
      } else {
        setCoupons([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles submission of the new coupon registration form.
   */
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      await fetch(`${getApiUrl()}/api/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      loadCoupons();
      setForm({ title: "", code: "", discountType: "percentage", discountValue: 0, minimumOrder: 0, expiryDate: "" });
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Request deletion of a specific coupon item.
   */
  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const token = await getToken();
      await fetch(`${getApiUrl()}/api/coupons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Toggles the active status of a coupon.
   */
  const toggleActive = async (coupon) => {
    try {
      const token = await getToken();
      await fetch(`${getApiUrl()}/api/coupons/${coupon._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ active: !coupon.active })
      });
      loadCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    // Outer wrap container with fade-in animation
    <div className="animate-fade-in pt-6 md:pt-0">
      
      {/* --- HEADER SECTION --- */}
      <div className="mb-8 animate-slide-in">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Manage Coupons</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Create and manage discount codes.</p>
      </div>
      {/* --- END HEADER SECTION --- */}

      {/* --- SPLIT GRID PANELS --- */}
      {/* Uses 1 column on smaller viewport screens and 3 columns on desktop 'lg' screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- FORM PANEL SECTION --- */}
        {/* Col span 1 handles creation form layout dimensions */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-fit transition-colors">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">New Coupon</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <input 
              className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
              placeholder="Coupon Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} 
            />
            <input 
              className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 uppercase text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
              placeholder="CODE (e.g. SAVE20)" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} 
            />
            
            <div className="grid grid-cols-2 gap-4">
              <select 
                className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white" 
                value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
              <input 
                type="number" 
                className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                placeholder="Value" required value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} 
              />
            </div>

            <input 
              type="number" 
              className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
              placeholder="Min Order Amount (₹)" required value={form.minimumOrder} onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })} 
            />
            <input 
              type="date" 
              className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
              required value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} 
            />

            <button type="submit" className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold mt-2 hover:bg-emerald-600 dark:hover:bg-emerald-600 transition-colors">Create Coupon</button>
          </form>
        </div>
        {/* --- END FORM PANEL SECTION --- */}

        {/* --- COUPON CARD LIST PANEL --- */}
        {/* Col span 2 displays lists dynamically in a responsive grid layout */}
        <div className="lg:col-span-2">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map((coupon) => (
                <div key={coupon._id} className={`p-5 rounded-2xl border-2 border-dashed transition-all ${coupon.active ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40'} relative`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-xl tracking-wider text-slate-800 dark:text-white">{coupon.code}</span>
                    <button onClick={() => toggleActive(coupon)} className={`text-xs px-2 py-1 rounded-md font-bold transition-colors ${coupon.active ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-450' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      {coupon.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm font-medium mb-4">{coupon.title}</p>
                  
                  <div className="flex justify-between items-end">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <p>Discount: <span className="font-bold text-slate-800 dark:text-slate-200">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</span></p>
                      <p>Min Order: ₹{coupon.minimumOrder}</p>
                      <p>Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleDelete(coupon._id)} className="w-8 h-8 flex items-center justify-center bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* --- END COUPON CARD LIST PANEL --- */}

      </div>
    </div>
  );
}

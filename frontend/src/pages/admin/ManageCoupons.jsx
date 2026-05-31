import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";

export default function ManageCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", code: "", discountType: "percentage", discountValue: 0, minimumOrder: 0, expiryDate: "" });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      await fetch(`${import.meta.env.VITE_API_URL}/api/coupons`, {
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

  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const token = await getToken();
      await fetch(`${import.meta.env.VITE_API_URL}/api/coupons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (coupon) => {
    try {
      const token = await getToken();
      await fetch(`${import.meta.env.VITE_API_URL}/api/coupons/${coupon._id}`, {
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
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manage Coupons</h1>
        <p className="text-slate-500 mt-1">Create and manage discount codes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
          <h2 className="text-xl font-bold mb-4">New Coupon</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <input className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" placeholder="Coupon Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 uppercase" placeholder="CODE (e.g. SAVE20)" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            
            <div className="flex gap-4">
              <select className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
              <input type="number" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Value" required value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
            </div>

            <input type="number" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Min Order Amount (₹)" required value={form.minimumOrder} onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })} />
            <input type="date" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" required value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />

            <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold mt-2 hover:bg-emerald-600 transition-colors">Create Coupon</button>
          </form>
        </div>

        {/* Coupon List */}
        <div className="lg:col-span-2">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map((coupon) => (
                <div key={coupon._id} className={`p-5 rounded-2xl border-2 border-dashed ${coupon.active ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'} relative`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-xl tracking-wider text-slate-800">{coupon.code}</span>
                    <button onClick={() => toggleActive(coupon)} className={`text-xs px-2 py-1 rounded-md font-bold ${coupon.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      {coupon.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <p className="text-slate-600 text-sm font-medium mb-4">{coupon.title}</p>
                  
                  <div className="flex justify-between items-end">
                    <div className="text-xs text-slate-500 font-medium">
                      <p>Discount: <span className="font-bold text-slate-800">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</span></p>
                      <p>Min Order: ₹{coupon.minimumOrder}</p>
                      <p>Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleDelete(coupon._id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
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

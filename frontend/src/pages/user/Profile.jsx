import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";

export default function Profile() {
  const [form, setForm] = useState({
    name: "", phone: "", address: "", foodPreference: "", deliveryTime: "", notifications: ""
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setForm({
          name: data.name || "", phone: data.phone || "", address: data.address || "",
          foodPreference: data.foodPreference || "", deliveryTime: data.deliveryTime || "", notifications: data.notifications || ""
        });
      } catch {
        setMessage("Failed to load profile"); setMsgType("error");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) { setMessage("Profile updated successfully"); setMsgType("success"); } 
      else { setMessage("Failed to update profile"); setMsgType("error"); }
    } catch {
      setMessage("Failed to update profile"); setMsgType("error");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div></div>;

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in pb-10">
      
      {/* Header with Dynamic Avatar */}
      <div className="bg-white rounded-3xl p-8 mb-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 shadow-lg shadow-orange-500/30 flex items-center justify-center text-4xl text-white font-black border-4 border-white">
          {form.name ? form.name.charAt(0).toUpperCase() : "🍔"}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{form.name || "Food Lover"}</h1>
          <p className="text-slate-500 mt-1 text-lg">Manage your personal information and preferences.</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-sm font-bold ${msgType === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <span className="text-xl">{msgType === 'success' ? '✅' : '❌'}</span>
          {message}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><span className="text-xl">📝</span> Personal Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Input label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" />
          <Input label="Mobile Number" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 890" />
          <Input label="Food Preference" name="foodPreference" value={form.foodPreference} onChange={handleChange} placeholder="Veg, Non-Veg, Vegan..." />
          <Input label="Preferred Delivery Time" name="deliveryTime" value={form.deliveryTime} onChange={handleChange} placeholder="e.g. 7:00 PM" />
        </div>

        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-t border-slate-100 pt-8"><span className="text-xl">📍</span> Delivery Information</h3>
        <div className="space-y-6">
          <Input label="Delivery Address" name="address" value={form.address} onChange={handleChange} textarea placeholder="Enter your full street address..." />
          <Input label="Notification Preferences" name="notifications" value={form.notifications} onChange={handleChange} placeholder="Email, SMS, Push..." />
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-95 text-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

const Input = ({ label, textarea, ...props }) => (
  <div className="flex flex-col w-full relative">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{label}</label>
    {textarea ? (
      <textarea
        {...props}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-y min-h-[120px] font-medium text-slate-700"
      />
    ) : (
      <input
        {...props}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none font-medium text-slate-700"
      />
    )}
  </div>
);
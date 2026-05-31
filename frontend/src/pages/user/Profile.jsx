import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Save, MapPin, Bell, CheckCircle, XCircle, Settings, Phone, Clock, Utensils } from "lucide-react";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

export default function Profile() {
  const [form, setForm] = useState({
    name: "", phone: "", address: "", foodPreference: "", deliveryTime: "", notifications: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        if(res.ok) {
          const data = await res.json();
          setForm({
            name: data.name || "", phone: data.phone || "", address: data.address || "",
            foodPreference: data.foodPreference || "", deliveryTime: data.deliveryTime || "", notifications: data.notifications || ""
          });
        }
      } catch {
        setMessage("Failed to load profile"); setMsgType("error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
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
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full pb-10">
      
      {/* Header with Dynamic Avatar */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-8 mb-8 flex flex-col md:flex-row items-center gap-8 border-slate-100 bg-white">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 shadow-xl shadow-brand-500/30 flex items-center justify-center text-5xl text-white font-black border-4 border-white z-10 relative">
              {form.name ? form.name.charAt(0).toUpperCase() : <User size={48} />}
            </div>
            <div className="absolute inset-0 bg-brand-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{form.name || "Food Lover"}</h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">Manage your personal information and preferences.</p>
          </div>
        </Card>
      </motion.div>

      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`mb-6 p-4 rounded-2xl flex items-center gap-3 shadow-sm font-bold ${msgType === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {msgType === 'success' ? <CheckCircle className="text-emerald-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
          {message}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6 md:p-10 border-slate-100">
          
          <div className="mb-10">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-3 text-xl pb-4 border-b border-slate-100">
              <User size={24} className="text-brand-500" /> Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 block">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
                  <Input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className="pl-12" />
                </div>
              </div>
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 block">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Phone size={18} /></div>
                  <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 890" className="pl-12" />
                </div>
              </div>
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 block">Food Preference</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Utensils size={18} /></div>
                  <Input name="foodPreference" value={form.foodPreference} onChange={handleChange} placeholder="Veg, Non-Veg, Vegan..." className="pl-12" />
                </div>
              </div>
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 block">Delivery Time</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Clock size={18} /></div>
                  <Input name="deliveryTime" value={form.deliveryTime} onChange={handleChange} placeholder="e.g. 7:00 PM" className="pl-12" />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-3 text-xl pb-4 border-b border-slate-100">
              <MapPin size={24} className="text-brand-500" /> Delivery Information
            </h3>
            <div className="space-y-6">
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 block">Delivery Address</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter your full street address..."
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-y min-h-[120px] text-slate-900 font-medium placeholder-slate-400 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-3 text-xl pb-4 border-b border-slate-100">
              <Settings size={24} className="text-brand-500" /> Preferences
            </h3>
            <div className="space-y-6">
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 block">Notifications</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Bell size={18} /></div>
                  <Input name="notifications" value={form.notifications} onChange={handleChange} placeholder="Email, SMS, Push..." className="pl-12" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end pt-6 border-t border-slate-100">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="px-10 py-4 text-lg rounded-full shadow-brand-500/25"
            >
              {saving ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
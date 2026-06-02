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

  const getAddressType = (addr) => {
    const a = String(addr || "");
    if (a.startsWith("Home: ")) return "home";
    if (a.startsWith("Office: ")) return "office";
    return "custom";
  };

  const getCleanAddressText = (addr) => {
    const a = String(addr || "");
    if (a.startsWith("Home: ")) return a.substring(6);
    if (a.startsWith("Office: ")) return a.substring(8);
    return a;
  };

  const handleAddressTypeChange = (type) => {
    const cleanText = getCleanAddressText(form.address);
    if (type === "home") {
      setForm({ ...form, address: `Home: ${cleanText}` });
    } else if (type === "office") {
      setForm({ ...form, address: `Office: ${cleanText}` });
    } else {
      setForm({ ...form, address: cleanText });
    }
  };

  const handleAddressTextChange = (e) => {
    const type = getAddressType(form.address);
    const text = e.target.value;
    if (type === "home") {
      setForm({ ...form, address: `Home: ${text}` });
    } else if (type === "office") {
      setForm({ ...form, address: `Office: ${text}` });
    } else {
      setForm({ ...form, address: text });
    }
  };

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
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Utensils size={18} /></div>
                  <Input name="foodPreference" value={form.foodPreference} onChange={handleChange} placeholder="Veg, Non-Veg, Vegan..." className="pl-12" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "🟢 Veg", value: "Veg" },
                    { label: "🔴 Non-Veg", value: "Non-Veg" },
                    { label: "🍰 Sweets", value: "Sweets" },
                    { label: "🌶️ Spicy", value: "Spicy" },
                    { label: "🥗 Vegan", value: "Vegan" }
                  ].map((p) => {
                    const currentPrefs = form.foodPreference
                      ? form.foodPreference.split(",").map(item => item.trim().toLowerCase())
                      : [];
                    const active = currentPrefs.includes(p.value.toLowerCase());
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => {
                          const list = form.foodPreference
                            ? form.foodPreference.split(",").map(item => item.trim()).filter(Boolean)
                            : [];
                          let newList;
                          if (list.some(item => item.toLowerCase() === p.value.toLowerCase())) {
                            newList = list.filter(item => item.toLowerCase() !== p.value.toLowerCase());
                          } else {
                            newList = [...list, p.value];
                          }
                          setForm({ ...form, foodPreference: newList.join(", ") });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          active
                            ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 block">Delivery Time</label>
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Clock size={18} /></div>
                  <Input name="deliveryTime" value={form.deliveryTime} onChange={handleChange} placeholder="e.g. 7:00 PM" className="pl-12" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: "ASAP", value: "ASAP" },
                    { label: "1:00 PM", value: "1:00 PM" },
                    { label: "8:00 PM", value: "8:00 PM" }
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, deliveryTime: t.value })}
                      className="px-3 py-1.5 rounded-full text-xs font-bold border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 transition-all"
                    >
                      🕒 {t.label}
                    </button>
                  ))}
                  
                  <div className="relative flex items-center border border-slate-200 rounded-full px-3 py-1.5 bg-slate-50 hover:bg-slate-100 transition-all">
                    <span className="text-xs font-bold text-slate-500 mr-2">Custom:</span>
                    <input
                      type="time"
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const [h, m] = e.target.value.split(":");
                        const hours = parseInt(h);
                        const ampm = hours >= 12 ? "PM" : "AM";
                        const formattedHours = hours % 12 || 12;
                        setForm({ ...form, deliveryTime: `${formattedHours}:${m} ${ampm}` });
                      }}
                      className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    />
                  </div>
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1 block">Address Type</label>
                <div className="flex flex-wrap gap-3 mb-4">
                  {[
                    { id: "home", label: "Home", icon: "🏠" },
                    { id: "office", label: "Office", icon: "🏢" },
                    { id: "custom", label: "Own Address", icon: "📍" }
                  ].map((t) => {
                    const active = getAddressType(form.address) === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleAddressTypeChange(t.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${
                          active
                            ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
                
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 block">Delivery Address Details</label>
                <textarea
                  name="address"
                  value={getCleanAddressText(form.address)}
                  onChange={handleAddressTextChange}
                  placeholder={
                    getAddressType(form.address) === "home"
                      ? "Enter your Home address details..."
                      : getAddressType(form.address) === "office"
                      ? "Enter your Office address details..."
                      : "Enter your custom / own street address..."
                  }
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-y min-h-[120px] text-slate-900 font-medium placeholder-slate-400 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-3 text-xl pb-4 border-b border-slate-100">
              <Settings size={24} className="text-brand-500" /> Preferences
            </h3>
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 block">Notification Channels</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Email Notifications", value: "Email", icon: "📧" },
                  { label: "SMS Notifications", value: "SMS", icon: "💬" },
                  { label: "Push Notifications", value: "Push", icon: "📱" }
                ].map((n) => {
                  const currentChannels = form.notifications
                    ? form.notifications.split(",").map(c => c.trim().toLowerCase())
                    : [];
                  const active = currentChannels.includes(n.value.toLowerCase());
                  
                  return (
                    <button
                      key={n.value}
                      type="button"
                      onClick={() => {
                        const list = form.notifications
                          ? form.notifications.split(",").map(c => c.trim()).filter(Boolean)
                          : [];
                        let newList;
                        if (list.some(c => c.toLowerCase() === n.value.toLowerCase())) {
                          newList = list.filter(c => c.toLowerCase() !== n.value.toLowerCase());
                        } else {
                          newList = [...list, n.value];
                        }
                        setForm({ ...form, notifications: newList.join(", ") });
                      }}
                      className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all ${
                        active
                          ? "bg-brand-50/50 border-brand-500 text-brand-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-2xl mb-2">{n.icon}</span>
                      <span className="text-sm font-bold">{n.label}</span>
                      <span className="text-[11px] font-semibold mt-1 text-slate-400">
                        {active ? "Enabled" : "Disabled"}
                      </span>
                    </button>
                  );
                })}
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
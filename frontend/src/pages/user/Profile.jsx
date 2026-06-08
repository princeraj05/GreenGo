import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Save, MapPin, Bell, CheckCircle, XCircle, Settings, Phone, Clock, Utensils, Navigation, Mail, LogOut } from "lucide-react";
import { getToken } from "../../utils/getToken";
import { clearSession } from "../../utils/authStorage";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

export default function Profile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", foodPreference: "", deliveryTime: "", notifications: ""
  });
  const [originalForm, setOriginalForm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [foods, setFoods] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [showCoupons, setShowCoupons] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const [userRes, foodsRes, couponsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${import.meta.env.VITE_API_URL}/api/foods`),
          fetch(`${import.meta.env.VITE_API_URL}/api/coupons/active`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (userRes.ok) {
          const data = await userRes.json();
          const initialForm = {
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            foodPreference: data.foodPreference || "",
            deliveryTime: data.deliveryTime || "",
            notifications: data.notifications || ""
          };
          setForm(initialForm);
          setOriginalForm(initialForm);
          setFavorites(data.favorites || []);
        }

        if (foodsRes.ok) {
          const foodsData = await foodsRes.json();
          setFoods(foodsData);
        }

        if (couponsRes.ok) {
          const couponsData = await couponsRes.json();
          setCoupons(couponsData);
        }
      } catch (err) {
        console.error("Failed to load profile details:", err);
        setMessage("Failed to load profile"); setMsgType("error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await clearSession();
    navigate("/login", { replace: true });
  };

  const [locationLoading, setLocationLoading] = useState(false);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const addressText = data && data.display_name ? data.display_name : `Lat: ${latitude}, Lng: ${longitude}`;
        
        const type = getAddressType(form.address);
        if (type === "home") {
          setForm(f => ({ ...f, address: `Home: ${addressText}` }));
        } else if (type === "office") {
          setForm(f => ({ ...f, address: `Office: ${addressText}` }));
        } else {
          setForm(f => ({ ...f, address: addressText }));
        }
      } catch (err) {
        const fallbackText = `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`;
        const type = getAddressType(form.address);
        if (type === "home") {
          setForm(f => ({ ...f, address: `Home: ${fallbackText}` }));
        } else if (type === "office") {
          setForm(f => ({ ...f, address: `Office: ${fallbackText}` }));
        } else {
          setForm(f => ({ ...f, address: fallbackText }));
        }
      } finally {
        setLocationLoading(false);
      }
    }, () => {
      alert("Unable to retrieve your location. Please check your browser permissions.");
      setLocationLoading(false);
    });
  };

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
      if (res.ok) { 
        setMessage("Profile updated successfully"); 
        setMsgType("success"); 
        setOriginalForm(form);
        setIsEditing(false);
      } 
      else { setMessage("Failed to update profile"); setMsgType("error"); }
    } catch {
      setMessage("Failed to update profile"); setMsgType("error");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const favoriteFoods = foods.filter(food => favorites.includes(food._id));

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
        <Card className="p-8 mb-8 flex flex-col md:flex-row items-center gap-8 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 shadow-xl shadow-brand-500/30 flex items-center justify-center text-5xl text-white font-black border-4 border-white dark:border-slate-900 z-10 relative">
              {form.name ? form.name.charAt(0).toUpperCase() : <User size={48} />}
            </div>
            <div className="absolute inset-0 bg-brand-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{form.name || "Food Lover"}</h1>
            <p className="text-slate-505 dark:text-slate-400 mt-2 text-lg font-medium">Manage your personal information and preferences.</p>
          </div>
        </Card>
      </motion.div>

      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`mb-6 p-4 rounded-2xl flex items-center gap-3 shadow-sm font-bold ${msgType === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/30' : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-950/30'}`}>
          {msgType === 'success' ? <CheckCircle className="text-emerald-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
          {message}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6 md:p-10 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
          
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-3 text-xl">
                <User size={24} className="text-brand-500" /> Account Information
              </h3>
              {!isEditing && (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="rounded-xl px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs"
                >
                  ⚙️ Edit Account
                </Button>
              )}
            </div>
            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="relative">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1 block">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
                  <Input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className="pl-12" disabled={!isEditing} />
                </div>
              </div>
              <div className="relative">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1 block">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Mail size={18} /></div>
                  <Input name="email" value={form.email} readOnly disabled placeholder="you@example.com" className="pl-12 bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-505 cursor-not-allowed opacity-80" />
                </div>
              </div>
              <div className="relative">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1 block">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Phone size={18} /></div>
                  <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 890" className="pl-12" disabled={!isEditing} />
                </div>
              </div>
              
              <div className="relative">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1 block">Food Preference</label>
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Utensils size={18} /></div>
                  <Input name="foodPreference" value={form.foodPreference} onChange={handleChange} placeholder="Veg, Non-Veg, Vegan..." className="pl-12" disabled={!isEditing} />
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
                        disabled={!isEditing}
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
                            : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                        } disabled:opacity-75 disabled:cursor-not-allowed`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1 block">Delivery Time</label>
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Clock size={18} /></div>
                  <Input name="deliveryTime" value={form.deliveryTime} onChange={handleChange} placeholder="e.g. 7:00 PM" className="pl-12" disabled={!isEditing} />
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
                      disabled={!isEditing}
                      onClick={() => setForm({ ...form, deliveryTime: t.value })}
                      className="px-3 py-1.5 rounded-full text-xs font-bold border bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      🕒 {t.label}
                    </button>
                  ))}
                  
                  <div className="relative flex items-center border border-slate-200 dark:border-slate-800 rounded-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-2">Custom:</span>
                    <input
                      type="time"
                      disabled={!isEditing}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const [h, m] = e.target.value.split(":");
                        const hours = parseInt(h);
                        const ampm = hours >= 12 ? "PM" : "AM";
                        const formattedHours = hours % 12 || 12;
                        setForm({ ...form, deliveryTime: `${formattedHours}:${m} ${ampm}` });
                      }}
                      className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {isEditing && (
            <div className="mb-10">
              <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 text-xl pb-4 border-b border-slate-100 dark:border-slate-800/60">
                <MapPin size={24} className="text-brand-500" /> Delivery Information
              </h3>
              <div className="space-y-6">
                <div className="relative">
                  <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1 block">Address Type</label>
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
                          disabled={!isEditing}
                          onClick={() => handleAddressTypeChange(t.id)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${
                            active
                              ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-355 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                          } disabled:opacity-75 disabled:cursor-not-allowed`}
                        >
                          <span>{t.icon}</span>
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider ml-1 block">Delivery Address Details</label>
                    <button
                      type="button"
                      disabled={!isEditing}
                      onClick={useCurrentLocation}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-50 dark:bg-brand-950/30 hover:bg-brand-100 dark:hover:bg-brand-900/40 text-brand-600 dark:text-brand-405 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {locationLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Navigation size={12} />
                      )}
                      Use Current Location
                    </button>
                  </div>
                  <textarea
                    name="address"
                    value={getCleanAddressText(form.address)}
                    onChange={handleAddressTextChange}
                    disabled={!isEditing}
                    placeholder={
                      getAddressType(form.address) === "home"
                        ? "Enter your Home address details..."
                        : getAddressType(form.address) === "office"
                        ? "Enter your Office address details..."
                        : "Enter your custom / own street address..."
                    }
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-y min-h-[120px] text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder:text-slate-500 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}


          {isEditing && (
            <div className="mt-10 flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800/60">
              <Button
                type="button"
                onClick={() => {
                  setForm(originalForm);
                  setIsEditing(false);
                }}
                variant="secondary"
                size="lg"
                className="px-8 py-4 text-lg rounded-full"
              >
                Cancel
              </Button>
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
          )}
        </Card>
      </motion.div>

      {/* Favorite Foods Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.15 }}
        className="mt-8"
      >
        <Card className="p-6 md:p-10 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-3 text-xl">
              <Utensils size={24} className="text-brand-500" /> My Favorite Foods
            </h3>
            <Button 
              onClick={() => setShowFavorites(!showFavorites)} 
              variant="secondary" 
              className="rounded-xl px-5 py-2.5 text-xs font-bold transition-all"
            >
              {showFavorites ? "Hide Favorite Foods" : "View Favorite Foods"}
            </Button>
          </div>
          
          {showFavorites && (
            favoriteFoods.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-800/60">
                <p className="text-slate-500 dark:text-slate-400 font-medium">You haven't marked any food as favorite yet. Visit the Menu to add some favorites!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {favoriteFoods.map(food => (
                  <Card key={food._id} className="p-4 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
                    <div>
                      <div className="relative h-36 w-full rounded-2xl overflow-hidden mb-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                        {food.image ? (
                          <img src={food.image} alt={food.name} className="max-w-full max-h-full w-auto h-auto object-contain group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🍔</div>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const token = await getToken();
                              if (!token) return;
                              const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/favorites/toggle`, {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify({ foodId: food._id })
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setFavorites(data.favorites || []);
                              }
                            } catch (err) {
                              console.error("Failed to toggle favorite:", err);
                            }
                          }}
                          className="absolute top-2 left-2 w-8 h-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center rounded-lg shadow-sm text-red-500 hover:scale-105 transition-all"
                        >
                          ❤️
                        </button>
                        <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-black text-slate-900 dark:text-white shadow-sm">
                          ₹{food.price}
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white truncate text-base">{food.name}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">{food.description}</p>
                    </div>
                    <Button onClick={() => navigate("/user/menu")} className="mt-4 w-full text-xs py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl font-bold">
                      Order Now
                    </Button>
                  </Card>
                ))}
              </div>
            )
          )}
        </Card>
      </motion.div>

      {/* Coupons/Promo Codes Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.18 }}
        className="mt-8"
      >
        <Card className="p-6 md:p-10 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-3 text-xl">
              <span className="text-brand-500 text-2xl">🎟️</span> View Coupon / Promo Code
            </h3>
            <Button 
              onClick={() => setShowCoupons(!showCoupons)} 
              variant="secondary" 
              className="rounded-xl px-5 py-2.5 text-xs font-bold transition-all"
            >
              {showCoupons ? "Hide Coupons" : "View Coupons"}
            </Button>
          </div>
          
          {showCoupons && (
            coupons.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-800/60">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Empty Promo Code</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {coupons.map(coupon => (
                  <Card key={coupon._id} className="p-5 border border-dashed border-brand-500 bg-brand-50/10 dark:bg-brand-950/10 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                    <div>
                      <span className="inline-block px-3 py-1 bg-brand-500 text-white text-xs font-extrabold rounded-lg tracking-wider mb-3 uppercase">
                        {coupon.code}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-2">{coupon.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Discount: <span className="font-bold text-brand-500">{coupon.discountValue}{coupon.discountType === "percentage" ? "% OFF" : " ₹ OFF"}</span>
                      </p>
                      {coupon.minimumOrder > 0 && (
                        <p className="text-xs text-slate-405 dark:text-slate-500 font-medium mt-1">
                          Min. Order: ₹{coupon.minimumOrder}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}
        </Card>
      </motion.div>

      {/* Dedicated Logout Card/Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <Card className="p-6 md:p-8 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center shrink-0">
              <LogOut size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Logout</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium font-sans">Are you sure you want to logout?</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="px-6 py-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-extrabold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center gap-2"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </Card>
      </motion.div>

      {/* Confirmation Dialog Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          {/* Dialog */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fade-in text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto mb-6">
              <LogOut size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Logout</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">
              Are you sure you want to logout?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all duration-200 active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
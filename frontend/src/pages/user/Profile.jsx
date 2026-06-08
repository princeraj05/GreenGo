import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle,
  ChevronRight,
  CircleHelp,
  Copy,
  Gift,
  Heart,
  Info,
  LifeBuoy,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Save,
  TicketPercent,
  User,
  UserPen,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { getToken } from "../../utils/getToken";
import { clearSession } from "../../utils/authStorage";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";

const API = getApiUrl();

const emptyAddress = { label: "Home", details: "", city: "", state: "", isPrimary: true };

export default function Profile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    addresses: [emptyAddress],
    deliveryTime: "",
    notifications: "",
  });
  const [originalForm, setOriginalForm] = useState(null);
  const [foods, setFoods] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [suggestion, setSuggestion] = useState({ subject: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("");

  useEffect(() => {
    loadProfileData();
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMsgType(type);
    setTimeout(() => setMessage(""), 3200);
  };

  const normalizeAddresses = (userData) => {
    if (Array.isArray(userData.addresses) && userData.addresses.length > 0) {
      return userData.addresses;
    }
    if (userData.address) {
      return [{ ...emptyAddress, details: userData.address }];
    }
    return [emptyAddress];
  };

  const loadProfileData = async () => {
    try {
      const token = await getToken();
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const [userRes, foodsRes, couponsRes, contactsRes] = await Promise.all([
        fetch(`${API}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/foods`),
        fetch(`${API}/api/coupons/active`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/contact/my`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        const nextForm = {
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          addresses: normalizeAddresses(userData),
          deliveryTime: userData.deliveryTime || "",
          notifications: userData.notifications || "",
        };
        setForm(nextForm);
        setOriginalForm(nextForm);
        setFavorites(userData.favorites || []);
      }

      if (foodsRes.ok) setFoods(await foodsRes.json());
      if (couponsRes.ok) setCoupons(await couponsRes.json());
      if (contactsRes.ok) setContacts(await contactsRes.json());
    } catch (err) {
      console.error("Failed to load profile:", err);
      showMessage("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const cleanAddressPart = (value = "") =>
    String(value)
      .replace(/\b(?:Jaipur|Rajasthan)\b/gi, "")
      .replace(/\s*,\s*,/g, ",")
      .replace(/^[\s,.-]+|[\s,.-]+$/g, "")
      .trim();

  const formatAddressLine = (addr) => {
    if (!addr) return "";
    return [addr.details, addr.city, addr.state].map(cleanAddressPart).filter(Boolean).join(", ");
  };

  const primaryAddress = useMemo(
    () => (form.addresses || []).find((addr) => addr.isPrimary) || (form.addresses || [])[0],
    [form.addresses]
  );

  const favoriteFoods = useMemo(
    () => foods.filter((food) => favorites.includes(food._id)),
    [foods, favorites]
  );

  const referralCode = useMemo(() => {
    const source = form.name || form.phone || form.email || "GREENGO";
    return `${source.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase() || "GREEN"}25`;
  }, [form.name, form.phone, form.email]);

  const updateAddressField = (index, field, value) => {
    const nextAddresses = [...(form.addresses || [])];
    nextAddresses[index] = { ...nextAddresses[index], [field]: value };
    setForm({ ...form, addresses: nextAddresses });
  };

  const addAddress = () => {
    setForm({
      ...form,
      addresses: [...(form.addresses || []), { ...emptyAddress, isPrimary: false }],
    });
  };

  const removeAddress = (index) => {
    const nextAddresses = (form.addresses || []).filter((_, i) => i !== index);
    if (nextAddresses.length && !nextAddresses.some((addr) => addr.isPrimary)) {
      nextAddresses[0].isPrimary = true;
    }
    setForm({ ...form, addresses: nextAddresses.length ? nextAddresses : [emptyAddress] });
  };

  const setPrimaryAddress = (index) => {
    setForm({
      ...form,
      addresses: (form.addresses || []).map((addr, i) => ({ ...addr, isPrimary: i === index })),
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      showMessage("Location is not supported on this device.", "error");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const addressText = data?.display_name || `Lat: ${latitude}, Lng: ${longitude}`;
          const nextAddresses = [...(form.addresses || [emptyAddress])];
          const primaryIndex = Math.max(nextAddresses.findIndex((addr) => addr.isPrimary), 0);
          nextAddresses[primaryIndex] = { ...nextAddresses[primaryIndex], details: addressText, isPrimary: true };
          setForm({ ...form, addresses: nextAddresses });
          showMessage("Location added to your primary address");
        } catch {
          showMessage("Location found, but address lookup failed.", "error");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        showMessage("Unable to fetch location. Check permissions.", "error");
      }
    );
  };

  const saveProfile = async (override = {}) => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      const current = { ...form, ...override };
      const primary = (current.addresses || []).find((addr) => addr.isPrimary) || (current.addresses || [])[0];
      const payload = {
        ...current,
        address: primary ? [primary.label, formatAddressLine(primary)].filter(Boolean).join(" - ") : current.address,
      };

      const res = await fetch(`${API}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      const userData = data.user || payload;
      const nextForm = {
        ...payload,
        name: userData.name || payload.name,
        phone: userData.phone || payload.phone,
        address: userData.address || payload.address,
        addresses: normalizeAddresses(userData),
      };
      setForm(nextForm);
      setOriginalForm(nextForm);
      showMessage("Profile updated successfully");
    } catch (err) {
      console.error(err);
      showMessage("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleFavoriteFood = async (foodId) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API}/api/users/favorites/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ foodId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
        showMessage("Favorites updated");
      }
    } catch {
      showMessage("Failed to update favorite", "error");
    }
  };

  const submitSuggestion = async () => {
    if (!suggestion.message.trim()) {
      showMessage("Please write your suggestion.", "error");
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name || "GreenGO User",
          email: form.email,
          subject: suggestion.subject || "User suggestion",
          message: suggestion.message,
        }),
      });
      if (!res.ok) throw new Error("Suggestion failed");
      setSuggestion({ subject: "", message: "" });
      showMessage("Suggestion sent successfully");
      loadProfileData();
    } catch {
      showMessage("Failed to send suggestion", "error");
    }
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await clearSession();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    { id: "edit", label: "Edit Profile", icon: UserPen },
    { id: "addresses", label: "Saved Addresses", icon: MapPin },
    { id: "favorites", label: "My Favorite Foods", icon: Heart },
    { id: "refer", label: "Refer & Earn", icon: Users },
    { id: "coupons", label: "Coupons", icon: TicketPercent },
    { id: "suggestions", label: "Suggestions", icon: MessageSquare },
    { id: "support", label: "Help & Support", icon: LifeBuoy },
    { id: "about", label: "About GreenGO", icon: Info },
  ];

  const renderSection = () => {
    if (!activeSection) return null;

    if (activeSection === "edit") {
      return (
        <Section title="Edit Profile" onClose={() => setActiveSection(null)}>
          <div className="space-y-4">
            <Field label="Full Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Aman Kumar" />
            </Field>
            <Field label="Email Address">
              <Input value={form.email} disabled readOnly className="bg-slate-100 dark:bg-slate-900 cursor-not-allowed" />
            </Field>
            <Field label="Mobile Number">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Preferred Delivery Time">
              <Input value={form.deliveryTime} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} placeholder="ASAP / 8:00 PM" />
            </Field>
            <Button onClick={() => saveProfile()} disabled={saving} className="w-full rounded-2xl py-3 gap-2">
              <Save size={18} />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </Section>
      );
    }

    if (activeSection === "addresses") {
      return (
        <Section title="Saved Addresses" onClose={() => setActiveSection(null)}>
          <div className="space-y-4">
            <button
              type="button"
              onClick={useCurrentLocation}
              className="w-full rounded-2xl border border-brand-100 dark:border-brand-900 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 py-3 font-extrabold flex items-center justify-center gap-2"
            >
              {locationLoading ? <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /> : <Navigation size={17} />}
              Use Current Location
            </button>
            {(form.addresses || []).map((addr, index) => (
              <div key={index} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input value={addr.label || ""} onChange={(e) => updateAddressField(index, "label", e.target.value)} placeholder="Home / Office" className="profile-input" />
                  <input value={addr.city || ""} onChange={(e) => updateAddressField(index, "city", e.target.value)} placeholder="City" className="profile-input" />
                  <input value={addr.state || ""} onChange={(e) => updateAddressField(index, "state", e.target.value)} placeholder="State" className="profile-input" />
                </div>
                <textarea value={addr.details || ""} onChange={(e) => updateAddressField(index, "details", e.target.value)} placeholder="Full address" className="profile-input min-h-[84px] resize-y" />
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setPrimaryAddress(index)} className={`px-3 py-2 rounded-xl text-xs font-black ${addr.isPrimary ? "bg-brand-500 text-white" : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-800"}`}>
                    {addr.isPrimary ? "Primary" : "Set Primary"}
                  </button>
                  {(form.addresses || []).length > 1 && (
                    <button type="button" onClick={() => removeAddress(index)} className="px-3 py-2 rounded-xl text-xs font-black bg-red-50 dark:bg-red-950/20 text-red-600">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={addAddress} className="w-full rounded-2xl border border-dashed border-brand-300 dark:border-brand-800 text-brand-600 dark:text-brand-300 py-3 font-extrabold">
              Add New Address
            </button>
            <Button onClick={() => saveProfile()} disabled={saving} className="w-full rounded-2xl py-3">
              {saving ? "Saving..." : "Save Addresses"}
            </Button>
          </div>
        </Section>
      );
    }

    if (activeSection === "favorites") {
      return (
        <Section title="My Favorite Foods" onClose={() => setActiveSection(null)}>
          {favoriteFoods.length === 0 ? (
            <EmptyText text="No favorite foods yet. Add favorites from the food menu." />
          ) : (
            <div className="space-y-3">
              {favoriteFoods.map((food) => (
                <div key={food._id} className="flex gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                  <img src={getImageUrl(food.image)} alt={food.name} className="w-20 h-20 rounded-xl object-contain bg-slate-50 dark:bg-slate-950" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-950 dark:text-white truncate">{food.name}</h4>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 line-clamp-2">{food.description}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-black text-brand-600">₹{food.price}</span>
                      <button type="button" onClick={() => toggleFavoriteFood(food._id)} className="text-xs font-black text-red-500">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={() => navigate("/user/menu")} className="w-full rounded-2xl">Order Favorites</Button>
            </div>
          )}
        </Section>
      );
    }

    if (activeSection === "refer") {
      return (
        <Section title="Refer & Earn" onClose={() => setActiveSection(null)}>
          <div className="rounded-3xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 p-5 text-center">
            <Gift className="mx-auto text-brand-600 mb-3" size={38} />
            <h3 className="text-xl font-black text-slate-950 dark:text-white">Share GreenGO</h3>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-300 mt-2">Give your friend a coupon and earn rewards after their first order.</p>
            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-950 border border-brand-100 dark:border-brand-900 p-2">
              <span className="flex-1 font-black tracking-widest text-brand-700 dark:text-brand-300">{referralCode}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(referralCode);
                  showMessage("Referral code copied");
                }}
                className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center"
              >
                <Copy size={17} />
              </button>
            </div>
          </div>
        </Section>
      );
    }

    if (activeSection === "coupons") {
      return (
        <Section title="Coupons" onClose={() => setActiveSection(null)}>
          {coupons.length === 0 ? (
            <EmptyText text="No active coupons available right now." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coupons.map((coupon) => (
                <div key={coupon._id} className="rounded-2xl border border-dashed border-brand-400 bg-brand-50/40 dark:bg-brand-950/20 p-4">
                  <span className="inline-flex px-3 py-1 rounded-lg bg-brand-500 text-white text-xs font-black tracking-widest">{coupon.code}</span>
                  <h4 className="font-black text-slate-950 dark:text-white mt-3">{coupon.title}</h4>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-300 mt-1">
                    {coupon.discountValue}{coupon.discountType === "percentage" ? "% OFF" : " INR OFF"}
                  </p>
                  {coupon.minimumOrder > 0 && <p className="text-xs font-bold text-slate-400 mt-1">Min order: ₹{coupon.minimumOrder}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>
      );
    }

    if (activeSection === "suggestions") {
      return (
        <Section title="Suggestions" onClose={() => setActiveSection(null)}>
          <div className="space-y-4">
            <Field label="Subject">
              <Input value={suggestion.subject} onChange={(e) => setSuggestion({ ...suggestion, subject: e.target.value })} placeholder="Food, delivery, app feedback..." />
            </Field>
            <Field label="Message">
              <textarea value={suggestion.message} onChange={(e) => setSuggestion({ ...suggestion, message: e.target.value })} placeholder="Write your suggestion..." className="profile-input min-h-[130px] resize-y" />
            </Field>
            <Button onClick={submitSuggestion} className="w-full rounded-2xl py-3">Send Suggestion</Button>
            {contacts.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-black text-slate-950 dark:text-white mb-3">Your Messages</h4>
                <div className="space-y-2">
                  {contacts.slice(-3).reverse().map((item) => (
                    <div key={item._id} className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3">
                      <p className="text-xs font-black text-slate-900 dark:text-white">{item.subject || "Suggestion"}</p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 line-clamp-2 mt-1">{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      );
    }

    if (activeSection === "support") {
      return (
        <Section title="Help & Support" onClose={() => setActiveSection(null)}>
          <div className="space-y-3">
            <SupportRow icon={Phone} title="Call Support" detail="+91 98765 43210" />
            <SupportRow icon={Mail} title="Email Support" detail="support@greengo.app" />
            <SupportRow icon={CircleHelp} title="Order Help" detail="For active order issues, open Orders and check latest status." />
          </div>
        </Section>
      );
    }

    if (activeSection === "about") {
      return (
        <Section title="About GreenGO" onClose={() => setActiveSection(null)}>
          <div className="space-y-4 text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>GreenGO is built for quick food discovery, budget recommendations, coupons, saved addresses, and easy re-ordering.</p>
            <p>Version 1.0.0</p>
            <p>Account data shown here is loaded from your backend login session using the saved authentication token.</p>
          </div>
        </Section>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-10 px-0 sm:px-4">
      <div className="relative overflow-hidden bg-white dark:bg-slate-950 sm:rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 min-h-[calc(100vh-7rem)]">
        <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-950 px-5 pt-6 pb-7">
          <button
            type="button"
            onClick={() => navigate("/user/menu")}
            className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-900"
            title="Close"
          >
            <X size={22} />
          </button>

          <div className="flex items-center gap-4 pr-12">
            <div className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center text-4xl font-black shadow-lg shadow-green-500/20">
              {form.name ? form.name.charAt(0).toUpperCase() : <User size={38} />}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white truncate">{form.name || "GreenGO User"}</h1>
              <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <Phone size={15} />
                <span>{form.phone || "Phone not added"}</span>
              </div>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-black text-sm">
                <BadgeCheck size={16} />
                GreenGO Member
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mx-5 mt-4 p-3 rounded-2xl flex items-center gap-2 font-bold text-sm ${msgType === "error" ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>
            {msgType === "error" ? <XCircle size={18} /> : <CheckCircle size={18} />}
            {message}
          </div>
        )}

        <div className="px-5 py-4">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className="w-full flex items-center gap-4 py-4 text-left group"
              >
                <span className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 flex items-center justify-center shrink-0">
                  <item.icon size={22} />
                </span>
                <span className="flex-1 font-black text-slate-950 dark:text-white text-base sm:text-lg">{item.label}</span>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-green-600 transition-colors" />
              </button>
            ))}

            <button type="button" onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-4 py-4 text-left group">
              <span className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center shrink-0">
                <LogOut size={22} />
              </span>
              <span className="flex-1 font-black text-red-600 dark:text-red-400 text-base sm:text-lg">Logout</span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center text-xs font-bold text-slate-400 pointer-events-none">
          Version 1.0.0
        </div>
      </div>

      <AnimatePresence>{renderSection()}</AnimatePresence>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-7 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto mb-5">
              <LogOut size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-950 dark:text-white">Logout</h3>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-300 mt-2 mb-6">Are you sure you want to logout?</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200">
                Cancel
              </button>
              <button type="button" onClick={confirmLogout} className="py-3 rounded-xl bg-red-500 text-white font-bold">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[2100] flex items-end sm:items-center justify-center bg-slate-950/55 backdrop-blur-sm p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 70, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 70, scale: 0.98 }}
        className="w-full sm:max-w-2xl max-h-[88vh] overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center justify-center">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[76vh]">{children}</div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function EmptyText({ text }) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-8 text-center">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{text}</p>
    </div>
  );
}

function SupportRow({ icon: Icon, title, detail }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
      <span className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 flex items-center justify-center shrink-0">
        <Icon size={20} />
      </span>
      <div>
        <h4 className="font-black text-slate-950 dark:text-white">{title}</h4>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-300 mt-1">{detail}</p>
      </div>
    </div>
  );
}

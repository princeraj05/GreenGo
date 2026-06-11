import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle,
  ChevronRight,
  CircleHelp,
  Copy,
  ExternalLink,
  Gift,
  Heart,
  Info,
  Eye,
  EyeOff,
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
const MotionDiv = motion.div;

const emptyAddress = { label: "Home", details: "", city: "", state: "", isPrimary: true };

/**
 * Profile Component
 * 
 * Manages user accounts details, addresses, favorite food lists, refer-a-friend links, active discount coupons,
 * support contact tickets, and developer bio profiles.
 */
export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();

  /* --- STATE DECLARATIONS --- */
  
  // form: Local form input controls mapping current customer info
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    addresses: [emptyAddress],
    deliveryTime: "",
    notifications: "",
    birthDate: "",
    password: "",
    hasPassword: false,
  });
  // foods: Catalog of items matching favorites list IDs
  const [foods, setFoods] = useState([]);
  // favorites: List of user liked items IDs
  const [favorites, setFavorites] = useState([]);
  // coupons: Active coupon entities retrieved from backend
  const [coupons, setCoupons] = useState([]);
  // contacts: Client message tickets log history
  const [contacts, setContacts] = useState([]);
  // activeSection: Selected settings tab opened in slider overlay modal
  const [activeSection, setActiveSection] = useState(null);
  // suggestion: Feedback ticket fields
  const [suggestion, setSuggestion] = useState({ subject: "", message: "" });
  
  // loaders & toggles
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // developer profile variables
  const [developerPhotoIndex, setDeveloperPhotoIndex] = useState(0);
  const [developerFailedPhotos, setDeveloperFailedPhotos] = useState(() => new Set());
  
  // screen warnings & notifications
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("");

  /* --- MEMOIZED DERIVED VALUES --- */

  // Candidate image paths for developer carousel slideshow (exactly the 2 available photos)
  const developerPhotoCandidates = useMemo(() => {
    return [
      "/developerPhoto/activeDeveloperPhoto1.jpg",
      "/developerPhoto/activeDeveloperPhoto5.jpg"
    ];
  }, []);

  // Returns first available developer image that loaded successfully
  const activeDeveloperPhoto = useMemo(() => {
    if (developerFailedPhotos.size >= developerPhotoCandidates.length) return "";
    for (let offset = 0; offset < developerPhotoCandidates.length; offset += 1) {
      const index = (developerPhotoIndex + offset) % developerPhotoCandidates.length;
      const candidate = developerPhotoCandidates[index];
      if (!developerFailedPhotos.has(candidate)) return candidate;
    }
    return "";
  }, [developerFailedPhotos, developerPhotoCandidates, developerPhotoIndex]);

  /* --- DATA FETCHING & LIFECYCLE --- */

  // Load backend configurations on component mount
  useEffect(() => {
    loadProfileData();
  }, []);

  // Sets up automatic photo rotations for developer profile slide deck
  useEffect(() => {
    const timer = setInterval(() => {
      setDeveloperPhotoIndex((current) => (current + 1) % developerPhotoCandidates.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [developerPhotoCandidates.length]);

  /* --- ACTIONS & HANDLERS --- */

  /**
   * showMessage: Renders floating top alerts on forms.
   */
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

  const hasAddressDetails = (addr) => Boolean(String(addr?.details || "").trim());

  const getCleanAddresses = (addresses = []) => {
    const cleaned = (Array.isArray(addresses) ? addresses : [])
      .map((addr) => ({
        ...addr,
        label: String(addr?.label || "Home").trim() || "Home",
        details: String(addr?.details || "").trim(),
        city: String(addr?.city || "").trim(),
        state: String(addr?.state || "").trim(),
        isPrimary: Boolean(addr?.isPrimary),
      }))
      .filter(hasAddressDetails);

    if (cleaned.length && !cleaned.some((addr) => addr.isPrimary)) {
      cleaned[0].isPrimary = true;
    }

    return cleaned.map((addr, index) => ({
      ...addr,
      isPrimary: index === cleaned.findIndex((item) => item.isPrimary),
    }));
  };

  /**
   * loadProfileData: Retrieves profile fields, food references, active coupons, and support requests.
   */
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
          birthDate: userData.birthDate ? new Date(userData.birthDate).toISOString().slice(0, 10) : "",
          password: "",
          hasPassword: Boolean(userData.profileCompletion?.passwordSet || userData.profileCompletion?.editProfileCompleted),
        };
        setForm(nextForm);
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

  const favoriteFoods = useMemo(
    () => foods.filter((food) => favorites.includes(food._id)),
    [foods, favorites]
  );

  const editProfileCompleted = Boolean(String(form.name || "").trim() && String(form.phone || "").trim() && form.hasPassword);
  const addressCompleted = getCleanAddresses(form.addresses).length > 0 || Boolean(String(form.address || "").trim());
  const profileCompletionPercent = (editProfileCompleted ? 50 : 0) + (addressCompleted ? 50 : 0);

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

  /**
   * useCurrentLocation: Fetches browser coordinates and requests OpenStreetMap reverse lookup.
   */
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
          const addressText = data?.display_name || "Current location";
          const detailsWithCoords = `${addressText}\nLat: ${latitude}, Lng: ${longitude}`;
          const addressData = data?.address || {};
          const nextAddresses = (form.addresses || [emptyAddress]).map((addr) => ({ ...addr, isPrimary: false }));
          const currentLocationIndex = nextAddresses.findIndex((addr) => addr.label === "Current Location");
          const currentLocationAddress = {
            label: "Current Location",
            details: detailsWithCoords,
            city: addressData.city || addressData.town || addressData.village || addressData.county || "",
            state: addressData.state || "",
            isPrimary: true,
          };

          if (currentLocationIndex >= 0) {
            nextAddresses[currentLocationIndex] = currentLocationAddress;
          } else {
            nextAddresses.unshift(currentLocationAddress);
          }

          setForm({ ...form, addresses: nextAddresses });
          showMessage("Current location added as address choice");
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

  const isStrongPassword = (password = "") => (
    password.length >= 6 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );

  /**
   * saveProfile: Syncs updated user settings and address updates to the server.
   */
  const saveProfile = async (override = {}, options = {}) => {
    if (options.requirePassword && !form.hasPassword && !form.password) {
      showMessage("Please set password to complete profile.", "error");
      return;
    }
    if (form.password && !isStrongPassword(form.password)) {
      showMessage("Password must include alphabet, number, special character and min 6 chars.", "error");
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      const current = { ...form, ...override };
      const cleanedAddresses = getCleanAddresses(current.addresses);
      const primaryAddress = cleanedAddresses.find((addr) => addr.isPrimary) || cleanedAddresses[0];
      const payload = {
        ...current,
        addresses: cleanedAddresses,
        address: cleanedAddresses.length
          ? [primaryAddress?.label, formatAddressLine(primaryAddress)].filter(Boolean).join(" - ")
          : current.address,
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
        birthDate: userData.birthDate ? new Date(userData.birthDate).toISOString().slice(0, 10) : payload.birthDate,
        password: "",
        hasPassword: Boolean(userData.profileCompletion?.passwordSet || userData.profileCompletion?.editProfileCompleted || payload.password),
      };
      setForm(nextForm);
      showMessage("Profile updated successfully");
      if (activeSection === "edit" || activeSection === "addresses") {
        setActiveSection(null);
      }
    } catch (err) {
      console.error(err);
      showMessage("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  /**
   * toggleFavoriteFood: Syncs dynamic food liking toggles.
   */
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
    } catch (currentFail) {
      showMessage("Failed to update favorite", "error");
    }
  };

  /**
   * submitSuggestion: Submits contact message fields to admin inbox.
   */
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
          name: form.name || "GreenGo User",
          email: form.email,
          subject: suggestion.subject || "User suggestion",
          message: suggestion.message,
        }),
      });
      if (!res.ok) throw new Error("Suggestion failed");
      setSuggestion({ subject: "", message: "" });
      showMessage("Suggestion sent successfully");
      loadProfileData();
    } catch (err) {
      showMessage("Failed to send suggestion", "error");
    }
  };

  /**
   * confirmLogout: Removes session identifiers and redirects to auth portal.
   */
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
    { id: "about", label: "About GreenGo", icon: Info },
    { id: "developer", label: "About Developer", icon: User },
  ];

  /* --- RENDER SECTION ROUTER --- */
  const renderSection = () => {
    if (!activeSection) return null;

    // Edit Profile Modal Section
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
            <Field label={form.hasPassword ? "Set New Password" : "Set Password"}>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Abc@123"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Min 6 chars: alphabet, number, special character.
              </p>
            </Field>
            <Field label="Preferred Delivery Time">
              <Input value={form.deliveryTime} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} placeholder="ASAP / 8:00 PM" />
            </Field>
            <Field label="Birthday">
              <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </Field>
            <Button onClick={() => saveProfile({}, { requirePassword: true })} disabled={saving} className="w-full rounded-2xl py-3 gap-2">
              <Save size={18} />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </Section>
      );
    }

    // Saved Addresses Modal Section
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

    // Favorite Foods Modal Section
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

    // Refer & Earn Modal Section
    if (activeSection === "refer") {
      return (
        <Section title="Refer & Earn" onClose={() => setActiveSection(null)}>
          <div className="rounded-3xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 p-5 text-center">
            <Gift className="mx-auto text-brand-600 mb-3" size={38} />
            <h3 className="text-xl font-black text-slate-950 dark:text-white">Share GreenGo</h3>
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

    // Coupons Modal Section
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

    // Suggestions Modal Section
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

    // Help & Support Modal Section
    if (activeSection === "support") {
      return (
        <Section title="Help & Support" onClose={() => setActiveSection(null)}>
          <div className="space-y-3">
            <SupportRow icon={Phone} title="Call Support" detail="+91 7361809619" />
            <SupportRow icon={Mail} title="Email Support" detail="shivam851214@gmail.com" />
            <SupportRow icon={CircleHelp} title="Order Help" detail="For active order issues, open Orders and check latest status." />
          </div>
        </Section>
      );
    }

    // About GreenGo Modal Section
    if (activeSection === "about") {
      return (
        <Section title="About GreenGo" onClose={() => setActiveSection(null)}>
          <div className="space-y-4 text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>GreenGo is built for quick food discovery, budget recommendations, coupons, saved addresses, and easy re-ordering.</p>
            <p>Version 1.0.0</p>
            <p>Account data shown here is loaded from your backend login session using the saved authentication token.</p>
          </div>
        </Section>
      );
    }

    // Developer Profile Section
    if (activeSection === "developer") {
      return (
        <Section title="About Developer" onClose={() => setActiveSection(null)}>
          <div className="space-y-5">
            <div className="relative mx-auto aspect-[9/16] w-36 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 shadow-xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 sm:w-44">
              {activeDeveloperPhoto ? (
                <img
                  src={activeDeveloperPhoto}
                  alt="Prince Raj"
                  className="h-full w-full object-cover transition-opacity duration-500"
                  onError={() => {
                    setDeveloperFailedPhotos((current) => new Set(current).add(activeDeveloperPhoto));
                    setDeveloperPhotoIndex((current) => (current + 1) % developerPhotoCandidates.length);
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-green-500 text-4xl font-black text-white shadow-lg shadow-green-500/20">
                  PR
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-300">Developer</p>
                <h3 className="text-lg font-black tracking-tight">Prince Raj</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DeveloperInfo label="Country" value="India" />
              <DeveloperInfo label="From" value="Khagaria, Bihar" />
              <DeveloperInfo label="Current City" value="Jalandhar, Punjab" />
              <DeveloperInfo label="College" value="Lovely Professional University (LPU)" />
              <DeveloperInfo label="Status" value="4th Year Student" />
            </div>

            <a
              href="https://portfolio-eight-ecru-dzw18cjkva.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-black py-3 flex items-center justify-center gap-2 transition-colors"
            >
              View Portfolio
              <ExternalLink size={17} />
            </a>
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
      
      {/* --- PROFILE CARD CONTAINER --- */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-950 sm:rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 min-h-[calc(100vh-7rem)]">
        
        {/* Profile Header Details (Banner Area) */}
        <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-950 px-5 pt-6 pb-7">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center text-4xl font-black shadow-lg shadow-green-500/20">
              {form.name ? form.name.charAt(0).toUpperCase() : <User size={38} />}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white truncate">{form.name || "GreenGo User"}</h1>
              <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <Phone size={15} />
                <span>{form.phone || "Phone not added"}</span>
              </div>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-black text-sm">
                <BadgeCheck size={16} />
                GreenGo Member
              </div>
            </div>
          </div>
        </div>

        {/* Validation Feedback Alert Messages */}
        {message && (
          <div className={`mx-5 mt-4 p-3 rounded-2xl flex items-center gap-2 font-bold text-sm ${msgType === "error" ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>
            {msgType === "error" ? <XCircle size={18} /> : <CheckCircle size={18} />}
            {message}
          </div>
        )}

        {/* PROFILE COMPLETION PERCENT BAR */}
        <div className="mx-5 mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          {location.state?.profileRequired && (
            <p className="mb-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              Please complete your profile to unlock all features.
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Profile Level</p>
              <h3 className="mt-0.5 text-lg font-black text-slate-950 dark:text-white">{profileCompletionPercent}% Completed</h3>
            </div>
            <span className={`rounded-xl px-2.5 py-1.5 text-xs font-bold ${
              profileCompletionPercent === 100
                ? "bg-emerald-500 text-white"
                : "bg-white text-emerald-700 dark:bg-slate-950 dark:text-emerald-300"
            }`}>
              {profileCompletionPercent === 100 ? "Unlocked" : "Locked"}
            </span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white dark:bg-slate-950">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${profileCompletionPercent}%` }} />
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] font-bold">
            <span className={editProfileCompleted ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}>
              Edit Profile: {editProfileCompleted ? "50%" : "Pending"}
            </span>
            <span className={addressCompleted ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}>
              Saved Address: {addressCompleted ? "50%" : "Pending"}
            </span>
          </div>
        </div>

        {/* SETTINGS OPTION BUTTON LIST */}
        <div className="px-5 py-4">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className="w-full flex items-center gap-4 py-3 text-left group"
              >
                <span className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 flex items-center justify-center shrink-0">
                  <item.icon size={20} />
                </span>
                <span className="flex-1 font-bold text-slate-900 dark:text-white text-sm sm:text-base">{item.label}</span>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-green-600 transition-colors" />
              </button>
            ))}

            <button type="button" onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-4 py-3 text-left group">
              <span className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center shrink-0">
                <LogOut size={20} />
              </span>
              <span className="flex-1 font-bold text-red-600 dark:text-red-400 text-sm sm:text-base">Logout</span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center text-xs font-bold text-slate-400 pointer-events-none">
          Version 1.0.0
        </div>
      </div>

      {/* --- OVERLAY DETAILED VIEWS --- */}
      <AnimatePresence>{renderSection()}</AnimatePresence>

      {/* --- LOGOUT CONFIRMATION POPUP --- */}
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

/* --- REUSABLE CARD OVERLAY MODAL WRAPPER --- */
function Section({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[2100] flex items-end sm:items-center justify-center bg-slate-950/55 backdrop-blur-sm p-0 sm:p-4">
      <MotionDiv
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
      </MotionDiv>
    </div>
  );
}

/* --- REUSABLE FORM FIELD WRAPPER --- */
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">{label}</span>
      {children}
    </label>
  );
}

/* --- REUSABLE EMPTY STATE COMPONENT --- */
function EmptyText({ text }) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-8 text-center">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{text}</p>
    </div>
  );
}

/* --- REUSABLE DEVELOPER INFORMATION CARD --- */
function DeveloperInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

/* --- REUSABLE SUPPORT DETAIL ROW --- */
function SupportRow({ icon: Icon, title, detail }) {
  const RowIcon = Icon;
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
      <span className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 flex items-center justify-center shrink-0">
        <RowIcon size={20} />
      </span>
      <div>
        <h4 className="font-black text-slate-950 dark:text-white">{title}</h4>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-300 mt-1">{detail}</p>
      </div>
    </div>
  );
}

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
  ShieldAlert,
  Smartphone,
  ShieldCheck,
  Download,
  Trash2
} from "lucide-react";
import { getToken } from "../../utils/getToken";
import { clearSession } from "../../utils/authStorage";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import { getApiUrl, getImageUrl } from "../../utils/getApiUrl";
import { speakText } from "../../utils/ttsService";

const API = getApiUrl();
const MotionDiv = motion.div;

const emptyAddress = { label: "Home", details: "", city: "", state: "", isPrimary: true };

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [foods, setFoods] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [suggestion, setSuggestion] = useState({ subject: "", message: "" });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [developerPhotoIndex, setDeveloperPhotoIndex] = useState(0);
  const [developerFailedPhotos, setDeveloperFailedPhotos] = useState(() => new Set());
  
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("");

  // Sessions and deletion center states
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const developerPhotoCandidates = useMemo(() => {
    return [
      "/developerPhoto/activeDeveloperPhoto1.jpg",
      "/developerPhoto/activeDeveloperPhoto5.jpg"
    ];
  }, []);

  const activeDeveloperPhoto = useMemo(() => {
    if (developerFailedPhotos.size >= developerPhotoCandidates.length) return "";
    for (let offset = 0; offset < developerPhotoCandidates.length; offset += 1) {
      const index = (developerPhotoIndex + offset) % developerPhotoCandidates.length;
      const candidate = developerPhotoCandidates[index];
      if (!developerFailedPhotos.has(candidate)) return candidate;
    }
    return "";
  }, [developerFailedPhotos, developerPhotoCandidates, developerPhotoIndex]);

  useEffect(() => {
    loadProfileData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setDeveloperPhotoIndex((current) => (current + 1) % developerPhotoCandidates.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [developerPhotoCandidates.length]);

  useEffect(() => {
    if (activeSection === "edit") {
      speakText("Please complete your profile. Add your name, phone number, password, and birthday date.");
    } else if (activeSection === "addresses") {
      speakText("Please fill your address. Choose current location or any location.");
    }
  }, [activeSection]);

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

        if (location.state?.profileRequired) {
          const isEditDone = Boolean(String(userData.name || "").trim() && String(userData.phone || "").trim() && (userData.profileCompletion?.passwordSet || userData.profileCompletion?.editProfileCompleted));
          if (!isEditDone) {
            setActiveSection("edit");
          } else {
            const hasAddr = (Array.isArray(userData.addresses) && userData.addresses.some((addr) => String(addr?.details || "").trim())) || String(userData.address || "").trim();
            if (!hasAddr) {
              setActiveSection("addresses");
            }
          }
        }
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

  const fetchActiveSessions = async () => {
    setSessionsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/users/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/users/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showMessage("Device session logged out successfully");
        fetchActiveSessions();
      }
    } catch (err) {
      showMessage("Failed to log out device session", "error");
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/users/sessions`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showMessage("All device sessions logged out successfully");
        setShowLogoutConfirm(false);
        await confirmLogout();
      }
    } catch (err) {
      showMessage("Failed to revoke all sessions", "error");
    }
  };

  const handleDownloadUserData = async () => {
    try {
      const token = await getToken();
      window.open(`${API}/api/users/download-data?token=${token}`, "_blank");
      showMessage("Your data download request initiated.");
    } catch (err) {
      showMessage("Failed to download data", "error");
    }
  };

  const handleRequestAccountDeletion = async () => {
    if (!window.confirm("Are you sure you want to request account deletion? Your data will be permanently scrubbed after a 7-day recovery period.")) {
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/users/request-delete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showMessage("Account deletion scheduled. Logging out in 7 days window...", "success");
        setTimeout(async () => {
          await confirmLogout();
        }, 3000);
      } else {
        const data = await res.json();
        showMessage(data.message || "Request failed", "error");
      }
    } catch (err) {
      showMessage("Request failed", "error");
    }
  };

  useEffect(() => {
    if (activeSection === "sessions") {
      fetchActiveSessions();
    }
  }, [activeSection]);

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
    password.length >= 6
  );

  const saveProfile = async (override = {}, options = {}) => {
    if (options.requirePassword && !form.hasPassword && !form.password) {
      showMessage("Please set password to complete profile.", "error");
      return;
    }
    if (form.password && !isStrongPassword(form.password)) {
      showMessage("Password must be at least 6 characters long.", "error");
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
      window.dispatchEvent(new CustomEvent("address-updated"));
      if (location.state?.profileRequired) {
        if (activeSection === "edit") {
          setActiveSection("addresses");
        } else if (activeSection === "addresses") {
          setActiveSection(null);
          const redirectPath = location.state?.from || "/user/menu";
          navigate(redirectPath, { replace: true });
        }
      } else {
        if (activeSection === "edit" || activeSection === "addresses") {
          setActiveSection(null);
        }
      }
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
    } catch (currentFail) {
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

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await clearSession();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    { id: "edit", label: "Edit Profile", icon: UserPen },
    { id: "addresses", label: "Saved Addresses", icon: MapPin },
    { id: "favorites", label: "My Favorite Foods", icon: Heart },
    { id: "privacy", label: "Privacy & Security", icon: ShieldCheck },
    { id: "sessions", label: "Session Management", icon: Smartphone },
    { id: "refer", label: "Refer & Earn", icon: Users },
    { id: "coupons", label: "Coupons", icon: TicketPercent },
    { id: "suggestions", label: "Suggestions", icon: MessageSquare },
    { id: "support", label: "Help & Support", icon: LifeBuoy },
    { id: "about", label: "About GreenGo", icon: Info },
    { id: "developer", label: "About Developer", icon: User },
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
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter Number" />
            </Field>
            <Field label={form.hasPassword ? "Set New Password" : "Set Password"}>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter Password"
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
                Minimum 6 digits/characters.
              </p>
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

    if (activeSection === "privacy") {
      return (
        <Section title="Privacy & Security Center" onClose={() => setActiveSection(null)}>
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 space-y-2">
              <div className="flex items-center gap-2 font-black text-sm">
                <ShieldAlert size={18} />
                <span>Automatic Account & Data Deletion</span>
              </div>
              <p className="text-xs font-semibold leading-relaxed">
                Your account and personal data will be automatically deleted if you do not use the app for 30 consecutive days. Order records required for financial reporting and revenue calculations will be retained.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Compliance & Security Checklist</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle size={15} className="text-emerald-500" />
                  <span>Encrypted Messages</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle size={15} className="text-emerald-500" />
                  <span>Secure Password Storage</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle size={15} className="text-emerald-500" />
                  <span>OTP Protected Login</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle size={15} className="text-emerald-500" />
                  <span>Device Monitoring</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle size={15} className="text-emerald-500" />
                  <span>Suspicious Login Detection</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CheckCircle size={15} className="text-emerald-500" />
                  <span>Auto Data Deletion</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Your Data Portability & Rights</h4>
              <button
                type="button"
                onClick={handleDownloadUserData}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-brand-950/20 border border-slate-100 dark:border-slate-800 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0">
                    <Download size={18} />
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 dark:text-white">Download My Data (JSON)</p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Export profile, addresses, orders & active sessions</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-brand-600" />
              </button>

              <button
                type="button"
                onClick={handleRequestAccountDeletion}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-100/40 dark:border-red-900/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center shrink-0">
                    <Trash2 size={18} />
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-black text-red-600 dark:text-red-400">Request Account Deletion</p>
                    <p className="text-[10px] font-semibold text-red-400 mt-0.5">Start 7-day recovery period before permanent deletion</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-red-400 group-hover:text-red-600" />
              </button>
            </div>
          </div>
        </Section>
      );
    }

    if (activeSection === "sessions") {
      return (
        <Section title="Session Management" onClose={() => setActiveSection(null)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400">Active Devices & Login History</span>
              <button
                type="button"
                onClick={handleRevokeAllSessions}
                className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-xl"
              >
                Logout From All Devices
              </button>
            </div>

            {sessionsLoading ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <EmptyText text="No other active sessions found." />
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session._id}
                    className="flex items-start justify-between gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Smartphone size={20} />
                      </div>
                      <div className="text-left">
                        <h5 className="text-xs font-black text-slate-950 dark:text-white">
                          {session.deviceName} ({session.os})
                        </h5>
                        <p className="text-[10px] font-bold text-slate-500 mt-1">
                          Browser: {session.browser} | IP: {session.ipAddress}
                        </p>
                        <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                          Logged in: {new Date(session.loginTime).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRevokeSession(session._id)}
                      className="text-[10px] font-black text-red-600 hover:bg-red-50 p-2 rounded-xl"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      );
    }

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
            <SupportRow icon={Phone} title="Call Support" detail="+91 7361809619" />
            <SupportRow icon={Mail} title="Email Support" detail="shivam851214@gmail.com" />
            <SupportRow icon={CircleHelp} title="Order Help" detail="For active order issues, open Orders and check latest status." />
          </div>
        </Section>
      );
    }

    if (activeSection === "about") {
      return (
        <Section title="About GreenGo" onClose={() => setActiveSection(null)}>
          <div className="space-y-4 text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>GreenGo is built for quick food discovery, budget recommendations, coupons, saved addresses, and easy re-ordering.</p>
            <p className="font-extrabold text-brand-655 text-base">Version 1.0.26 (Stable release)</p>
            <p>Account data shown here is loaded from your backend login session using the saved authentication token.</p>
          </div>
        </Section>
      );
    }

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
      
      <div className="relative overflow-hidden bg-white dark:bg-slate-950 sm:rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-slate-800 min-h-[calc(100vh-7rem)]">
        
        {/* Decorative background glassmorphic shapes for outstanding look */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute top-[20%] left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[70px] -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 bg-gradient-to-br from-emerald-50/60 via-white/80 to-transparent dark:from-emerald-950/10 dark:via-slate-950/90 dark:to-transparent backdrop-blur-md px-5 pt-6 pb-7 border-b border-slate-50 dark:border-slate-900 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center text-4xl font-black shadow-lg shadow-green-500/30 ring-4 ring-green-100 dark:ring-green-950/20">
              {form.name ? form.name.charAt(0).toUpperCase() : <User size={38} />}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 dark:text-white break-words leading-tight">{form.name || "GreenGo User"}</h1>
              <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <Phone size={15} />
                <span>{form.phone || "Phone not added"}</span>
              </div>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-black text-sm shadow-sm">
                <BadgeCheck size={16} />
                GreenGo Member
              </div>
            </div>
          </div>
        </div>

        {/* Quick Statistics Bar */}
        <div className="relative z-10 px-5 pt-5 pb-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 p-3 text-center shadow-md shadow-slate-900/5 dark:shadow-black/20 hover:scale-[1.02] transition-all duration-300">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Favorites</p>
            <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{favorites.length || 0}</p>
          </div>
          <div className="rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 p-3 text-center shadow-md shadow-slate-900/5 dark:shadow-black/20 hover:scale-[1.02] transition-all duration-300">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Coupons</p>
            <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{coupons.length || 0}</p>
          </div>
          <div className="rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 p-3 text-center shadow-md shadow-slate-900/5 dark:shadow-black/20 hover:scale-[1.02] transition-all duration-300">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Support</p>
            <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{contacts.length || 0}</p>
          </div>
        </div>

        {message && (
          <div className={`mx-5 mt-2 p-3 rounded-2xl flex items-center gap-2 font-bold text-sm ${msgType === "error" ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>
            {msgType === "error" ? <XCircle size={18} /> : <CheckCircle size={18} />}
            {message}
          </div>
        )}

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

        <div className="px-5 py-5 pb-24 sm:pb-16 relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className="group relative flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-center transition-all duration-350 hover:shadow-md active:scale-[0.97] min-h-[110px]"
              >
                <span className="w-11 h-11 rounded-2xl bg-green-500/10 text-green-700 dark:text-green-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-300 shrink-0">
                  <item.icon size={22} />
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm tracking-tight">{item.label}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="group flex flex-col items-center justify-center p-4 rounded-3xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 dark:border-red-550/20 text-center transition-all duration-350 active:scale-[0.97] min-h-[110px]"
            >
              <span className="w-11 h-11 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-2.5 shrink-0">
                <LogOut size={22} />
              </span>
              <span className="font-bold text-red-650 dark:text-red-400 text-xs sm:text-sm tracking-tight">Logout</span>
            </button>
          </div>

          <div className="mt-8 text-center text-xs font-black text-brand-500/80 select-none tracking-wider uppercase">
            Version 1.0.26 (Production)
          </div>
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

function DeveloperInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

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

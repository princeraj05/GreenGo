import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, LogOut, Mail, MapPin, Navigation, Phone, Save, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { clearSession } from "../../utils/authStorage";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

// Initial empty form structure template for the Profile setup
const emptyForm = {
  name: "",
  phone: "",
  email: "",
  deliveryAddress: "",
  deliveryLatitude: "",
  deliveryLongitude: "",
  password: "",
  hasPassword: false,
};

export default function DeliveryProfile() {
  // --- REACT STATE & CUSTOM HOOKS ---
  
  // Navigation utility to change route paths
  const navigate = useNavigate();
  
  // State storing the database user profile details
  const [profile, setProfile] = useState(null);
  
  // Form input field attributes state mapping
  const [form, setForm] = useState(emptyForm);
  
  // Async status flag showing if the profile update API call is in progress
  const [saving, setSaving] = useState(false);
  
  // Geolocation lookup status indicator for GPS/reverse-geocoding loading states
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Toast text holding success confirmation feedback
  const [message, setMessage] = useState("");
  
  // Toast text holding custom error warnings
  const [error, setError] = useState("");

  // --- FORM VALIDATION UTILITIES ---
  
  // Evaluates if all essential form input details have been filled out properly
  const isComplete = useMemo(
    () => Boolean(
      String(form.name || "").trim() &&
      String(form.phone || "").trim() &&
      String(form.deliveryAddress || "").trim() &&
      (form.hasPassword || String(form.password || "").trim())
    ),
    [form]
  );

  // Regex utility check enforcing password strength conventions (length >= 6, includes letter, number, and special character)
  const isStrongPassword = (password = "") => (
    password.length >= 6 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );

  // --- API DATA FETCHING & EVENT HANDLERS ---

  // Loads the profile of the logged-in delivery user and updates form fields
  async function loadProfile() {
    try {
      const res = await API.get("/api/users/me");
      const user = res.data || {};
      const details = user.deliveryDetails || {};
      setProfile(user);
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        deliveryAddress: details.address || user.address || "",
        deliveryLatitude: details.latitude ?? "",
        deliveryLongitude: details.longitude ?? "",
        password: "",
        hasPassword: Boolean(user.profileCompletion?.passwordSet || details.profileCompleted),
      });
    } catch (err) {
      console.error("Failed to load delivery profile:", err);
      setError("Failed to load profile.");
    }
  }

  // Load user details when the component mounts
  useEffect(() => {
    Promise.resolve().then(loadProfile);
  }, []);

  // Signs out the delivery partner, removes session credentials, and redirects to login
  const logout = async () => {
    await clearSession();
    navigate("/login", { replace: true });
  };

  // Helper utility to show dynamic statuses that auto-dismiss in 3 seconds
  const showMessage = (text) => {
    setMessage(text);
    setError("");
    setTimeout(() => setMessage(""), 3000);
  };

  // Triggers browser Geolocation APIs to reverse-geocode GPS coordinates via OpenStreetMap Nominatim API
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location services are not supported on this device or browser.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let addressText = `Lat: ${latitude}, Lng: ${longitude}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          addressText = data?.display_name || addressText;
        } catch (err) {
          console.error("Reverse geocode failed:", err);
        } finally {
          setForm((current) => ({
            ...current,
            deliveryAddress: addressText,
            deliveryLatitude: latitude,
            deliveryLongitude: longitude,
          }));
          setLocationLoading(false);
          showMessage("Current location updated successfully.");
        }
      },
      () => {
        setLocationLoading(false);
        setError("Please enable location permissions or enter your address manually.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
  };

  // Submits updated parameters to `/api/users/profile` and fires a refresh event to update parent state templates
  const saveProfile = async () => {
    if (!isComplete) {
      setError("Please complete your name, phone number, address, and password.");
      return;
    }
    if (form.password && !isStrongPassword(form.password)) {
      setError("Password must be at least 6 characters and contain letters, numbers, and special characters.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
        address: form.deliveryAddress.trim(),
        deliveryAddress: form.deliveryAddress.trim(),
        deliveryLatitude: form.deliveryLatitude,
        deliveryLongitude: form.deliveryLongitude,
      };
      const res = await API.put("/api/users/profile", payload);
      const user = res.data?.user || {};
      setProfile(user);
      const details = user.deliveryDetails || {};
      setForm((current) => ({
        ...current,
        name: user.name || current.name,
        phone: user.phone || current.phone,
        deliveryAddress: details.address || user.address || current.deliveryAddress,
        deliveryLatitude: details.latitude ?? current.deliveryLatitude,
        deliveryLongitude: details.longitude ?? current.deliveryLongitude,
        password: "",
        hasPassword: Boolean(details.profileCompleted || form.password),
      }));
      // Alert parent layouts/listeners that profile completion variables have updated
      window.dispatchEvent(new Event("delivery-profile-updated"));
      showMessage("Delivery profile updated successfully. Assigned orders will now be visible.");
    } catch (err) {
      console.error("Failed to save delivery profile:", err);
      setError(err.response?.data?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const completedFromServer = Boolean(profile?.deliveryDetails?.profileCompleted);

  return (
    // Outer content layout wrapper
    <div className="space-y-5 sm:space-y-6">
      
      {/* --- HEADER SECTION --- */}
      {/* Display page titles */}
      <div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">Profile</h2>
        <p className="text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400 mt-1">
          Complete your delivery profile to view assigned orders.
        </p>
      </div>

      {/* --- MAIN PROFILE CARD --- */}
      {/* Card container holding profile form items */}
      <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 sm:p-5 lg:p-6 shadow-sm">
        
        {/* --- PROFILE AVATAR SUMMARY HEADER --- */}
        {/* Profile identity avatar representation displaying dynamic initials & status badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-5">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-2xl font-black">
              {form.name ? form.name[0].toUpperCase() : "D"}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-black truncate">{form.name || "Delivery Partner"}</h3>
              <p className="text-sm font-bold text-brand-600 dark:text-brand-400">GreenGo Delivery Boy</p>
            </div>
          </div>
          <span className={`inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-wider ${
            completedFromServer
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
          }`}>
            <CheckCircle2 size={16} />
            {completedFromServer ? "Profile Complete" : "Profile Required"}
          </span>
        </div>

        {/* --- NOTIFICATION FEEDBACK STATUS ALERT --- */}
        {/* Renders conditional banner for validation issues or transaction results */}
        {(message || error) && (
          <div className={`mb-5 rounded-2xl px-4 py-3 text-sm font-bold ${
            error
              ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"
          }`}>
            {error || message}
          </div>
        )}

        {/* --- FORM CONFIGURATION INPUT FIELDS --- */}
        {/* Layout grid configuration matching responsive dimensions (2 columns on desktops, 1 on small tablets) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Name" icon={User}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
          </Field>

          <Field label="Phone Number" icon={Phone}>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
          </Field>

          <Field label={form.hasPassword ? "Set New Password" : "Set Password"} icon={User}>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Abc@123"
            />
            <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Min 6 chars: alphabet, number, special character.
            </p>
          </Field>

          <Field label="Email" icon={Mail}>
            <Input value={form.email} disabled readOnly className="bg-slate-100 dark:bg-slate-900 cursor-not-allowed" />
          </Field>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 min-w-0">
            <MapPin size={17} className="text-brand-600 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Join Date</p>
            <p className="mt-1 font-black text-slate-950 dark:text-white">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Not available"}
            </p>
          </div>
        </div>

        {/* --- DELIVERY LOCATION ADDRESS & TEXT AREA SECTION --- */}
        {/* Handles map geocoding controls, address descriptions, and coordinates mappings */}
        <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Delivery Address</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Use your current location or update the address manually.</p>
            </div>
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locationLoading}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 px-4 py-2.5 text-sm font-black disabled:opacity-60"
            >
              <Navigation size={16} />
              {locationLoading ? "Detecting..." : "Use My Location"}
            </button>
          </div>
          <textarea
            value={form.deliveryAddress}
            onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
            placeholder="House/Street, Area, City, State"
            className="w-full min-h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 resize-y break-words"
          />
        </div>

        {/* --- ACTION BUTTON SECTION --- */}
        {/* Displays responsive row for updating profile attributes and logging out */}
        <div className="mt-5 grid grid-cols-1 sm:flex sm:flex-row gap-3">
          <Button onClick={saveProfile} disabled={saving} className="flex-1 rounded-2xl gap-2 py-3">
            <Save size={18} /> {saving ? "Saving..." : completedFromServer ? "Update Profile" : "Complete Profile"}
          </Button>
          <Button onClick={logout} variant="danger" className="rounded-2xl gap-2 py-3 sm:w-44">
            <LogOut size={18} /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

// Sub-component defining wrapper label fields with dynamic icon headers and titles
function Field({ label, icon: Icon, children }) {
  const FieldIcon = Icon;
  return (
    <label className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 block min-w-0">
      <FieldIcon size={17} className="text-brand-600 mb-2" />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">{label}</span>
      {children}
    </label>
  );
}

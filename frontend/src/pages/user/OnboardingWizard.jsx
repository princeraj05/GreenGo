import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, MapPin, CheckCircle, Navigation, Percent, Sparkles, Utensils, CupSoda, ShoppingBag, Globe, ArrowRight, ChevronRight, User } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { getApiUrl } from "../../utils/getApiUrl";
import { getToken } from "../../utils/getToken";
import { useTranslation } from "../../context/LanguageContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const API = getApiUrl();
const MotionDiv = motion.div;

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, changeLanguage, t } = useTranslation();

  // Wizard Steps: 1 = Notifications, 2 = Language, 3 = Address
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Address fields
  const [addressLabel, setAddressLabel] = useState("Home");
  const [addressDetails, setAddressDetails] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Load existing user details to prepopulate name and phone if available
    const loadUserData = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setPhone(data.phone || "");
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadUserData();
  }, []);

  const showToast = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleEnableNotifications = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await PushNotifications.addListener('registration', async (token) => {
          localStorage.setItem("fcm_token", token.value);
          try {
            await fetch(`${API}/api/users/fcm-token`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
              },
              body: JSON.stringify({ token: token.value })
            });
          } catch (err) {
            console.error(err);
          }
        });
        let permission = await PushNotifications.checkPermissions();
        if (permission.receive !== "granted") {
          permission = await PushNotifications.requestPermissions();
        }
        if (permission.receive === "granted") {
          await PushNotifications.register();
        }
      } else if (typeof Notification !== "undefined") {
        await Notification.requestPermission();
      }
    } catch (err) {
      console.warn("Notification setup warn:", err);
    } finally {
      setStep(2);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("Location not supported on this device.");
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
          setAddressDetails(`${addressText}\nLat: ${latitude}, Lng: ${longitude}`);
          const addrData = data?.address || {};
          setCity(addrData.city || addrData.town || addrData.village || addrData.county || "");
          setState(addrData.state || "");
          showToast("Location fetched successfully!");
        } catch (err) {
          showToast("Failed to fetch address details.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        showToast("Unable to fetch location. Please check permission.");
      }
    );
  };

  const handleCompleteSetup = async () => {
    if (!name.trim()) {
      showToast("Please enter your name.");
      return;
    }
    if (!phone.trim()) {
      showToast("Please enter your phone number.");
      return;
    }
    if (!addressDetails.trim()) {
      showToast("Please enter your delivery address.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;

      const formattedAddress = `${addressDetails.trim()}, ${city.trim()}, ${state.trim()}`;
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        addresses: [
          {
            label: addressLabel.trim() || "Home",
            details: addressDetails.trim(),
            city: city.trim(),
            state: state.trim(),
            isPrimary: true
          }
        ],
        address: `${addressLabel.trim() || "Home"} - ${formattedAddress}`
      };

      const res = await fetch(`${API}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("Onboarding setup completed successfully!");
        localStorage.setItem("onboarding_completed", "true");
        window.dispatchEvent(new CustomEvent("address-updated"));
        
        setTimeout(() => {
          navigate("/user/menu", { replace: true });
        }, 1000);
      } else {
        showToast("Failed to save profile. Please try again.");
      }
    } catch (err) {
      showToast("Server error during setup.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between bg-slate-50 dark:bg-slate-950 px-6 py-8 font-sans">
      
      {/* Top Banner & Stepper Header */}
      <div className="w-full max-w-md mt-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-brand-500 text-lg">Green</span>
            <span className="font-extrabold text-slate-950 dark:text-white text-lg">GO</span>
          </div>
          
          {/* Visual Step Indicator Dots */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step 
                    ? "w-6 bg-brand-500" 
                    : s < step 
                      ? "w-2 bg-emerald-500" 
                      : "w-2 bg-slate-300 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 w-full max-w-md flex flex-col justify-center my-auto py-8">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: NOTIFICATIONS */}
          {step === 1 && (
            <MotionDiv
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center space-y-8"
            >
              <div className="space-y-3">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Stay Updated!
                </h1>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 px-4">
                  Enable notifications to receive live updates about your orders, exclusive discounts, and rewards.
                </p>
              </div>

              {/* Central Glowing Bell Animation */}
              <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                <div className="absolute w-40 h-40 rounded-full bg-brand-100/40 dark:bg-brand-900/10 blur-xl animate-pulse" />
                <motion.div
                  animate={{
                    rotate: [0, -10, 10, -10, 10, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "easeInOut",
                    repeatDelay: 1,
                  }}
                  className="z-10 p-6 bg-brand-500 text-white rounded-full shadow-xl shadow-brand-500/20"
                >
                  <Bell className="w-16 h-16 stroke-[1.5]" />
                </motion.div>
                
                {/* Floating elements */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute top-4 left-6 p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow border border-emerald-100/20"
                >
                  <Percent className="w-5 h-5" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.3 }}
                  className="absolute bottom-6 right-6 p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl shadow border border-rose-100/20"
                >
                  <ShoppingBag className="w-5 h-5" />
                </motion.div>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleEnableNotifications}
                  className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-brand-500/20"
                >
                  Enable Notifications
                </Button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Not now, skip this
                </button>
              </div>
            </MotionDiv>
          )}

          {/* STEP 2: CHOOSE LANGUAGE */}
          {step === 2 && (
            <MotionDiv
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Choose Language / भाषा चुनें
                </h1>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Select your preferred language for the application.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => changeLanguage("en")}
                  className={`flex items-center justify-between p-5 rounded-3xl border-2 font-black text-base transition-all ${
                    language === "en"
                      ? "bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950/20"
                      : "bg-white border-slate-100 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">🇬🇧</span>
                    <span>English</span>
                  </div>
                  {language === "en" && <CheckCircle className="text-brand-500 w-6 h-6" />}
                </button>

                <button
                  type="button"
                  onClick={() => changeLanguage("hi")}
                  className={`flex items-center justify-between p-5 rounded-3xl border-2 font-black text-base transition-all ${
                    language === "hi"
                      ? "bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950/20"
                      : "bg-white border-slate-100 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">🇮🇳</span>
                    <span>हिन्दी (Hindi)</span>
                  </div>
                  {language === "hi" && <CheckCircle className="text-brand-500 w-6 h-6" />}
                </button>
              </div>

              <Button
                onClick={() => setStep(3)}
                className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <span>{t("language") === "मेन्यू" ? "आगे बढ़ें" : "Continue"}</span>
                <ArrowRight size={18} />
              </Button>
            </MotionDiv>
          )}

          {/* STEP 3: PROFILE DETAILS & ADDRESS */}
          {step === 3 && (
            <MotionDiv
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {language === "hi" ? "प्रोफ़ाइल और पता जोड़ें" : "Profile & Delivery Address"}
                </h1>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {language === "hi" ? "आर्डर डिलीवर करने के लिए इन जानकारियों को भरें" : "Provide details so we can deliver your orders accurately."}
                </p>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {language === "hi" ? "पूरा नाम" : "Full Name"}
                  </span>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === "hi" ? "अमन कुमार" : "John Doe"}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {language === "hi" ? "मोबाइल नंबर" : "Mobile Number"}
                  </span>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={language === "hi" ? "नंबर दर्ज करें" : "Enter Mobile Number"}
                  />
                </div>

                {/* Location Button */}
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="w-full rounded-2xl border border-brand-100 dark:border-brand-900 bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300 py-3 font-extrabold flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  {locationLoading ? (
                    <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Navigation size={15} />
                  )}
                  {language === "hi" ? "वर्त्तमान लोकेशन का उपयोग करें" : "Use Current Location"}
                </button>

                {/* Address details */}
                <div className="space-y-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={addressLabel}
                      onChange={(e) => setAddressLabel(e.target.value)}
                      placeholder="Home / Office"
                      className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none"
                    />
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none"
                    />
                    <input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none"
                    />
                  </div>
                  <textarea
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="Full Address Details (House no, Street name, Landmark)"
                    className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none min-h-[70px] resize-none"
                  />
                </div>
              </div>

              <Button
                onClick={handleCompleteSetup}
                disabled={saving}
                className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm sm:text-base mt-2"
              >
                {saving 
                  ? (language === "hi" ? "सुरक्षित किया जा रहा है..." : "Saving details...") 
                  : (language === "hi" ? "सेटअप पूरा करें" : "Complete Setup & Order Now")}
              </Button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("onboarding_completed", "true");
                  navigate("/user/menu", { replace: true });
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 block mx-auto mt-4"
              >
                {language === "hi" ? "बाद में करें, छोड़ें" : "Skip and explore app"}
              </button>
            </MotionDiv>
          )}

        </AnimatePresence>
      </div>

      {/* Floating Toast Notification */}
      {message && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-lg z-[2500]">
          {message}
        </div>
      )}
      
      {/* Footer Branding */}
      <div className="text-[10px] font-bold text-slate-400 mt-auto">
        GreenGo Premium Onboarding Wizard
      </div>
    </div>
  );
}

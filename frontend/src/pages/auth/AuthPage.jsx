import { useCallback, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, Lock, ArrowLeft, ArrowRight, Loader2, Sparkles, Sun, Moon } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import API from "../../api/axios";
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { saveSession } from "../../utils/authStorage";
import { getRoleHomePath } from "../../utils/roleRedirect";
import { useTheme } from "../../context/ThemeContext";

const MotionImg = motion.img;
const MotionDiv = motion.div;

export default function AuthPage() {
  const { theme, toggleTheme } = useTheme();
  const loginSlides = [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=900",
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=900",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=900",
    "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&q=80&w=900",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=900",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=900"
  ];
  const slideContent = [
    { title: "Fresh Food, Fast Delivery", desc: "Enjoy your favorite meals delivered hot and fresh directly to your doorstep." },
    { title: "Crafted by Local Chefs", desc: "Savor premium ingredients prepared by the finest kitchens in your area." },
    { title: "Pizza Night Done Right", desc: "Crispy crusts, melting cheese, and custom toppings delivered in minutes." },
    { title: "Nutritious & Delicious", desc: "Stay fit and energized with our curated selection of healthy, fresh salads." },
    { title: "Sweet Treats & Desserts", desc: "Indulge in desserts, pastries, and artisanal ice creams whenever you want." },
    { title: "Always Hot & On Time", desc: "Track your food in real-time from the kitchen to your table." },
  ];
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [authMethod, setAuthMethod] = useState("email"); // "email" | "phone"
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [step, setStep] = useState(1); // 1: Identifier entry, 2: OTP verification
  const [otpValues, setOtpValues] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const otpRefs = useRef([]);
  const loginRedirectPath = location.state?.from?.pathname || "/user/menu";
  const loginRedirectSearch = location.state?.from?.search || "";
  const loginRequired = Boolean(location.state?.loginRequired);
  const getPostLoginPath = useCallback((role) => {
    if (role === "admin" || role === "deliveryBoy") return getRoleHomePath(role);
    return `${loginRedirectPath}${loginRedirectSearch}`;
  }, [loginRedirectPath, loginRedirectSearch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % loginSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [loginSlides.length]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Handle Firebase redirect Google sign-in result and Email Link sign-in on mount
  useEffect(() => {
    let processed = false;
    const handleUserSession = async (user) => {
      if (processed) return;
      processed = true;
      setLoading(true);
      try {
        console.log("[FIREBASE AUTH] User session handler triggered:", user.email || user.phoneNumber);
        const idToken = await user.getIdToken(true);
        
        console.log("[FIREBASE AUTH] Backend sync started");
        const res = await API.post("/api/users/firebase-login", { idToken });
        const data = res.data;
        console.log("[FIREBASE AUTH] Backend sync success");
        
        localStorage.setItem("token", data.token);
        try {
          const meRes = await API.get("/api/users/me");
          await saveSession(data.token, meRes.data);
        } catch {
          await saveSession(data.token, { email: user.email, phone: user.phoneNumber, role: data.role });
        }
        navigate(getPostLoginPath(data.role), { replace: true });
      } catch (err) {
        console.error("[FIREBASE AUTH] Session handler failed:", err);
        setError("Firebase authentication backend sync failed.");
      } finally {
        setLoading(false);
      }
    };

    // Check if redirect link is Firebase Email Sign-in Link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      if (!emailForSignIn) {
        emailForSignIn = window.prompt('Please enter your email to confirm sign-in:');
      }
      if (emailForSignIn) {
        setLoading(true);
        signInWithEmailLink(auth, emailForSignIn, window.location.href)
          .then(async (result) => {
            window.localStorage.removeItem('emailForSignIn');
            await handleUserSession(result.user);
          })
          .catch((err) => {
            console.error("[FIREBASE AUTH] Email link sign in failed:", err);
            setError("Invalid or expired sign-in link.");
            setLoading(false);
          });
      }
    }

    const checkRedirect = async () => {
      try {
        console.log("[GOOGLE DEBUG] Redirect result checking...");
        const redirectPromise = getRedirectResult(auth);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Firebase Redirect Timeout")), 4000)
        );
        const result = await Promise.race([redirectPromise, timeoutPromise]);
        console.log("[GOOGLE DEBUG] Redirect result:", result);
        if (result && result.user) {
          await handleUserSession(result.user);
        } else if (auth.currentUser) {
          await handleUserSession(auth.currentUser);
        }
      } catch (err) {
        console.error("[GOOGLE AUTH] Google redirect sign in timed out or skipped:", err);
        if (auth.currentUser) {
          await handleUserSession(auth.currentUser);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("[GOOGLE DEBUG] Auth state changed");
      if (user) {
        await handleUserSession(user);
      }
    });

    checkRedirect();
    return () => unsubscribe();
  }, [navigate, getPostLoginPath]);

  const handleGoogleSignIn = async () => {
    console.log("[GOOGLE DEBUG] Button clicked");
    setLoading(true);
    setError("");
    try {
      // Use popup for all web environments to prevent redirect 404 init.json issues
      // Only use redirect if strictly in native Capacitor app container
      if (Capacitor.isNativePlatform()) {
        console.log("[GOOGLE DEBUG] Using redirect");
        await signInWithRedirect(auth, googleProvider);
      } else {
        console.log("[GOOGLE DEBUG] Using popup");
        try {
          result = await signInWithPopup(auth, googleProvider);
        } catch (popupErr) {
          console.log("[GOOGLE DEBUG] Popup failed or blocked, falling back to redirect...", popupErr);
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        const user = result.user;
        console.log("[GOOGLE DEBUG] Firebase user received:", user.email);
        
        console.log("[GOOGLE DEBUG] ID token generated");
        const idToken = await user.getIdToken();
        
        console.log("[GOOGLE DEBUG] Backend sync started");
        const res = await API.post("/api/users/google-login", { idToken });
        const data = res.data;
        console.log("[GOOGLE DEBUG] Backend sync success");
        
        localStorage.setItem("token", data.token);
        try {
          const meRes = await API.get("/api/users/me");
          await saveSession(data.token, meRes.data);
        } catch {
          await saveSession(data.token, { email: user.email, role: data.role });
        }
        
        navigate(getPostLoginPath(data.role), { replace: true });
      }
    } catch (err) {
      console.error("Google sign in failed:", err);
      setError(err.response?.data?.message || err.message || "Google Sign-In failed");
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved, ready to send OTP.
        },
        "expired-callback": () => {
          setError("reCAPTCHA expired. Please try again.");
        }
      });
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (authMethod === "phone") {
        console.log(`[LOGIN PROCESS] Attempting phone password login for ${phone}`);
        const res = await API.post("/api/users/login-phone", {
          phone,
          password: phonePassword,
        });

        const data = res.data;
        localStorage.setItem("token", data.token);
        
        try {
          const meRes = await API.get("/api/users/me");
          await saveSession(data.token, meRes.data);
        } catch {
          await saveSession(data.token, { phone, role: data.role });
        }

        navigate(getPostLoginPath(data.role), { replace: true });
        return;
      }

      // Email OTP verification flow
      console.log("[AUTH] Sending email OTP to:", email);
      await API.post("/api/users/send-otp-email", { email });
      
      setOtpSentMessage(`We have sent a 6-digit verification code to your email: ${email}. Please check your inbox and enter the code.`);
      setStep(2);
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      console.error("[AUTH] OTP Send Error:", err);
      setError(err.response?.data?.message || err.message || "Failed to send verification code. Please check your credentials or try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = otpValues.join("");
    if (otp.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (authMethod === "email") {
        console.log("[AUTH] Verifying Email OTP...");
        const res = await API.post("/api/users/verify-otp-email", { email, otp });
        const data = res.data;
        
        localStorage.setItem("token", data.token);
        try {
          const meRes = await API.get("/api/users/me");
          await saveSession(data.token, meRes.data);
        } catch {
          await saveSession(data.token, { email, role: data.role });
        }
        navigate(getPostLoginPath(data.role), { replace: true });
        return;
      }

      console.log("[FIREBASE AUTH] Verifying SMS OTP...");
      const confirmationResult = window.confirmationResult;
      if (!confirmationResult) {
        throw new Error("No pending verification session found. Please request a new OTP code.");
      }
      const userCredential = await confirmationResult.confirm(otp);
      console.log("[FIREBASE AUTH] OTP Verified! Fetching ID Token...");
      const idToken = await userCredential.user.getIdToken();
      
      console.log("[FIREBASE AUTH] Backend sync started...");
      const res = await API.post("/api/users/firebase-login", { idToken });
      const data = res.data;
      
      localStorage.setItem("token", data.token);
      try {
        const meRes = await API.get("/api/users/me");
        await saveSession(data.token, meRes.data);
      } catch {
        await saveSession(data.token, { phone: phone, role: data.role });
      }
      navigate(getPostLoginPath(data.role), { replace: true });
    } catch (err) {
      console.error("[AUTH] Verification error:", err);
      setError(err.response?.data?.message || err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && isNaN(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(-1);
    setOtpValues(newOtp);

    // Focus next box
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        const newOtp = [...otpValues];
        newOtp[index - 1] = "";
        setOtpValues(newOtp);
        otpRefs.current[index - 1].focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    const pastedText = e.clipboardData.getData("text").trim();
    if (pastedText.length === 6 && /^\d+$/.test(pastedText)) {
      const digits = pastedText.split("");
      setOtpValues(digits);
      otpRefs.current[5].focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    setError("");
    try {
      if (authMethod === "phone") {
        setupRecaptcha();
        const phoneNumber = "+91" + phone;
        const appVerifier = window.recaptchaVerifier;
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        window.confirmationResult = confirmation;
        setCountdown(30);
      } else {
        console.log("[AUTH] Resending email OTP to:", email);
        await API.post("/api/users/send-otp-email", { email });
        setCountdown(60);
      }
      setCanResend(false);
      setOtpValues(Array(6).fill(""));
    } catch {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      {/* Left Column - Branding & Banner (lg screens only) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-slate-950 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Dynamic Background Image Slider with Zoom & Fade */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <MotionImg
              key={currentHeroSlide}
              src={loginSlides[currentHeroSlide]}
              alt="GreenGo promo banner"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-brand-950/15 mix-blend-multiply" />
        </div>

        {/* Top Header inside Left Column */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <span className="text-2.5xl text-white">🍔</span>
          </div>
          <span className="text-2.5xl font-black tracking-tight text-white">GreenGo</span>
        </div>

        {/* Middle content: Promotional Slide content with animations */}
        <div className="relative z-10 max-w-lg mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentHeroSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Premium Food Experience
              </div>
              <h2 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight text-white">
                {slideContent[currentHeroSlide].title}
              </h2>
              <p className="text-slate-300 font-medium text-base leading-relaxed">
                {slideContent[currentHeroSlide].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="flex gap-2 mt-8">
            {loginSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentHeroSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentHeroSlide === index ? "w-8 bg-brand-500" : "w-2 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Footer inside Left Column */}
        <div className="relative z-10 flex justify-between items-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} GreenGo. All rights reserved.</p>
          <div className="flex gap-4 font-semibold">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Right Column - Authentication Card */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center items-center p-3 xs:p-4 sm:p-6 md:p-12 relative overflow-y-auto max-sm:overflow-y-hidden min-h-screen">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-[80px] pointer-events-none -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-brand-600/10 dark:bg-brand-600/5 rounded-full blur-[80px] pointer-events-none -z-10 animate-pulse" />

        {/* Auth Card Container */}
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-none p-4 sm:p-8 transition-all duration-300 z-10 flex flex-col">
          
          {/* Box 1: App logo + app name + Skip button + theme icon */}
          <div className="w-full flex items-center justify-between mb-3 sm:mb-5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20">
                <span className="text-lg sm:text-xl">🍔</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">GreenGo</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Theme Toggle Icon */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all active:scale-95 border border-slate-200/50 dark:border-slate-800/50"
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {/* Skip Button */}
              <button
                type="button"
                onClick={() => navigate("/user/menu", { replace: true })}
                className="rounded-full bg-brand-600 hover:bg-brand-700 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-black text-white shadow-md shadow-brand-500/25 transition-all active:scale-95"
              >
                Skip
              </button>
            </div>
          </div>

          {/* Box 2: Hero/banner image slider */}
          <div className="w-full overflow-hidden rounded-xl sm:rounded-2xl h-24 sm:h-40 relative bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 mb-3 sm:mb-5 shadow-sm">
            <AnimatePresence mode="wait">
              <MotionImg
                key={currentHeroSlide}
                src={loginSlides[currentHeroSlide]}
                alt="GreenGo banner"
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
            <div className="absolute bottom-2 sm:bottom-3 left-3 sm:left-4 right-3 sm:right-4 text-left">
              <p className="text-white text-xs sm:text-base font-black tracking-tight drop-shadow-md">
                {slideContent[currentHeroSlide].title}
              </p>
              <div className="flex gap-1 sm:gap-1.5 mt-1 sm:mt-2">
                {loginSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentHeroSlide(index)}
                    className={`h-1 sm:h-1.5 rounded-full transition-all ${
                      currentHeroSlide === index ? "w-4 sm:w-6 bg-brand-500" : "w-1 sm:w-1.5 bg-white/60 hover:bg-white"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Box 3: Tagline / error/info section */}
          <div className="w-full space-y-1.5 sm:space-y-3 mb-3 sm:mb-5">
            <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-black text-brand-600 dark:text-brand-400 tracking-widest uppercase">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse" />
              Delivering Happiness
            </div>

            {/* Error Section is shown only when error occurs. Otherwise, the box is hidden. */}
            {error && (
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-[11px] sm:text-xs font-bold leading-relaxed text-center animate-fade-in">
                {error}
              </div>
            )}
          </div>

          {/* Box 4: Sign In / Create Account heading */}
          <div className="w-full text-left mb-3 sm:mb-5">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">Sign in or create account</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 leading-relaxed font-medium">
              {step === 1 ? (
                authMethod === "phone" 
                  ? "Enter your phone number and password to log in." 
                  : "Enter your email to receive a passwordless secure sign-in link."
              ) : (
                authMethod === "phone" ? "Enter the OTP sent to your phone." : "Enter the OTP sent to your email."
              )}
            </p>
          </div>

          {/* Box 5: Email / Phone toggle */}
          {step === 1 && (
            <div className="w-full flex bg-slate-100 dark:bg-slate-950 rounded-xl sm:rounded-2xl p-1 mb-3 sm:mb-5 border border-slate-200/50 dark:border-slate-800/50">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("email");
                  setError("");
                }}
                className={`flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 ${
                  authMethod === "email"
                    ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/30 dark:border-slate-700/30"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Mail className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${authMethod === "email" ? "text-brand-500" : "text-slate-400"}`} /> 
                Email Address
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("phone");
                  setError("");
                }}
                className={`flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 ${
                  authMethod === "phone"
                    ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/30 dark:border-slate-700/30"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Phone className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${authMethod === "phone" ? "text-brand-500" : "text-slate-400"}`} /> 
                Phone Number
              </button>
            </div>
          )}

          {/* Form container */}
          <form onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp} className="w-full space-y-2.5 sm:space-y-4">
            {step === 1 ? (
              <>
                {/* Box 6: Input field */}
                {authMethod === "email" ? (
                  <div className="space-y-1 sm:space-y-2">
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 transition-colors pointer-events-none" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        required
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium text-slate-900 dark:text-white text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 sm:space-y-2">
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <div className="flex gap-1.5 sm:gap-2.5 items-center">
                      <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 select-none flex items-center shrink-0">
                        🇮🇳 +91
                      </div>
                      <div className="relative flex-1 flex items-center">
                        <Phone className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 transition-colors pointer-events-none" />
                        <input
                          type="tel"
                          placeholder="10-digit number"
                          value={phone}
                          required
                          pattern="^[0-9]{10}$"
                          title="Please enter a valid 10-digit phone number"
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-bold tracking-wide text-slate-900 dark:text-white text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Box 7: Password field (if phone auth) */}
                {authMethod === "phone" && (
                  <div className="space-y-1 sm:space-y-2 animate-fade-in">
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 transition-colors pointer-events-none" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={phonePassword}
                        required
                        onChange={(e) => setPhonePassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium text-slate-900 dark:text-white text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Box 7: OTP fields (if verifying code) */}
                <div className="space-y-2 sm:space-y-4 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Back
                  </button>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Verification Code (OTP)
                    </label>
                    <div className="flex justify-between gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                      {otpValues.map((value, idx) => (
                        <input
                          key={idx}
                          type="text"
                          ref={(el) => (otpRefs.current[idx] = el)}
                          value={value}
                          required
                          maxLength={1}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-9 h-11 sm:w-11 sm:h-13 md:w-12 md:h-14 text-center text-lg sm:text-2xl font-black rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-slate-900 dark:text-white shadow-sm"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Box 8: Main CTA button (Send OTP / Login) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-4 mt-1 sm:mt-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-75 flex items-center justify-center gap-1.5 sm:gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  {step === 2 ? "Verifying..." : authMethod === "phone" ? "Signing In..." : "Sending OTP..."}
                </>
              ) : (
                <>
                  {step === 2 
                    ? "Verify & Proceed" 
                    : authMethod === "phone" ? "Sign In" : "Send OTP"} 
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </>
              )}
            </button>

            {/* Resend OTP button */}
            {step === 2 && (
              <div className="text-center text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1 sm:pt-2">
                Didn't receive code?{" "}
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-brand-500 dark:text-brand-400 font-extrabold hover:underline"
                  >
                    Resend Code
                  </button>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">
                    Resend in {countdown}s
                  </span>
                )}
              </div>
            )}
          </form>

          {/* Box 9: Google Login button */}
          {step === 1 && (
            <>
              <div className="relative my-3 sm:my-6 w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[9px] sm:text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500">
                  <span className="bg-white dark:bg-slate-900 px-3">or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-[0.98] disabled:opacity-75"
              >
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google
              </button>
            </>
          )}

          <p className="text-center text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 sm:mt-8 leading-relaxed px-4">
            By continuing, you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
}

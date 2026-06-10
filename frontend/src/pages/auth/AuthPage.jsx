import { useCallback, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, ArrowLeft, ArrowRight, Loader2, Sparkles, Sun, Moon } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import API from "../../api/axios";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
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
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=900"
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
  const [devOtpMsg, setDevOtpMsg] = useState(""); // Holds phone OTP for testing environment visibility

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

  // Handle Firebase redirect Google sign-in result on mount
  useEffect(() => {
    let processed = false;
    const handleUserSession = async (user) => {
      if (processed) return;
      processed = true;
      setLoading(true);
      try {
        console.log("[GOOGLE DEBUG] Firebase user received:", user.email);
        console.log("[GOOGLE DEBUG] ID token generated");
        const idToken = await user.getIdToken(true);
        
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
      } catch (err) {
        console.error("[GOOGLE AUTH] Google session handler failed:", err);
        setError("Google authentication backend sync failed.");
      } finally {
        setLoading(false);
      }
    };

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
        let result;
        try {
          result = await signInWithPopup(auth, googleProvider);
        } catch (popupErr) {
          if (popupErr.code === "auth/popup-blocked") {
            console.log("[GOOGLE DEBUG] Popup blocked, falling back to redirect...");
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw popupErr;
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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDevOtpMsg("");

    try {
      if (authMethod === "phone") {
        const res = await API.post("/api/users/login-phone", { phone, password: phonePassword });
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

      const res = await API.post("/api/users/send-otp-email", { email });
      setOtpSentMessage(`We have sent a 6-digit verification code to your email: ${email}`);
      if (res.data.otp) {
        setDevOtpMsg(`Testing Code: ${res.data.otp}`);
      }
      setStep(2);
      setCountdown(30);
      setCanResend(false);
      setOtpValues(Array(6).fill(""));
    } catch (err) {
      setError(err.response?.data?.message || (authMethod === "phone" ? "Phone login failed. Please try again." : "Failed to send verification code. Please try again."));
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
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
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
    setDevOtpMsg("");
    try {
      const res = await API.post("/api/users/send-otp-email", { email });
      if (res.data.otp) {
        setDevOtpMsg(`Testing Code: ${res.data.otp}`);
      }
      setCountdown(30);
      setCanResend(false);
      setOtpValues(Array(6).fill(""));
    } catch {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-stretch sm:items-center justify-center bg-slate-50 dark:bg-slate-950 sm:px-4 sm:py-8 md:py-12 overflow-y-auto relative transition-colors duration-300">
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed left-4 top-4 z-20 w-10 h-10 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-lg sm:left-8 sm:top-8"
        title="Toggle Theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <button
        type="button"
        onClick={() => navigate("/user/menu", { replace: true })}
        className="fixed right-4 top-4 z-20 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-700 active:scale-95 sm:right-8 sm:top-8"
      >
        Skip
      </button>
      
      {/* Decorative Glow Backgrounds */}
      <div className="absolute top-0 left-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-[80px] md:blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-red-500/10 dark:bg-red-500/5 rounded-full blur-[80px] md:blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-none sm:shadow-[0_12px_40px_rgba(0,0,0,0.06)] border-0 sm:border border-gray-100 dark:border-slate-800/80 px-6 py-10 md:px-8 transition-all duration-300 z-10 flex flex-col justify-center min-h-screen sm:min-h-0">
        <div className="-mx-2 -mt-4 mb-7 overflow-hidden rounded-3xl h-40 relative bg-slate-100 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
          <AnimatePresence mode="wait">
            <MotionImg
              key={currentHeroSlide}
              src={loginSlides[currentHeroSlide]}
              alt="GreenGo food delivery"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white text-xl font-black tracking-tight">Fresh food, fast delivery</p>
            <div className="flex gap-1.5 mt-2">
              {loginSlides.map((_, index) => (
                <span key={index} className={`h-1.5 rounded-full transition-all ${currentHeroSlide === index ? "w-6 bg-brand-500" : "w-2 bg-white/60"}`} />
              ))}
            </div>
          </div>
        </div>
        
        {/* App Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4 hover:scale-105 transition-transform duration-300">
            <span className="text-3.5xl text-white">🍔</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
            GreenGo
          </h1>
          <p className="text-xs font-semibold text-orange-500 tracking-widest uppercase mt-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Delivering Happiness
          </p>
        </div>

        {/* Global Error Banner */}
        <AnimatePresence>
          {loginRequired && step === 1 && (
            <MotionDiv
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold leading-relaxed text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-300"
            >
              Sign in to securely access your orders and personal details.
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Global Error Banner */}
        <AnimatePresence>
          {error && (
            <MotionDiv
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-5 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm font-medium leading-relaxed"
            >
              {error}
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* STEP 1: Enter Email or Phone */}
        {step === 1 && (
          <div>
            {/* Header Text */}
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Sign in or create account</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                {authMethod === "phone" ? "Enter phone number and password" : "Enter your details to get verification code"}
              </p>
            </div>

            {/* Email / Phone Selection Tabs */}
            <div className="flex bg-gray-100 dark:bg-slate-950 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("email");
                  setError("");
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  authMethod === "email"
                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Continue with Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("phone");
                  setError("");
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  authMethod === "phone"
                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Phone className="w-3.5 h-3.5" /> Use Phone Number
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendOtp} className="space-y-5">
              {authMethod === "email" ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      required
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-all font-medium text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="flex gap-2.5">
                    {/* Country Code Selector (Zomato style +91) */}
                    <div className="px-3 py-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-sm font-bold text-gray-700 dark:text-slate-300 select-none flex items-center">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      placeholder="10-digit number"
                      value={phone}
                      required
                      pattern="^[0-9]{10}$"
                      title="Please enter a valid 10-digit phone number"
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-all font-bold tracking-wide text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2 pt-3">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={phonePassword}
                      required
                      minLength={6}
                      onChange={(e) => setPhonePassword(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-all font-bold tracking-wide text-gray-900 dark:text-white"
                    />
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500">
                      Password: min 6 chars with alphabet, number, special character.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit / Proceed */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold text-md shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-75 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> {authMethod === "phone" ? "Logging in..." : "Sending Code..."}
                  </>
                ) : (
                  <>
                    {authMethod === "phone" ? "Login with password" : "Send verification code"} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Separator */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold text-gray-400 dark:text-slate-500">
                <span className="bg-white dark:bg-slate-900 px-3">or continue with</span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950 hover:bg-gray-50 dark:hover:bg-slate-900/40 text-gray-700 dark:text-slate-200 font-bold text-sm shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-75"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            </div>
            
            <p className="text-center text-xxs font-medium text-gray-400 dark:text-slate-500 mt-8 leading-relaxed px-4">
              By continuing, you agree to our Terms of Service & Privacy Policy.
            </p>
          </div>
        )}

        {/* STEP 2: Enter OTP */}
        {step === 2 && (
          <div>
            {/* Header Text */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError("");
                  setDevOtpMsg("");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">OTP Verification</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                {otpSentMessage}
              </p>
            </div>

            {/* Developer/Testing Code Banner */}
            {devOtpMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-orange-500/10 dark:bg-orange-500/5 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold tracking-wider flex items-center justify-between">
                <span>Testing Code: <code className="ml-1 select-all bg-orange-100 dark:bg-orange-950 px-2 py-0.5 rounded font-black text-sm">{devOtpMsg.split(": ")[1]}</code></span>
                <span className="text-[10px] uppercase bg-orange-500 text-white px-2 py-0.5 rounded-full font-black">Local</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* OTP Input Grid (6 boxes) */}
              <div className="flex justify-between gap-2.5" onPaste={handleOtpPaste}>
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
                    className="w-11 h-13 md:w-12 md:h-14 text-center text-2xl font-black rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-gray-900 dark:text-white shadow-sm"
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold text-md shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-75 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                  </>
                ) : (
                  "Verify & Proceed"
                )}
              </button>

              {/* Resend Timer Options */}
              <div className="text-center text-sm font-semibold text-gray-500 dark:text-slate-400 pt-2">
                Didn't receive code?{" "}
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-orange-500 dark:text-orange-400 font-extrabold hover:underline"
                  >
                    Resend Code
                  </button>
                ) : (
                  <span className="text-gray-400 dark:text-slate-500">
                    Resend in {countdown}s
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}



import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { getApiUrl } from "../../utils/getApiUrl";
import { saveSession } from "../../utils/authStorage";

const maskToken = (token) => {
  if (!token) return "none";
  return `${token.slice(0, 12)}...${token.slice(-8)}`;
};

const debugAlert = (message) => {
  console.log(message);
};

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/api/users/register", form);
      alert("Registration successful! You can now login.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if (data && data.display_name) {
          setForm((prev) => ({ ...prev, address: data.display_name }));
        } else {
          setForm((prev) => ({ ...prev, address: `Lat: ${latitude}, Lng: ${longitude}` }));
        }
      } catch (err) {
        setForm((prev) => ({ ...prev, address: `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}` }));
      }
    }, () => {
      alert("Unable to retrieve your location. Please check your browser permissions.");
    });
  };

  useEffect(() => {
    console.log("[REGISTER DEBUG] Resolved API URL on load is: ", getApiUrl());

    let processed = false;

    const handleUserSession = async (user) => {
      if (processed) return;
      processed = true;
      setLoading(true);
      try {
        const idToken = await user.getIdToken(true);
        console.log("[REGISTER GOOGLE AUTH] Firebase ID Token obtained: ", idToken ? "Exists" : "Empty");
        
        const res = await API.post("/api/users/google-login", { idToken });
        console.log("[REGISTER GOOGLE AUTH] Backend google-login response status:", res.status);
        const data = res.data;
        
        localStorage.setItem("token", data.token);
        try {
          const meRes = await API.get("/api/users/me");
          await saveSession(data.token, meRes.data);
        } catch (meErr) {
          await saveSession(data.token, { email: user.email, role: data.role });
        }
        
        if (data.role === "admin") navigate("/admin");
        else navigate("/user/menu");
      } catch (err) {
        console.error("[REGISTER GOOGLE AUTH] Google session handler failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const checkRedirect = async () => {
      console.log("[REGISTER GOOGLE AUTH] Checking redirect result...");
      try {
        const redirectPromise = getRedirectResult(auth);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Firebase Redirect Timeout")), 4000)
        );
        const result = await Promise.race([redirectPromise, timeoutPromise]);
        console.log("[REGISTER GOOGLE AUTH] getRedirectResult returned:", result);
        if (result && result.user) {
          await handleUserSession(result.user);
        } else if (auth.currentUser) {
          await handleUserSession(auth.currentUser);
        }
      } catch (err) {
        console.error("[REGISTER GOOGLE AUTH] Google redirect sign in failed or timed out:", err);
        if (auth.currentUser) {
          await handleUserSession(auth.currentUser);
        }
      }
    };

    // Listen for state change in case currentUser is populated asynchronously
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("[REGISTER GOOGLE AUTH] onAuthStateChanged detected user:", user.email);
        await handleUserSession(user);
      }
    });

    checkRedirect();

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      debugAlert(`[ANDROID AUTH DEBUG] Starting Register Google sign-in\nAPI URL: ${getApiUrl()}\nCurrent Firebase user: ${auth.currentUser ? auth.currentUser.email : "none"}`);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (window.Capacitor || isMobile) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        try {
          result = await signInWithPopup(auth, googleProvider);
        } catch (popupErr) {
          console.log("[GOOGLE AUTH] Popup failed or blocked, falling back to redirect...", popupErr);
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        const user = result.user;
        
        // Get Firebase ID Token
        const idToken = await user.getIdToken();
        
        const res = await API.post("/api/users/google-login", { idToken });
        const data = res.data;
        
        localStorage.setItem("token", data.token);
        try {
          const meRes = await API.get("/api/users/me");
          await saveSession(data.token, meRes.data);
        } catch (meErr) {
          await saveSession(data.token, { email: user.email, role: data.role });
        }
        
        if (data.role === "admin") navigate("/admin");
        else navigate("/user/menu");
      }
    } catch (err) {
      console.error("Google sign in failed:", err);
      alert(err.response?.data?.message || err.message || "Google Sign-In failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-transparent px-4 py-10 overflow-hidden relative">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative w-full max-w-xl z-10">
        
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-xl shadow-orange-500/30 mb-4 hover:scale-105 transition-transform">
            <span className="text-3xl text-white">🍔</span>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">GreenGo</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-2">Join us and start ordering premium food today!</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 dark:border-slate-800 px-8 py-10">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">Create an Account</h2>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input type="text" name="name" required onChange={handleChange} placeholder="John Doe"
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <input type="email" name="email" required onChange={handleChange} placeholder="john@example.com"
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-900 dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <input type="password" name="password" required onChange={handleChange} placeholder="••••••••"
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                <input type="text" name="phone" required onChange={handleChange} placeholder="9876543210"
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-900 dark:text-white" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Delivery Address</label>
                <button type="button" onClick={useCurrentLocation} className="text-xs text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-950/40 px-3 py-1.5 rounded-lg font-bold hover:bg-orange-100 dark:hover:bg-orange-900/60 flex items-center gap-1.5 transition-colors border border-orange-100 dark:border-orange-900/40">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> 
                  Use Current Location
                </button>
              </div>
              <textarea name="address" required value={form.address} onChange={handleChange} placeholder="Full address for delivery..." rows={3}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-900 dark:text-white resize-none" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-orange-500/30">
              {loading ? "Creating Account..." : "Create Account →"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-bold text-gray-400">
              <span className="bg-white dark:bg-slate-900 px-3">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950 hover:bg-gray-50 dark:hover:bg-slate-900 text-gray-700 dark:text-slate-200 font-bold text-sm shadow-sm flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70"
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
            Continue with Google
          </button>

          <p className="text-center text-sm font-medium text-gray-500 dark:text-slate-400 mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-orange-600 dark:text-orange-500 font-bold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


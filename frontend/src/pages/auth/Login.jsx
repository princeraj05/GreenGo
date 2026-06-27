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

const sanitizeBody = (body) => {
  if (!body || typeof body !== "object") return body;
  return {
    ...body,
    token: body.token ? maskToken(body.token) : body.token,
    idToken: body.idToken ? maskToken(body.idToken) : body.idToken,
    password: body.password ? "***" : body.password,
  };
};

const debugAlert = (message) => {
  console.log(message);
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log(`[LOGIN PROCESS] Attempting login for ${email} using endpoint ${getApiUrl()}/api/users/login`);
    try {
      debugAlert(`[ANDROID AUTH DEBUG] API URL: ${getApiUrl()}\nEmail login request: POST ${getApiUrl()}/api/users/login`);
      const res = await API.post("/api/users/login", {
        email,
        password,
      });

      const data = res.data;
      console.log(`[LOGIN PROCESS] Success. Response status: ${res.status} | Role: ${data.role}`);
      debugAlert(`[ANDROID AUTH DEBUG] Login response status: ${res.status}\nLogin response body: ${JSON.stringify(sanitizeBody(data))}\nJWT received: ${data.token ? "yes" : "no"}`);
      
      try {
        localStorage.setItem("token", data.token);
        const meRes = await API.get("/api/users/me");
        await saveSession(data.token, meRes.data);
        console.log(`[LOGIN PROCESS] Token and user data successfully stored persistently.`);
        debugAlert(`[ANDROID AUTH DEBUG] Session persistence write: success`);
      } catch (storageErr) {
        console.error(`[LOGIN PROCESS] Token storage or protected-route verification failed:`, storageErr);
        await saveSession(data.token, { email, role: data.role });
      }

      if (data.role === "admin") {
        console.log(`[LOGIN PROCESS] Navigating to /admin`);
        navigate("/admin");
      } else {
        console.log(`[LOGIN PROCESS] Navigating to /user/menu`);
        navigate("/user/menu");
      }

    } catch (err) {
      console.error(`[LOGIN PROCESS] Login failed:`, err);
      const errorDetail = {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        configUrl: err.config?.url,
        configBaseUrl: err.config?.baseURL,
      };
      alert(`Login Failed Details:\nURL: ${errorDetail.configBaseUrl || ""}${errorDetail.configUrl || ""}\nHTTP Status: ${errorDetail.status || "none"}\nError Message: ${errorDetail.message}\nResponse Body: ${JSON.stringify(errorDetail.data || {})}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Log resolved API URL immediately on mount
    console.log("[DEBUG] Resolved API URL on load is: ", getApiUrl());

    let processed = false;

    const handleUserSession = async (user) => {
      if (processed) return;
      processed = true;
      setLoading(true);
      try {
        const idToken = await user.getIdToken(true);
        console.log("[GOOGLE AUTH] Firebase ID Token obtained: ", idToken ? "Exists" : "Empty");
        
        const res = await API.post("/api/users/google-login", { idToken });
        console.log("[GOOGLE AUTH] Backend google-login response status:", res.status);
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
        console.error("[GOOGLE AUTH] Google session handler failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const checkRedirect = async () => {
      console.log("[GOOGLE AUTH] Checking redirect result...");
      try {
        const redirectPromise = getRedirectResult(auth);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Firebase Redirect Timeout")), 4000)
        );
        const result = await Promise.race([redirectPromise, timeoutPromise]);
        console.log("[GOOGLE AUTH] getRedirectResult returned:", result);
        if (result && result.user) {
          await handleUserSession(result.user);
        } else if (auth.currentUser) {
          await handleUserSession(auth.currentUser);
        }
      } catch (err) {
        console.error("[GOOGLE AUTH] Google redirect sign in failed or timed out:", err);
        if (auth.currentUser) {
          await handleUserSession(auth.currentUser);
        }
      }
    };

    // Listen for state change in case currentUser is populated asynchronously
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("[GOOGLE AUTH] onAuthStateChanged detected user:", user.email);
        await handleUserSession(user);
      }
    });

    checkRedirect();

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      debugAlert(`[ANDROID AUTH DEBUG] Starting Google sign-in\nAPI URL: ${getApiUrl()}\nCurrent Firebase user: ${auth.currentUser ? auth.currentUser.email : "none"}`);
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
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative w-full max-w-md z-10">

        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-brand-500/30 mb-4 hover:scale-105 transition-transform overflow-hidden border border-brand-100 dark:border-brand-900">
            <img src="/greengo-logo.png" alt="GreenGo" className="w-full h-full object-cover" />
          </Link>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">GreenGo</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-2">Welcome back! Sign in to continue</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 dark:border-slate-800 px-8 py-10">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-5">

            <div className="group">
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-orange-600 dark:text-orange-500 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-orange-500/30"
            >
              {loading ? "Signing in..." : "Sign In →"}
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
            Don't have an account?{" "}
            <Link to="/register" className="text-orange-600 dark:text-orange-500 font-bold hover:underline">
              Create one for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


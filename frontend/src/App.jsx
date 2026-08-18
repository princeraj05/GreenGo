import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Network } from "@capacitor/network";
import { SplashScreen } from "@capacitor/splash-screen";
import { jwtDecode } from "jwt-decode";
import API from "./api/axios";
import { restoreSession, clearSession } from "./utils/authStorage";
import PlayStoreBanner from "./components/PlayStoreBanner";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnected, setIsConnected] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [customAlert, setCustomAlert] = useState(null);
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const [animationCompleted, setAnimationCompleted] = useState(false);

  // Hide native splash screen as soon as React component mounts to reveal the animated Launch Screen
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch((err) => console.log("Splashscreen hide error", err));
    }
  }, []);

  // Handle launch screen minimum display duration for the animation (2 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationCompleted(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Handle launch screen fade-out and destruction
  useEffect(() => {
    if (!checkingAuth && animationCompleted) {
      const fadeTimer = setTimeout(() => {
        setShowLaunchScreen(false);
      }, 500); // matches the .animate-splash-fadeout animation duration of 0.5s
      return () => clearTimeout(fadeTimer);
    }
  }, [checkingAuth, animationCompleted]);
  
  // Override window.alert globally
  useEffect(() => {
    window.alert = (message) => {
      setCustomAlert({ message });
    };
  }, []);

  const isGuestUserPath = (path) => {
    return path.startsWith("/user");
  };

  // Check auth and restore session on mount
  useEffect(() => {
    const initAuth = async () => {
      if (window.diagnostics) {
        window.diagnostics.addLog("App: initAuth started");
      }
      const session = await restoreSession();
      if (session && session.token) {
        if (window.diagnostics) {
          window.diagnostics.addLog("App: Stored token found, verifying with /api/users/me");
        }

        // Optimistic UI: Use offline cached role/decoded token to render the page instantly
        let offlineRole = session.userData?.role;
        if (!offlineRole) {
          try {
            const decoded = jwtDecode(session.token);
            offlineRole = decoded.role;
          } catch (e) {
            console.error("App: Failed to decode token offline", e);
          }
        }

        if (offlineRole) {
          if (
            location.pathname === "/" ||
            location.pathname === "/login" ||
            location.pathname === "/register"
          ) {
            if (offlineRole === "admin") {
              navigate("/admin", { replace: true });
            } else {
              navigate("/user/menu", { replace: true });
            }
          }
          setCheckingAuth(false);
          if (Capacitor.isNativePlatform()) {
            SplashScreen.hide().catch((err) => console.log("Splashscreen hide error", err));
          }
        }

        try {
          const res = await API.get("/api/users/me");
          const userData = res.data;
          const role = userData.role;
          if (window.diagnostics) {
            window.diagnostics.addLog(`App: Session verified. Role = ${role}`);
          }
          if (
            location.pathname === "/" ||
            location.pathname === "/login" ||
            location.pathname === "/register"
          ) {
            if (role === "admin") {
              navigate("/admin", { replace: true });
            } else {
              navigate("/user/menu", { replace: true });
            }
          }
          // Update cached user data
          localStorage.setItem("user_data", JSON.stringify(userData));
        } catch (err) {
          console.error("App: Session verification failed:", err);
          if (window.diagnostics) {
            window.diagnostics.addError(`App: Verification failed: ${err.message}`);
          }
          // If server explicitly returns 401 or 403, clear the session
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            await clearSession();
            setCheckingAuth(true); // Show loader before redirecting
            if ((location.pathname.startsWith("/user") && !isGuestUserPath(location.pathname)) || location.pathname.startsWith("/admin")) {
              navigate("/", { replace: true, state: { from: location, loginRequired: true } });
            }
          }
        }
      } else {
        if (window.diagnostics) {
          window.diagnostics.addLog("App: No session token found");
        }
        if ((location.pathname.startsWith("/user") && !isGuestUserPath(location.pathname)) || location.pathname.startsWith("/admin")) {
          navigate("/", { replace: true, state: { from: location, loginRequired: true } });
        }
      }

      setCheckingAuth(false);
      if (Capacitor.isNativePlatform()) {
        SplashScreen.hide().catch((err) => console.log("Splashscreen hide error", err));
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (window.diagnostics) {
      window.diagnostics.addLog(`Entering Route Path: "${location.pathname}"`);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Handle Android back button
      const backButtonListener = CapApp.addListener("backButton", () => {
        const currentPath = location.pathname;
        const searchParams = new URLSearchParams(location.search);
        
        if (currentPath === "/admin/contacts" && searchParams.has("chat")) {
          // If support chat is open on mobile, back button should close it first
          navigate("/admin/contacts", { replace: true });
        } else if (
          currentPath === "/" ||
          currentPath === "/user" ||
          currentPath === "/admin" ||
          currentPath === "/login"
        ) {
          CapApp.exitApp();
        } else {
          navigate(-1);
        }
      });

      // Monitor network connection
      Network.getStatus().then((status) => {
        setIsConnected(status.connected);
      });

      const networkListener = Network.addListener("networkStatusChange", (status) => {
        setIsConnected(status.connected);
      });

      return () => {
        backButtonListener.then((l) => l.remove());
        networkListener.then((l) => l.remove());
      };
    }
  }, [location, navigate]);

  return (
    <>
      {!checkingAuth && <AppRoutes />}
      <PlayStoreBanner />

      {showLaunchScreen && (
        <div className={`fixed inset-0 bg-[#1faf38] flex flex-col items-center justify-center p-6 text-center text-white z-[99999] ${(!checkingAuth && animationCompleted) ? "animate-splash-fadeout" : ""}`}>
          <h1 className="animate-appname text-5xl font-black tracking-tight text-white mb-2 font-sans">
            GreenGo
          </h1>
          <p className="animate-tagline text-white/85 text-xs font-bold tracking-widest uppercase font-sans">
            Delivering Happiness
          </p>
        </div>
      )}
      
      {/* Premium Custom Alert Modal */}
      {customAlert && (() => {
        const details = (() => {
          const text = (customAlert.message || "").toLowerCase();
          if (text.includes("success") || text.includes("approved") || text.includes("applied") || text.includes("copied") || text.includes("sent") || text.includes("completed")) {
            return {
              icon: "🎉",
              title: "Success",
              gradient: "from-emerald-500/10 to-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
              btnGradient: "from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/25 active:scale-[0.98]"
            };
          }
          if (text.includes("fail") || text.includes("error") || text.includes("unable") || text.includes("exceeds") || text.includes("invalid") || text.includes("not supported") || text.includes("required") || text.includes("empty") || text.includes("exceed")) {
            return {
              icon: "⚠️",
              title: "Alert",
              gradient: "from-rose-500/10 to-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20",
              btnGradient: "from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-rose-500/25 active:scale-[0.98]"
            };
          }
          return {
            icon: "🔔",
            title: "Notification",
            gradient: "from-brand-500/10 to-brand-500/20 text-brand-600 dark:text-brand-400 border-brand-500/20",
            btnGradient: "from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 shadow-brand-500/25 active:scale-[0.98]"
          };
        })();

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 font-sans animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center transform scale-100 transition-all duration-300">
              {/* Animated Header Icon container */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${details.gradient} border flex items-center justify-center text-3xl mb-4 shadow-inner animate-bounce`}>
                {details.icon}
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                {details.title}
              </h3>
              
              {/* Message */}
              <div className="max-h-[300px] overflow-y-auto px-1 mb-6">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold leading-relaxed whitespace-pre-line">
                  {customAlert.message}
                </p>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => setCustomAlert(null)}
                className={`w-full py-3.5 px-6 rounded-xl bg-gradient-to-r ${details.btnGradient} text-white font-black text-sm tracking-wide shadow-lg transition-all duration-200 outline-none`}
              >
                Okay
              </button>
            </div>
          </div>
        );
      })()}

      {/* Premium Offline blocking UI */}
      {!isConnected && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg z-[9999] flex flex-col items-center justify-center p-6 text-center text-white animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-4xl mb-6 shadow-xl shadow-brand-500/5 animate-pulse">
            📶
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">No Internet Connection</h2>
          <p className="text-slate-400 max-w-xs text-sm font-medium leading-relaxed">
            GreenGo requires an active internet connection. Please verify your Wi-Fi or cellular data settings.
          </p>
        </div>
      )}
    </>
  );
}


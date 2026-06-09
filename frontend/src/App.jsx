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

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnected, setIsConnected] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const isGuestUserPath = (path) => path === "/user" || path === "/user/menu";

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
        } catch (err) {
          console.error("App: Session verification failed:", err);
          if (window.diagnostics) {
            window.diagnostics.addError(`App: Verification failed: ${err.message}`);
          }
          // If server explicitly returns 401 or 403, clear the session
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            await clearSession();
            if ((location.pathname.startsWith("/user") && !isGuestUserPath(location.pathname)) || location.pathname.startsWith("/admin")) {
              navigate("/", { replace: true, state: { from: location, loginRequired: true } });
            }
          } else {
            // Network error/offline: allow offline session restoration using decoded JWT role
            try {
              const decoded = jwtDecode(session.token);
              if (window.diagnostics) {
                window.diagnostics.addLog("App: Server offline, decoded role from JWT offline");
              }
              if (
                location.pathname === "/" ||
                location.pathname === "/login" ||
                location.pathname === "/register"
              ) {
                if (decoded.role === "admin") {
                  navigate("/admin", { replace: true });
                } else {
                  navigate("/user/menu", { replace: true });
                }
              }
            } catch {
              await clearSession();
              if ((location.pathname.startsWith("/user") && !isGuestUserPath(location.pathname)) || location.pathname.startsWith("/admin")) {
                navigate("/", { replace: true, state: { from: location, loginRequired: true } });
              }
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
  }, [navigate, location]);

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
        // Exit app if the user is on the main entry/dashboard screens
        if (currentPath === "/" || currentPath === "/user" || currentPath === "/admin" || currentPath === "/login") {
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

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white z-[99999]">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-300 flex items-center justify-center text-5xl shadow-xl shadow-brand-500/25 animate-bounce">
            🍔
          </div>
          <div className="absolute -inset-1 bg-gradient-to-br from-brand-500 to-brand-300 rounded-3xl blur opacity-30 animate-pulse -z-10"></div>
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-brand-500 to-brand-300 bg-clip-text text-transparent">
          ByteBite
        </h1>
        <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-8">
          Delivering Happiness
        </p>
        <div className="flex items-center gap-2.5 text-slate-400 text-xs font-bold bg-slate-900 px-4.5 py-2.5 rounded-full border border-slate-800 shadow-lg">
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          Restoring Session...
        </div>
      </div>
    );
  }

  return (
    <>
      <AppRoutes />
      
      {/* Premium Offline blocking UI */}
      {!isConnected && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg z-[9999] flex flex-col items-center justify-center p-6 text-center text-white animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-4xl mb-6 shadow-xl shadow-brand-500/5 animate-pulse">
            📶
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">No Internet Connection</h2>
          <p className="text-slate-400 max-w-xs text-sm font-medium leading-relaxed">
            ByteBite requires an active internet connection. Please verify your Wi-Fi or cellular data settings.
          </p>
        </div>
      )}
    </>
  );
}

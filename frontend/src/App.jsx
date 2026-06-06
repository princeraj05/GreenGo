import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Network } from "@capacitor/network";
import { SplashScreen } from "@capacitor/splash-screen";


export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (window.diagnostics) {
      window.diagnostics.addLog(`Entering Route Path: "${location.pathname}"`);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Dismiss native splash screen on app load
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch((err) => console.log("Splashscreen hide error", err));

      // Handle Android back button
      const backButtonListener = CapApp.addListener("backButton", (event) => {
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
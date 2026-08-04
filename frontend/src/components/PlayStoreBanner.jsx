import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { X } from "lucide-react";

export default function PlayStoreBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const dismissalKey = "play_store_banner_dismiss";

  const logAnalytics = (event) => {
    console.log(`[PlayStoreBanner Analytics]: ${event}`);
    if (window.diagnostics && typeof window.diagnostics.addLog === "function") {
      window.diagnostics.addLog(`PlayStoreBanner: ${event}`);
    }
  };

  const checkDismissed = () => {
    const raw = localStorage.getItem(dismissalKey);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      if (data && data.dismissed && data.timestamp) {
        const diff = Date.now() - data.timestamp;
        const cooldown = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        if (diff < cooldown) {
          return true; // Still within the 7 days cooldown period
        }
      }
    } catch (e) {
      console.error("Error parsing banner dismissal cache", e);
    }
    return false;
  };

  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isNative = Capacitor.isNativePlatform();
    const isPWA = window.matchMedia("(display-mode: standalone)").matches;
    const isDismissed = checkDismissed();

    // Show only on Android mobile web browsers (not iOS, desktop, Capacitor app, PWA, or recently dismissed)
    if (isAndroid && !isNative && !isPWA && !isDismissed) {
      logAnalytics("Banner Viewed");

      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsVisible(false);
    logAnalytics("Banner Closed");
    try {
      localStorage.setItem(
        dismissalKey,
        JSON.stringify({
          dismissed: true,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.error("Error saving banner dismissal cache", e);
    }
  };

  const handleOpenApp = () => {
    logAnalytics("Open App Clicked");
    const intentUrl =
      "intent://#Intent;scheme=com.greengo.india;package=com.greengo.india;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.greengo.india;end";
    logAnalytics("Redirecting to Play Store / Deep Link");
    window.location.href = intentUrl;
  };

  // Render nothing if hidden
  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-[9999] bg-slate-950/95 backdrop-blur-xl border border-slate-800 text-white rounded-3xl p-4 shadow-2xl transition-all duration-500 ease-out flex items-center justify-between gap-4 ${
        isVisible ? "translate-y-0 opacity-100 animate-fade-in" : "translate-y-20 opacity-0 pointer-events-none"
      }`}
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors p-1.5 rounded-full hover:bg-slate-900 focus:outline-none"
        aria-label="Dismiss banner"
      >
        <X size={16} />
      </button>

      {/* Info Group */}
      <div className="flex items-center gap-3 pr-4">
        {/* App Logo */}
        <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white border border-slate-800 flex items-center justify-center shadow-lg flex-shrink-0">
          <img
            src="/logo/final-logo.png"
            alt="GreenGo Logo"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              e.target.style.display = "none";
              e.target.parentNode.innerHTML = "<span class='text-brand-500 font-extrabold text-lg font-sans'>GG</span>";
            }}
          />
        </div>

        {/* Text Details */}
        <div className="flex flex-col">
          <h4 className="text-sm font-black tracking-tight text-white font-sans">
            GreenGo App
          </h4>
          <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-0.5 leading-snug font-sans">
            Order food faster & smoother
          </p>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleOpenApp}
        className="flex items-center gap-1.5 py-2.5 px-4 bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 text-white font-black text-xs tracking-wider rounded-2xl shadow-lg shadow-brand-500/20 active:scale-95 transition-all outline-none font-sans whitespace-nowrap"
        aria-label="Open GreenGo App"
      >
        {/* Official Google Play Icon SVG */}
        <svg viewBox="0 0 360 360" className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor">
          <path
            d="M40.9,13.6C37.8,17,36,22.2,36,28.8v302.4c0,6.6,1.8,11.8,4.9,15.2L42.5,348L213.9,176.6V174L42.5,12L40.9,13.6z"
            fill="#00c0ff"
          />
          <path
            d="M272.2,234.9l-58.3-58.3v-2.6l58.3-58.3l1.8,1c17,9.7,26.7,25.6,26.7,44.7c0,19.1-9.7,35-26.7,44.7L272.2,234.9z"
            fill="#ffc107"
          />
          <path
            d="M215.7,174.1L42.5,347.3c5.6,5.6,14.8,6.3,25.2,0.4l206.3-117.8L215.7,174.1z"
            fill="#ff3a44"
          />
          <path
            d="M215.7,185.9l58.2-33.2L67.7,12.7c-10.4-5.9-19.6-5.2-25.2,0.4L215.7,185.9z"
            fill="#00e676"
          />
        </svg>
        <span>Open App</span>
      </button>
    </div>
  );
}

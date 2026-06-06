import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Network } from "@capacitor/network";
import { SplashScreen } from "@capacitor/splash-screen";

function VisualDiagnostics() {
  const [data, setData] = useState(() => {
    return window.diagnostics ? { ...window.diagnostics } : { logs: [], errors: [] };
  });
  const [showFull, setShowFull] = useState(true);

  useEffect(() => {
    window.updateDiagnosticsUI = () => {
      if (window.diagnostics) {
        setData({
          logs: [...window.diagnostics.logs],
          errors: [...window.diagnostics.errors],
          userLayoutMounted: window.diagnostics.userLayoutMounted,
          adminLayoutMounted: window.diagnostics.adminLayoutMounted,
          userDashboardMounted: window.diagnostics.userDashboardMounted,
          adminDashboardMounted: window.diagnostics.adminDashboardMounted,
          currentRoute: window.location.pathname + window.location.hash,
          tokenExists: !!localStorage.getItem("token"),
          userObject: window.diagnostics.userObject,
          loadingState: window.diagnostics.loadingState
        });
      }
    };
    // Initial update
    window.updateDiagnosticsUI();
    return () => {
      window.updateDiagnosticsUI = null;
    };
  }, []);

  if (!window.diagnostics) return null;

  if (!showFull) {
    return (
      <button 
        onClick={() => setShowFull(true)}
        style={{
          position: "fixed",
          bottom: "10px",
          right: "10px",
          zIndex: 99999,
          background: "#ef4444",
          color: "white",
          border: "none",
          padding: "10px 16px",
          borderRadius: "8px",
          fontWeight: "bold",
          fontSize: "12px",
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)"
        }}
      >
        🔍 Show Diagnostics ({data.errors.length} errs)
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(239, 68, 68, 0.98)", // Bright red full screen overlay as requested
      color: "white",
      fontFamily: "monospace",
      fontSize: "11px",
      zIndex: 99999, // On top of everything
      overflowY: "auto",
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid white", paddingBottom: "10px", marginBottom: "15px" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "900" }}>🚨 WebView Diagnostics Overlay</h2>
        <button 
          onClick={() => setShowFull(false)}
          style={{ background: "white", color: "#ef4444", border: "none", padding: "6px 12px", fontWeight: "bold", borderRadius: "6px", cursor: "pointer" }}
        >
          Hide Overlay
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "15px" }}>
        <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px" }}>
          <strong>📍 Pathname:</strong> <span style={{ background: "black", padding: "3px 6px", borderRadius: "4px" }}>{data.currentRoute}</span>
        </div>
        <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px" }}>
          <strong>🔑 Token:</strong> <span style={{ background: "black", padding: "3px 6px", borderRadius: "4px" }}>{data.tokenExists ? "YES" : "NO"}</span>
        </div>
        <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px" }}>
          <strong>🔄 Loading State:</strong> <span style={{ background: "blue", padding: "3px 6px", borderRadius: "4px", fontWeight: "bold" }}>{data.loadingState}</span>
        </div>
        <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px" }}>
          <strong>🏗️ Mount Statuses:</strong>
          <ul style={{ margin: "5px 0 0 0", paddingLeft: "20px", lineHeight: "1.6" }}>
            <li>UserLayout: <span style={{ color: data.userLayoutMounted === "YES" ? "#4ade80" : "yellow", fontWeight: "bold" }}>{data.userLayoutMounted}</span></li>
            <li>AdminLayout: <span style={{ color: data.adminLayoutMounted === "YES" ? "#4ade80" : "yellow", fontWeight: "bold" }}>{data.adminLayoutMounted}</span></li>
            <li>UserDashboard: <span style={{ color: data.userDashboardMounted === "YES" ? "#4ade80" : "yellow", fontWeight: "bold" }}>{data.userDashboardMounted}</span></li>
            <li>AdminDashboard: <span style={{ color: data.adminDashboardMounted === "YES" ? "#4ade80" : "yellow", fontWeight: "bold" }}>{data.adminDashboardMounted}</span></li>
          </ul>
        </div>
        <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px" }}>
          <strong>👤 Current User Object:</strong> 
          <pre style={{ margin: "5px 0 0 0", background: "black", padding: "8px", borderRadius: "6px", overflowX: "auto", maxHeight: "120px", fontSize: "10px" }}>
            {typeof data.userObject === "object" ? JSON.stringify(data.userObject, null, 2) : String(data.userObject)}
          </pre>
        </div>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <strong style={{ color: "#fca5a5", fontSize: "12px" }}>❌ Uncaught / Caught Errors ({data.errors.length}):</strong>
        {data.errors.length === 0 ? (
          <div style={{ color: "#4ade80", fontStyle: "italic", marginTop: "5px" }}>None detected.</div>
        ) : (
          <div style={{ background: "black", padding: "10px", borderRadius: "8px", marginTop: "5px", maxHeight: "150px", overflowY: "auto" }}>
            {data.errors.map((err, i) => (
              <div key={i} style={{ borderBottom: "1px solid #334155", padding: "6px 0", color: "#f87171", wordBreak: "break-all" }}>
                {err}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <strong>📜 Render Log Steps ({data.logs.length}):</strong>
        <div style={{ background: "black", padding: "10px", borderRadius: "8px", marginTop: "5px", maxHeight: "200px", overflowY: "auto" }}>
          {data.logs.map((log, i) => (
            <div key={i} style={{ borderBottom: "1px solid #1e293b", padding: "4px 0", color: "#cbd5e1" }}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      <VisualDiagnostics />
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
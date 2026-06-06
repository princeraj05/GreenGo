import React, { Component } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import './index.css'

// Initialize global diagnostics store
window.diagnostics = {
  logs: [`[LOG] App initializing at ${new Date().toLocaleTimeString()}`],
  errors: [],
  userLayoutMounted: "NO",
  adminLayoutMounted: "NO",
  userDashboardMounted: "NO",
  adminDashboardMounted: "NO",
  currentRoute: window.location.pathname + window.location.hash,
  tokenExists: !!localStorage.getItem("token"),
  userObject: "none",
  loadingState: "Init",
  addLog(msg) {
    console.log(`[DIAG_LOG] ${msg}`);
    this.logs.push(`[LOG] ${msg}`);
    if (window.updateDiagnosticsUI) {
      window.updateDiagnosticsUI();
    }
  },
  addError(err) {
    console.error(`[DIAG_ERR] ${err}`);
    this.errors.push(`[ERR] ${err}`);
    if (window.updateDiagnosticsUI) {
      window.updateDiagnosticsUI();
    }
  }
};

// Global error catching for debugging on Android WebView (logs directly to HTML DOM overlay)
window.onerror = function (message, source, lineno, colno, error) {
  const errMsg = `${message} (at ${source}:${lineno}:${colno})${error ? '\nStack: ' + error.stack : ''}`;
  window.diagnostics.addError(errMsg);
  return false;
};

window.onunhandledrejection = function (event) {
  const reason = event.reason;
  const errMsg = `Unhandled Rejection: ${reason ? (reason.stack || reason.message || JSON.stringify(reason)) : event}`;
  window.diagnostics.addError(errMsg);
};

// Premium Error Boundary Component to prevent silent black screens
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo
    });
    const errorMsg = `React Error Boundary: ${error?.message || error}\nComponent Stack: ${errorInfo?.componentStack}`;
    window.diagnostics.addError(errorMsg);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "24px",
          background: "#0f172a",
          color: "#f8fafc",
          fontFamily: "monospace",
          height: "100vh",
          overflow: "auto",
          boxSizing: "border-box"
        }}>
          <h1 style={{ color: "#ef4444", fontSize: "22px", margin: "0 0 12px 0", fontWeight: "900" }}>⚠️ Application Render Crash</h1>
          <p style={{ margin: "0 0 20px 0", color: "#94a3b8", fontSize: "14px" }}>React intercepted a rendering failure. Error details:</p>
          <pre style={{
            background: "#020617",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #1e293b",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            fontSize: "12px",
            lineHeight: "1.5"
          }}>
            {this.state.error?.toString()}
            {"\n\nComponent Stack:\n"}
            {this.state.errorInfo?.componentStack}
          </pre>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              background: "#ff6233",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(255, 98, 51, 0.3)"
            }}
          >
            Clear LocalStorage & Restart
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </BrowserRouter>
);
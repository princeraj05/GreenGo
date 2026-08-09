import React, { Component } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import './index.css'

// Global diagnostics store is initialized inline in index.html to capture bundle parse/syntax exceptions.
if (window.diagnostics) {
  window.diagnostics.reactStarted = true;
}

// Premium Error Boundary Component to prevent silent black screens
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  componentDidMount() {
    window.sessionStorage.removeItem("chunk-load-failed-refreshed");
  }

  componentDidCatch(error, errorInfo) {
    const errorMsg = error?.message || "";
    const isChunkError = 
      error?.name === "ChunkLoadError" ||
      errorMsg.includes("Failed to fetch dynamically imported module") ||
      errorMsg.includes("failed to load module script") ||
      errorMsg.includes("Loading chunk");

    if (isChunkError) {
      const hasRefreshed = window.sessionStorage.getItem("chunk-load-failed-refreshed") === "true";
      if (!hasRefreshed) {
        window.sessionStorage.setItem("chunk-load-failed-refreshed", "true");
        window.location.reload();
        return;
      }
    }

    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo
    });
    const logMsg = `React Error Boundary: ${error?.message || error}\nComponent Stack: ${errorInfo?.componentStack}`;
    if (window.diagnostics && typeof window.diagnostics.addError === "function") {
      window.diagnostics.addError(logMsg);
    }
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
      <LanguageProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </LanguageProvider>
    </ThemeProvider>
  </BrowserRouter>
);
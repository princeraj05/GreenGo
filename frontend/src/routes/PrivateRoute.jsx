import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {

  const token = localStorage.getItem("token");

  if (window.diagnostics) {
    window.diagnostics.addLog(`PrivateRoute: Token read from localStorage: ${token ? "found" : "not found"}`);
  }

  if (!token) {
    if (window.diagnostics) {
      window.diagnostics.addLog(`PrivateRoute: Redirecting to /login`);
    }
    return <Navigate to="/login" />;
  }

  if (window.diagnostics) {
    window.diagnostics.addLog(`PrivateRoute: Token found, rendering child routes`);
  }
  return children;
}
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {

  const token = localStorage.getItem("token");
  const authState = localStorage.getItem("auth_state");

  if (window.diagnostics) {
    window.diagnostics.addLog(`PrivateRoute: Token: ${token ? "found" : "not found"}, AuthState: ${authState}`);
  }

  if (!token || authState !== "logged_in") {
    if (window.diagnostics) {
      window.diagnostics.addLog(`PrivateRoute: Redirecting to /login`);
    }
    return <Navigate to="/login" replace />;
  }

  if (window.diagnostics) {
    window.diagnostics.addLog(`PrivateRoute: Token found, rendering child routes`);
  }
  return children;
}
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function AdminRoute({ children }) {

  const token = localStorage.getItem("token");

  if (window.diagnostics) {
    window.diagnostics.addLog(`AdminRoute: Token read from localStorage: ${token ? "found" : "not found"}`);
  }

  // Agar token nahi hai → login page
  if (!token) {
    if (window.diagnostics) {
      window.diagnostics.addLog(`AdminRoute: No token found. Redirecting to /login`);
    }
    return <Navigate to="/login" replace />;
  }

  try {
    if (window.diagnostics) {
      window.diagnostics.addLog(`AdminRoute: Attempting to decode JWT token...`);
    }
    const decoded = jwtDecode(token);

    if (window.diagnostics) {
      window.diagnostics.addLog(`AdminRoute: Decoded role = "${decoded?.role}". Decoded User object: ${JSON.stringify(decoded)}`);
    }

    // Agar role admin nahi hai → user dashboard
    if (decoded?.role !== "admin") {
      if (window.diagnostics) {
        window.diagnostics.addLog(`AdminRoute: User role is not admin. Redirecting to /user`);
      }
      return <Navigate to="/user" replace />;
    }

    // Admin hai → page access
    if (window.diagnostics) {
      window.diagnostics.addLog(`AdminRoute: Access granted for admin path.`);
    }
    return children;

  } catch (error) {
    // Invalid token → login page
    console.error("Invalid token:", error);
    if (window.diagnostics) {
      window.diagnostics.addError(`AdminRoute token decode crash: ${error.message}`);
    }
    return <Navigate to="/login" replace />;
  }
}
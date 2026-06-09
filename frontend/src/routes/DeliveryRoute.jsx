import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getRoleHomePath, normalizeRole } from "../utils/roleRedirect";

export default function DeliveryRoute({ children }) {
  const token = localStorage.getItem("token");
  const authState = localStorage.getItem("auth_state");

  if (!token || authState !== "logged_in") {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const role = normalizeRole(decoded?.role);
    if (role !== "deliveryBoy") {
      return <Navigate to={getRoleHomePath(role)} replace />;
    }
    return children;
  } catch (err) {
    console.error("Invalid delivery token:", err);
    return <Navigate to="/login" replace />;
  }
}

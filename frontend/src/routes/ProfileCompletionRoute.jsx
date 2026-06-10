import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getApiUrl } from "../utils/getApiUrl";

const API = getApiUrl();

const hasCustomerEditProfile = (user) => Boolean(
  String(user?.name || "").trim() &&
  String(user?.phone || "").trim()
);

const hasCustomerAddress = (user) => {
  if (Array.isArray(user?.addresses) && user.addresses.some((addr) => String(addr?.details || "").trim())) {
    return true;
  }
  return Boolean(String(user?.address || "").trim());
};

const isCustomerProfileComplete = (user) => hasCustomerEditProfile(user) && hasCustomerAddress(user);

const isDeliveryProfileComplete = (user) => Boolean(
  String(user?.name || "").trim() &&
  String(user?.phone || "").trim() &&
  String(user?.deliveryDetails?.address || user?.address || "").trim()
);

export default function ProfileCompletionRoute({ children, role = "customer" }) {
  const location = useLocation();
  const [status, setStatus] = useState({ loading: true, allowed: false, redirectTo: "" });

  useEffect(() => {
    let active = true;

    const checkProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await res.json();
        if (!active) return;

        if (role === "deliveryBoy") {
          setStatus({
            loading: false,
            allowed: isDeliveryProfileComplete(user),
            redirectTo: "/delivery/profile",
          });
          return;
        }

        setStatus({
          loading: false,
          allowed: isCustomerProfileComplete(user),
          redirectTo: "/user/profile",
        });
      } catch {
        if (active) {
          setStatus({
            loading: false,
            allowed: false,
            redirectTo: role === "deliveryBoy" ? "/delivery/profile" : "/user/profile",
          });
        }
      }
    };

    checkProfile();
    return () => {
      active = false;
    };
  }, [role]);

  if (status.loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
      </div>
    );
  }

  if (!status.allowed) {
    return <Navigate to={status.redirectTo} replace state={{ from: location, profileRequired: true }} />;
  }

  return children;
}

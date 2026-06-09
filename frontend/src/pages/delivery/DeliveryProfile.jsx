import { createElement, useEffect, useState } from "react";
import { LogOut, Mail, Phone, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { clearSession } from "../../utils/authStorage";
import Button from "../../components/ui/Button";

export default function DeliveryProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  async function loadProfile() {
    try {
      const res = await API.get("/api/users/me");
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load delivery profile:", err);
    }
  }

  useEffect(() => {
    Promise.resolve().then(loadProfile);
  }, []);

  const logout = async () => {
    await clearSession();
    navigate("/login", { replace: true });
  };

  const rows = [
    ["Name", profile?.name || "Delivery Partner", User],
    ["Phone", profile?.phone || "Not added", Phone],
    ["Email", profile?.email || "Not added", Mail],
    ["Role", profile?.role === "deliveryBoy" ? "Delivery Boy" : profile?.role || "Delivery Boy", User],
    ["Join Date", profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Not available", User],
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Profile</h2>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Your delivery partner account details.</p>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-2xl font-black">
            {profile?.name ? profile.name[0].toUpperCase() : "D"}
          </div>
          <div>
            <h3 className="text-xl font-black">{profile?.name || "Delivery Partner"}</h3>
            <p className="text-sm font-bold text-brand-600 dark:text-brand-400">GreenGO Delivery Boy</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map(([label, value, icon]) => (
            <div key={label} className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4">
              {createElement(icon, { size: 17, className: "text-brand-600 mb-2" })}
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-1 font-black text-slate-950 dark:text-white break-words">{value}</p>
            </div>
          ))}
        </div>

        <Button onClick={logout} variant="danger" className="mt-5 w-full rounded-2xl gap-2 py-3">
          <LogOut size={18} /> Logout
        </Button>
      </div>
    </div>
  );
}

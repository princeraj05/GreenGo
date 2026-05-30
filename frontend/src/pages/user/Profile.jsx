import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";

export default function Profile() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    foodPreference: "",
    deliveryTime: "",
    notifications: ""
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState(""); // "success" or "error"

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
          foodPreference: data.foodPreference || "",
          deliveryTime: data.deliveryTime || "",
          notifications: data.notifications || ""
        });
      } catch {
        setMessage("Failed to load profile");
        setMsgType("error");
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setMessage("Profile updated successfully");
        setMsgType("success");
      } else {
        setMessage("Failed to update profile");
        setMsgType("error");
      }
    } catch {
      setMessage("Failed to update profile");
      setMsgType("error");
    }

    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">👤 My Profile</h1>
        <p className="text-gray-500 mt-2">Manage your personal information and preferences.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-sm ${msgType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msgType === 'success' ? (
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          )}
          <span className="font-semibold text-sm">{message}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 md:p-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" />
          <Input label="Mobile Number" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 890" />
          <Input label="Food Preference" name="foodPreference" value={form.foodPreference} onChange={handleChange} placeholder="Veg, Non-Veg, Vegan..." />
          <Input label="Preferred Delivery Time" name="deliveryTime" value={form.deliveryTime} onChange={handleChange} placeholder="e.g. 7:00 PM" />
        </div>

        <div className="mt-6">
          <Input label="Delivery Address" name="address" value={form.address} onChange={handleChange} textarea placeholder="Enter your full street address..." />
        </div>

        <div className="mt-6">
          <Input label="Notification Preferences" name="notifications" value={form.notifications} onChange={handleChange} placeholder="Email, SMS, Push..." />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* INPUT COMPONENT */
const Input = ({ label, textarea, ...props }) => (
  <div className="flex flex-col w-full">
    <label className="text-sm font-semibold text-gray-700 mb-2">{label}</label>
    {textarea ? (
      <textarea
        {...props}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-y min-h-[100px] text-gray-800"
      />
    ) : (
      <input
        {...props}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-gray-800"
      />
    )}
  </div>
);
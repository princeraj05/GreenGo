import { useEffect, useState } from "react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";

export default function ManageSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    deliveryChargeAmount: 40,
    isDeliveryChargeEnabled: true,
    maxDeliveryDistance: 10,
    storeLatitude: 25.5941,
    storeLongitude: 85.1376,
    isDistanceLimitEnabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/settings`);
      const data = await res.json();
      if (data) {
        setForm({
          deliveryChargeAmount: data.deliveryChargeAmount,
          isDeliveryChargeEnabled: data.isDeliveryChargeEnabled,
          maxDeliveryDistance: data.maxDeliveryDistance !== undefined ? data.maxDeliveryDistance : 10,
          storeLatitude: data.storeLatitude !== undefined ? data.storeLatitude : 25.5941,
          storeLongitude: data.storeLongitude !== undefined ? data.storeLongitude : 85.1376,
          isDistanceLimitEnabled: data.isDistanceLimitEnabled !== undefined ? data.isDistanceLimitEnabled : true,
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      await API.put("/api/settings", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Settings saved successfully!");
    } catch (err) {
      console.log(err);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-8 text-slate-900 dark:text-white">Loading settings...</p>;

  return (
    <div className="w-full h-full animate-fade-in pb-10 pt-8">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Global Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure global application properties.</p>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 mb-10 border border-slate-100 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-2xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Delivery Settings
        </h2>
        
        <form onSubmit={handleSave} className="space-y-8">
          
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Enable Delivery Charge</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Charge users for delivery during checkout</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" 
                checked={form.isDeliveryChargeEnabled}
                onChange={(e) => setForm({ ...form, isDeliveryChargeEnabled: e.target.checked })} 
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-350 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className={`${!form.isDeliveryChargeEnabled ? "opacity-50 pointer-events-none" : "transition-opacity"}`}>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Delivery Charge Amount (₹)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 dark:text-slate-500 font-bold">₹</span>
              </div>
              <input type="number" min="0" value={form.deliveryChargeAmount} 
                onChange={(e) => setForm({ ...form, deliveryChargeAmount: Number(e.target.value) })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white font-medium" />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h3 className="font-extrabold text-slate-800 dark:text-white mb-4 uppercase tracking-wider text-xs">Distance & Location Limits</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Enable Distance Limit Check</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Validate customer distance from the store during checkout</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" 
                    checked={form.isDistanceLimitEnabled}
                    onChange={(e) => setForm({ ...form, isDistanceLimitEnabled: e.target.checked })} 
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-350 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className={`${!form.isDistanceLimitEnabled ? "opacity-50 pointer-events-none" : "transition-opacity"} space-y-6`}>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Maximum Delivery Distance (km)</label>
                  <input type="number" min="0" step="0.1" value={form.maxDeliveryDistance} 
                    onChange={(e) => setForm({ ...form, maxDeliveryDistance: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white font-medium" />
                  <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Delivery range 10 km rakhein. Store location system ke saved/default location se calculate hogi.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <button type="submit" disabled={saving}
            className="w-full py-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-lg shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 transition-all active:scale-95 flex items-center justify-center gap-2">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}

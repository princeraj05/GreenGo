import { useEffect, useState } from "react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";
import { getApiUrl } from "../../utils/getApiUrl";

/**
 * ManageSettings Component
 * Main configurations screen allowing the admin to set global variables
 * like coordinates, delivery distance limits, delivery charges,
 * and delivery rider payouts slabs based on distance.
 */
export default function ManageSettings() {
  
  // ==========================================
  // STATE DECLARATIONS
  // ==========================================

  // Loading indicator for fetching configurations
  const [loading, setLoading] = useState(true);

  // Saving indicator for write requests
  const [saving, setSaving] = useState(false);

  // Form input configurations initialized with default values
  const [form, setForm] = useState({
    deliveryChargeAmount: 40,
    isDeliveryChargeEnabled: true,
    maxDeliveryDistance: 10,
    storeLatitude: 25.512098,
    storeLongitude: 86.552263,
    isDistanceLimitEnabled: true,
    deliveryChargeSlabs: [{ upToKm: 10, amount: 50 }, { upToKm: 50, amount: 100 }],
    deliveryBoyAmountSlabs: [{ upToKm: 10, amount: 50 }, { upToKm: 100, amount: 100 }],
    surcharges: [],
    rainCharge: 0,
    festivalCharge: 0,
    platformCharge: 0,
    enabledPaymentMethods: {
      cod: true,
      online: true
    },
    referralRewardFriend: 50,
    referralRewardReferrer: 20,
    minOrderAmount: 0,
    isBirthdayOfferEnabled: true,
    birthdayCouponAmount: 50
  });

  // ==========================================
  // DATA FETCHING & EVENT HANDLERS
  // ==========================================

  /**
   * Modifies dynamic details inside settings surcharge lists.
   */
  const updateSurcharge = (index, key, value) => {
    setForm((current) => ({
      ...current,
      surcharges: current.surcharges.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [key]: value } : item
      )),
    }));
  };

  /**
   * Appends a new blank surcharge slab.
   */
  const addSurcharge = () => {
    setForm((current) => ({
      ...current,
      surcharges: [...(current.surcharges || []), { name: "", amount: "", cod: true, online: true }],
    }));
  };

  /**
   * Removes a surcharge slab.
   */
  const removeSurcharge = (index) => {
    setForm((current) => ({
      ...current,
      surcharges: (current.surcharges || []).length > 1
        ? current.surcharges.filter((_, itemIndex) => itemIndex !== index)
        : [{ name: "", amount: "", cod: true, online: true }],
    }));
  };

  /**
   * Modifies dynamic details inside settings slab lists (distance or amount).
   */
  const updateSlab = (field, index, key, value) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].map((slab, slabIndex) => (
        slabIndex === index
          ? { ...slab, [key]: (key === "cod" || key === "online") ? Boolean(value) : (value === "" ? "" : Number(value)) }
          : slab
      )),
    }));
  };

  /**
   * Appends a new blank slab item parameter.
   */
  const addSlab = (field) => {
    setForm((current) => ({
      ...current,
      [field]: [
        ...current[field],
        field === "deliveryChargeSlabs"
          ? { upToKm: "", amount: "", cod: true, online: true }
          : { upToKm: "", amount: "" }
      ],
    }));
  };

  /**
   * Removes a slab item parameter.
   */
  const removeSlab = (field, index) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].length > 1
        ? current[field].filter((_, slabIndex) => slabIndex !== index)
        : [
            field === "deliveryChargeSlabs"
              ? { upToKm: "", amount: "", cod: true, online: true }
              : { upToKm: "", amount: "" }
          ],
    }));
  };

  // Fetch configurations on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Fetches global settings from endpoint.
   */
  const loadSettings = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/settings`);
      const data = await res.json();
      if (data) {
        setForm({
          deliveryChargeAmount: data.deliveryChargeAmount,
          isDeliveryChargeEnabled: data.isDeliveryChargeEnabled,
          maxDeliveryDistance: data.maxDeliveryDistance !== undefined ? data.maxDeliveryDistance : 10,
          storeLatitude: data.storeLatitude !== undefined ? data.storeLatitude : 25.512098,
          storeLongitude: data.storeLongitude !== undefined ? data.storeLongitude : 86.552263,
          isDistanceLimitEnabled: data.isDistanceLimitEnabled !== undefined ? data.isDistanceLimitEnabled : true,
          deliveryChargeSlabs: Array.isArray(data.deliveryChargeSlabs) && data.deliveryChargeSlabs.length
            ? data.deliveryChargeSlabs.map(s => ({
                upToKm: s.upToKm,
                amount: s.amount,
                cod: s.cod !== undefined ? s.cod : true,
                online: s.online !== undefined ? s.online : true
              }))
            : [{ upToKm: 10, amount: data.deliveryChargeAmount || 50, cod: true, online: true }, { upToKm: 50, amount: 100, cod: true, online: true }],
          deliveryBoyAmountSlabs: Array.isArray(data.deliveryBoyAmountSlabs) && data.deliveryBoyAmountSlabs.length
            ? data.deliveryBoyAmountSlabs
            : [{ upToKm: 10, amount: 50 }, { upToKm: 100, amount: 100 }],
          surcharges: Array.isArray(data.surcharges) && data.surcharges.length ? data.surcharges : [{ name: "", amount: "", cod: true, online: true }],
          rainCharge: data.rainCharge !== undefined ? data.rainCharge : 0,
          festivalCharge: data.festivalCharge !== undefined ? data.festivalCharge : 0,
          platformCharge: data.platformCharge !== undefined ? data.platformCharge : 0,
          enabledPaymentMethods: data.enabledPaymentMethods || { cod: true, online: true },
          referralRewardFriend: data.referralRewardFriend !== undefined ? data.referralRewardFriend : 50,
          referralRewardReferrer: data.referralRewardReferrer !== undefined ? data.referralRewardReferrer : 20,
          minOrderAmount: data.minOrderAmount !== undefined ? data.minOrderAmount : 0,
          isBirthdayOfferEnabled: data.isBirthdayOfferEnabled !== undefined ? data.isBirthdayOfferEnabled : true,
          birthdayCouponAmount: data.birthdayCouponAmount !== undefined ? data.birthdayCouponAmount : 50
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates global settings configuration records.
   */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const payload = {
        ...form,
        deliveryChargeAmount: Number(form.deliveryChargeSlabs?.[0]?.amount || form.deliveryChargeAmount || 0),
        surcharges: (form.surcharges || []).filter(s => s.name.trim() !== ""),
        referralRewardFriend: Number(form.referralRewardFriend || 0),
        referralRewardReferrer: Number(form.referralRewardReferrer || 0),
        minOrderAmount: Number(form.minOrderAmount || 0),
        isBirthdayOfferEnabled: Boolean(form.isBirthdayOfferEnabled),
        birthdayCouponAmount: Number(form.birthdayCouponAmount || 0)
      };
      await API.put("/api/settings", payload, {
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

  // Renders editable list rows for slabs
  const renderSlabRows = (field) => (
    <div className="space-y-3">
      {(form[field] || []).map((slab, index) => (
        <div key={index} className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Up to km</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={slab.upToKm}
              onChange={(e) => updateSlab(field, index, "upToKm", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white font-medium text-sm"
            />
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Amount (₹)</label>
            <input
              type="number"
              min="0"
              value={slab.amount}
              onChange={(e) => updateSlab(field, index, "amount", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white font-medium text-sm"
            />
          </div>
          {field === "deliveryChargeSlabs" && (
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={slab.cod !== false}
                  onChange={(e) => updateSlab(field, index, "cod", e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500 w-5 h-5"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">COD</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={slab.online !== false}
                  onChange={(e) => updateSlab(field, index, "online", e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500 w-5 h-5"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Online</span>
              </label>
            </div>
          )}
          <button
            type="button"
            onClick={() => removeSlab(field, index)}
            className="sm:self-end mt-4 sm:mt-0 px-4 py-3 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-300 font-bold text-sm"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => addSlab(field)}
        className="w-full py-3 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 font-bold"
      >
        + Add Slab
      </button>
    </div>
  );

  // Renders dynamic surcharges
  const renderSurchargeRows = () => (
    <div className="space-y-3">
      {(form.surcharges || []).map((surcharge, index) => (
        <div key={index} className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Surcharge Name</label>
            <input
              type="text"
              placeholder="e.g. Rainy Season"
              value={surcharge.name}
              onChange={(e) => updateSurcharge(index, "name", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white font-medium text-sm"
            />
          </div>
          <div className="w-[100px]">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Amount (₹)</label>
            <input
              type="number"
              min="0"
              value={surcharge.amount}
              onChange={(e) => updateSurcharge(index, "amount", Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white font-medium text-sm"
            />
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={surcharge.cod}
                onChange={(e) => updateSurcharge(index, "cod", e.target.checked)}
                className="rounded text-emerald-500 focus:ring-emerald-500 w-5 h-5"
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">COD</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={surcharge.online}
                onChange={(e) => updateSurcharge(index, "online", e.target.checked)}
                className="rounded text-emerald-500 focus:ring-emerald-500 w-5 h-5"
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Online</span>
            </label>
          </div>
          <button
            type="button"
            onClick={() => removeSurcharge(index)}
            className="sm:self-end mt-4 sm:mt-0 px-4 py-3 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-300 font-bold text-sm"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addSurcharge}
        className="w-full py-3 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 font-bold"
      >
        + Add Slab
      </button>
    </div>
  );

  return (
    // Outer layouts wrap with fade-in animations
    <div className="w-full h-full animate-fade-in pb-10 pt-14 md:pt-8">
      
      {/* --- HEADER SECTION --- */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Global Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure global application properties.</p>
      </div>
      {/* --- END HEADER SECTION --- */}

      {/* --- SETTINGS FORM PANEL --- */}
      {/* Tailwind classes: shadows and max width limits keep form layout clean on large displays */}
      <div className="p-8 mb-10 max-w-2xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Delivery Settings
        </h2>
        
        <form onSubmit={handleSave} className="space-y-8">



          {/* Extra / Seasonal Surcharge Fees Section */}
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-xs">Extra / Seasonal Charges (Surcharges)</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Apply seasonal, weather, or operational surcharges to every order.</p>

            {renderSurchargeRows()}
          </div>
          
          {/* Custom Delivery Toggle Switch */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Enable Custom Delivery Charge</h3>
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

          {/* Delivery Charge Slabs section */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h3 className="font-extrabold text-slate-800 dark:text-white mb-2 uppercase tracking-wider text-xs">Custom Delivery Charge</h3>
            <p className="mb-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Example: 10 km tak Rs. 50, 50 km tak Rs. 100.
            </p>
            {renderSlabRows("deliveryChargeSlabs")}
          </div>

          {/* Rider payout settings section */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h3 className="font-extrabold text-slate-800 dark:text-white mb-2 uppercase tracking-wider text-xs">Delivery Boy Amount Setting</h3>
            <p className="mb-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Delivered order ke distance ke according delivery boy account me ye amount add hoga.
            </p>
            {renderSlabRows("deliveryBoyAmountSlabs")}
          </div>

          {/* Geographic Limits Section */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h3 className="font-extrabold text-slate-800 dark:text-white mb-4 uppercase tracking-wider text-xs">Distance & Location Limits</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Cafe Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={form.storeLatitude}
                    onChange={(e) => setForm({ ...form, storeLatitude: e.target.value === "" ? "" : Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Cafe Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={form.storeLongitude}
                    onChange={(e) => setForm({ ...form, storeLongitude: e.target.value === "" ? "" : Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white font-medium text-sm"
                  />
                </div>
              </div>

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

          {/* Referral Reward Settings Section */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h3 className="font-extrabold text-slate-800 dark:text-white mb-4 uppercase tracking-wider text-xs">Referral Rewards Settings</h3>
            <p className="mb-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Configure dynamic referral discount payouts for friends (new users) and referrers.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Friend's Reward (New User Discount) (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.referralRewardFriend}
                  onChange={(e) => setForm({ ...form, referralRewardFriend: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white font-medium text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Referrer's Reward (Ishani's Coupon) (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.referralRewardReferrer}
                  onChange={(e) => setForm({ ...form, referralRewardReferrer: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white font-medium text-sm"
                />
              </div>
            </div>
          </div>

          {/* Minimum Order Settings Section */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h3 className="font-extrabold text-slate-800 dark:text-white mb-4 uppercase tracking-wider text-xs">Order Settings</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Minimum Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value === "" ? "" : Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white font-medium text-sm"
              />
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Isse kam value ke orders customer place nahi kar payenge. Default 0 set rahega toh koi minimum limit nahi hogi.
              </p>
            </div>
          </div>

          {/* Birthday Special Offer Settings Section */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-xs">Birthday Special Offer Settings</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Configure birthday coupon rewards for customers on their birthday.</p>
            
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Enable Birthday Special Offer</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Show birthday wishes and credit ₹ coupon to customer for 24h</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" 
                  checked={form.isBirthdayOfferEnabled}
                  onChange={(e) => setForm({ ...form, isBirthdayOfferEnabled: e.target.checked })} 
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-350 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className={`${!form.isBirthdayOfferEnabled ? "opacity-50 pointer-events-none" : "transition-opacity"}`}>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Birthday Coupon Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={form.birthdayCouponAmount}
                onChange={(e) => setForm({ ...form, birthdayCouponAmount: e.target.value === "" ? "" : Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white font-medium text-sm"
              />
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Customer ke birthday par use dynamic "BIRTHDAY" coupon code milega jo 24 ghante ke liye valid rahega (रात 12 AM से रात 11:59 PM तक)।
              </p>
            </div>
          </div>
          
          <button type="submit" disabled={saving}
            className="w-full py-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-lg shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 transition-all active:scale-95 flex items-center justify-center gap-2">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
      {/* --- END SETTINGS FORM PANEL --- */}

    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "../../utils/getToken";

/**
 * FoodAnalytics Component
 * Monitors menu item metrics, orders counts, revenue generated, and popularity scores.
 * Provides features to dynamically toggle items as 'Featured' directly from the data.
 */
export default function FoodAnalytics() {
  // Constant pagination page size increment
  const PAGE_SIZE = 30;

  // ==========================================
  // STATE DECLARATIONS
  // ==========================================

  // Array of food item analytical records
  const [foods, setFoods] = useState([]);

  // Flag denoting active loading phase
  const [loading, setLoading] = useState(true);

  // Number of items displayed in the list/table currently (pagination limit)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ==========================================
  // DATA FETCHING & EVENT HANDLERS
  // ==========================================

  /**
   * Fetches analytical food metrics from backend.
   */
  const loadFoodAnalytics = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/analytics/food-analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setFoods(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Triggers analytical data load on render
  useEffect(() => {
    loadFoodAnalytics();
  }, [loadFoodAnalytics]);

  /**
   * Toggles the featured (Today's Special) boolean on the given food item.
   */
  const toggleFeatured = async (food) => {
    try {
      const token = await getToken();
      await fetch(`${import.meta.env.VITE_API_URL}/api/foods/${food._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ featured: !food.featured })
      });
      loadFoodAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  // Memoized subset array containing items filtered by visibility limit
  const visibleFoods = useMemo(() => foods.slice(0, visibleCount), [foods, visibleCount]);

  // Boolean state denoting if additional hidden list records are available
  const hasMoreFoods = visibleFoods.length < foods.length;

  return (
    // Styling: Renders container fade-in transition
    <div className="animate-fade-in">
      
      {/* --- HEADER SECTION --- */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Food Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Detailed performance metrics for your menu items.</p>
      </div>
      {/* --- END HEADER SECTION --- */}

      {/* --- ANALYTICS TABLE/LIST SECTION --- */}
      {/* Responsive layout containers toggle table format vs grid items via breakpoints md:block / md:hidden */}
      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading metrics...</div>
        ) : (
          <>
          
          {/* --- MOBILE DISPLAY LIST --- */}
          {/* Displays as a responsive grid list on mobile screens (hidden above md breakpoint) */}
          <div className="grid gap-3 p-4 md:hidden">
            {visibleFoods.map((food) => (
              <div key={food._id} className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-black text-slate-950 dark:text-white">{food.name}</h3>
                  <span className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold">
                    {(food.popularityScore || 0).toFixed(1)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Metric label="Orders" value={food.totalOrders || 0} />
                  <Metric label="Revenue" value={`₹${food.revenueGenerated || 0}`} />
                </div>
                <button
                  onClick={() => toggleFeatured(food)}
                  className={`mt-3 min-h-11 w-full rounded-xl text-sm font-black transition-colors ${
                    food.featured
                      ? "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                      : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800"
                  }`}
                >
                  {food.featured ? "Featured" : "Set Featured"}
                </button>
              </div>
            ))}
          </div>
          {/* --- END MOBILE DISPLAY LIST --- */}

          {/* --- DESKTOP TABLE VIEW --- */}
          {/* Visible starting from md breakpoint */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60">
                  <th className="py-4 px-6 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Food Item</th>
                  <th className="py-4 px-6 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs text-right">Total Orders</th>
                  <th className="py-4 px-6 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs text-right">Revenue</th>
                  <th className="py-4 px-6 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs text-center">Popularity Score</th>
                  <th className="py-4 px-6 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs text-center">Featured (Today's Special)</th>
                </tr>
              </thead>
              <tbody>
                {visibleFoods.map((food) => (
                  <tr key={food._id} className="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="py-4 px-6 font-bold text-slate-800 dark:text-white">{food.name}</td>
                    <td className="py-4 px-6 text-right font-medium text-slate-600 dark:text-slate-300">{food.totalOrders || 0}</td>
                    <td className="py-4 px-6 text-right font-black text-emerald-600 dark:text-emerald-450">₹{food.revenueGenerated || 0}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold">
                        {(food.popularityScore || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => toggleFeatured(food)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          food.featured 
                            ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/40' 
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        {food.featured ? "Featured ⭐" : "Set Featured"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* --- END DESKTOP TABLE VIEW --- */}

          {/* --- SHOW MORE FOOTER PAGINATION --- */}
          {hasMoreFoods && (
            <div className="border-t border-slate-100 dark:border-slate-800/60 p-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="min-h-11 rounded-2xl border border-slate-200 dark:border-slate-800 px-6 text-sm font-black text-slate-700 dark:text-slate-200"
              >
                Show More Foods ({foods.length - visibleFoods.length})
              </button>
            </div>
          )}
          {/* --- END SHOW MORE FOOTER PAGINATION --- */}

          </>
        )}
      </div>
      {/* --- END ANALYTICS TABLE/LIST SECTION --- */}

    </div>
  );
}

/**
 * Metric Helper Component
 * Simply displays analytical value summaries in grid boxes
 */
function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

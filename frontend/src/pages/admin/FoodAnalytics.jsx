import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "../../utils/getToken";

export default function FoodAnalytics() {
  const PAGE_SIZE = 30;
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

  useEffect(() => {
    loadFoodAnalytics();
  }, [loadFoodAnalytics]);

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
  const visibleFoods = useMemo(() => foods.slice(0, visibleCount), [foods, visibleCount]);
  const hasMoreFoods = visibleFoods.length < foods.length;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Food Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Detailed performance metrics for your menu items.</p>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading metrics...</div>
        ) : (
          <>
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
                    <td className="py-4 px-6 text-right font-medium text-slate-600 dark:text-slate-350">{food.totalOrders || 0}</td>
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
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

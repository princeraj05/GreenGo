import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";

export default function FoodAnalytics() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFoodAnalytics();
  }, []);

  const loadFoodAnalytics = async () => {
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
  };

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

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Food Analytics</h1>
        <p className="text-slate-500 mt-1">Detailed performance metrics for your menu items.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading metrics...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-4 px-6 font-bold text-slate-500 uppercase tracking-wider text-xs">Food Item</th>
                  <th className="py-4 px-6 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Total Orders</th>
                  <th className="py-4 px-6 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Revenue</th>
                  <th className="py-4 px-6 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">Popularity Score</th>
                  <th className="py-4 px-6 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">Featured (Today's Special)</th>
                </tr>
              </thead>
              <tbody>
                {foods.map((food) => (
                  <tr key={food._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-bold text-slate-800">{food.name}</td>
                    <td className="py-4 px-6 text-right font-medium text-slate-600">{food.totalOrders || 0}</td>
                    <td className="py-4 px-6 text-right font-black text-emerald-600">₹{food.revenueGenerated || 0}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                        {(food.popularityScore || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => toggleFeatured(food)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          food.featured 
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
        )}
      </div>
    </div>
  );
}

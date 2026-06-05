import { useEffect, useState } from "react";
import { Star, Trash2, Eye, EyeOff, Search } from "lucide-react";
import { getToken } from "../../utils/getToken";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { getApiUrl } from "../../utils/getApiUrl";

export default function ManageReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [error, setError] = useState("");

  const loadReviews = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      
      let url = `${getApiUrl()}/api/reviews?`;
      if (ratingFilter !== "All") {
        url += `rating=${ratingFilter}&`;
      }
      if (search.trim()) {
        url += `search=${encodeURIComponent(search.trim())}&`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setReviews(await res.json());
      } else {
        setError("Failed to load reviews");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred while fetching reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [ratingFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReviews();
  };

  const handleToggleVisibility = async (id, currentHidden) => {
    const isHidden = !!currentHidden;
    try {
      const token = await getToken();
      const res = await fetch(`${getApiUrl()}/api/reviews/${id}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ hidden: !isHidden })
      });

      if (res.ok) {
        const data = await res.json();
        setReviews(prev => prev.map(r => r._id === id ? data.review : r));
      } else {
        alert("Failed to update visibility");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`${getApiUrl()}/api/reviews/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setReviews(prev => prev.filter(r => r._id !== id));
      } else {
        alert("Failed to delete review");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Manage Reviews</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-base font-medium">Moderate customer ratings and review comments.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 dark:border-red-950/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
          <Input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
          <button type="submit" className="hidden">Search</button>
        </form>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {["All", "5", "4", "3", "2", "1"].map((val) => (
            <button
              key={val}
              onClick={() => setRatingFilter(val)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                ratingFilter === val
                  ? "bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 shadow-md shadow-slate-900/10"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              }`}
            >
              {val === "All" ? "All Ratings" : `${val} ★`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800/60 p-12 text-center shadow-sm">
          <p className="text-slate-400 dark:text-slate-550 font-medium">No reviews found matching the search/filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <Card key={r._id} className={`p-6 border-slate-100 dark:border-slate-800/60 flex flex-col justify-between bg-white dark:bg-slate-950 ${r.hidden ? "bg-slate-100/50 dark:bg-slate-900/30 opacity-75" : ""}`}>
              <div>
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-white text-sm truncate max-w-[150px]" title={r.userName}>
                      {r.userName}
                    </h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 px-2 py-1 rounded-md max-w-[120px] truncate" title={r.foodName}>
                    {r.foodName}
                  </span>
                </div>

                {/* Rating stars */}
                <div className="flex gap-0.5 text-yellow-400 mb-4 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl w-fit border border-slate-100 dark:border-slate-800/60">
                  {[...Array(r.rating)].map((_, idx) => (
                    <Star key={idx} size={14} fill="currentColor" className="text-yellow-400" />
                  ))}
                  {[...Array(5 - r.rating)].map((_, idx) => (
                    <Star key={idx} size={14} className="text-slate-200 dark:text-slate-800" />
                  ))}
                </div>

                <p className="text-slate-600 dark:text-slate-350 text-sm leading-relaxed font-medium mb-6">"{r.reviewText}"</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-100/60 dark:border-slate-800/60">
                <Button
                  variant="secondary"
                  onClick={() => handleToggleVisibility(r._id, r.hidden)}
                  className={`flex-1 gap-1.5 text-xs py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 ${
                    r.hidden ? "hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-450" : "hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  {r.hidden ? (
                    <>
                      <Eye size={14} /> Show
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} /> Hide
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleDeleteReview(r._id)}
                  className="flex-1 gap-1.5 text-xs py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 shadow-none hover:shadow-none"
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

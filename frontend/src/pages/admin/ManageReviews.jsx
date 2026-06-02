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
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manage Reviews</h1>
        <p className="text-slate-500 mt-2 text-base font-medium">Moderate customer ratings and review comments.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
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
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
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
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <p className="text-slate-400 font-medium">No reviews found matching the search/filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <Card key={r._id} className={`p-6 border-slate-100 flex flex-col justify-between ${r.hidden ? "bg-slate-100/50 opacity-75" : ""}`}>
              <div>
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm truncate max-w-[150px]" title={r.userName}>
                      {r.userName}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-brand-50 text-brand-600 px-2 py-1 rounded-md max-w-[120px] truncate" title={r.foodName}>
                    {r.foodName}
                  </span>
                </div>

                {/* Rating stars */}
                <div className="flex gap-0.5 text-yellow-400 mb-4 bg-slate-50 p-2 rounded-xl w-fit border border-slate-100">
                  {[...Array(r.rating)].map((_, idx) => (
                    <Star key={idx} size={14} fill="currentColor" className="text-yellow-400" />
                  ))}
                  {[...Array(5 - r.rating)].map((_, idx) => (
                    <Star key={idx} size={14} className="text-slate-200" />
                  ))}
                </div>

                <p className="text-slate-600 text-sm leading-relaxed font-medium mb-6">"{r.reviewText}"</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-100/60">
                <Button
                  variant="secondary"
                  onClick={() => handleToggleVisibility(r._id, r.hidden)}
                  className={`flex-1 gap-1.5 text-xs py-2.5 rounded-xl border border-slate-200 ${
                    r.hidden ? "hover:bg-emerald-50 hover:text-emerald-600" : "hover:bg-slate-100 hover:text-slate-600"
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
                  className="flex-1 gap-1.5 text-xs py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 shadow-none hover:shadow-none"
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

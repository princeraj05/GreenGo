import { Link } from "react-router-dom";

export default function RecommendedFoods({ foods }) {
  if (!foods || foods.length === 0) return null;

  // Let's just pick up to 4 random foods to show as recommended
  const recommended = [...foods].sort(() => 0.5 - Math.random()).slice(0, 4);

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="text-2xl">🔥</span> Recommended For You
        </h3>
        <Link to="/user/menu" className="text-sm font-bold text-orange-500 hover:text-orange-600">See All</Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommended.map(food => (
          <Link key={food._id} to={`/user/menu`} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="relative h-40 w-full rounded-2xl overflow-hidden mb-4 bg-slate-50">
              {food.image ? (
                <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🍔</div>
              )}
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1 shadow-sm">
                ⭐ {food.rating || "4.5"}
              </div>
            </div>
            <h4 className="font-bold text-slate-900 truncate">{food.name}</h4>
            <div className="flex justify-between items-center mt-2">
              <span className="text-orange-500 font-black tracking-tight">₹{food.price}</span>
              <span className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/></svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

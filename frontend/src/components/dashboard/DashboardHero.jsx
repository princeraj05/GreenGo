import { Link } from "react-router-dom";

export default function DashboardHero({ userName }) {
  const hour = new Date().getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-500 to-red-600 text-white p-8 md:p-12 shadow-2xl shadow-orange-500/30 mb-10 group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
      
      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/20 mb-6 shadow-sm">
          <span className="text-xl">✨</span>
          <span className="font-bold text-sm tracking-wide">{greeting}, {userName?.split(' ')[0] || 'Foodie'}!</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
          Craving Something <br/><span className="text-orange-200">Delicious</span> Today? 🍔
        </h1>
        
        <p className="text-orange-100 text-lg mb-8 max-w-lg font-medium opacity-90">
          Discover trending dishes, exclusive offers, and track your orders in one place.
        </p>
        
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/user/menu" className="px-8 py-4 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 hover:scale-105 transition-all shadow-xl shadow-black/10 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Search Food
          </Link>
          <a href="#offers" className="px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl font-bold transition-all border border-white/30 flex items-center gap-2">
            🎟️ View Offers
          </a>
        </div>
      </div>
      
      {/* Decorative Food Elements */}
      <div className="absolute right-[-20px] bottom-[-20px] opacity-20 hidden md:block pointer-events-none transform rotate-[-15deg] group-hover:rotate-0 transition-transform duration-700">
        <svg viewBox="0 0 200 200" className="w-64 h-64" fill="currentColor">
          <path d="M42.7,-73.4C55.9,-67.8,67.6,-56.9,76.5,-43.8C85.4,-30.7,91.5,-15.3,91.7,0.1C91.8,15.6,86.1,31.2,77.2,44.5C68.3,57.7,56.2,68.7,42.5,74.9C28.8,81.1,14.4,82.5,0.1,82.4C-14.3,82.2,-28.5,80.5,-41.8,74.2C-55.2,67.9,-67.7,57,-76.3,43.5C-84.9,30,-89.7,15,-89.6,0.1C89.4,-14.8,-84.3,-29.7,-75.4,-42.6C-66.5,-55.4,-53.8,-66.3,-40.1,-71.7C-26.4,-77.2,-13.2,-77.2,1.3,-79.4C15.8,-81.6,31.5,-85.9,42.7,-73.4Z" transform="translate(100 100)" />
        </svg>
      </div>
    </div>
  );
}

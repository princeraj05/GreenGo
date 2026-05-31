import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Sparkles, Ticket } from "lucide-react";

export default function DashboardHero({ userName }) {
  const hour = new Date().getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 text-white p-8 md:p-14 shadow-2xl mb-10 group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-brand-600/20 to-transparent" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-800/50 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      
      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6 shadow-sm">
          <Sparkles size={16} className="text-brand-400" />
          <span className="font-bold text-sm tracking-wide text-slate-200">{greeting}, {userName?.split(' ')[0] || 'Foodie'}!</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
          Craving Something <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">Delicious</span> Today? 🍔
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-lg font-medium leading-relaxed">
          Discover trending dishes, exclusive offers, and track your orders in one place.
        </p>
        
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/user/menu" className="px-8 py-4 bg-brand-500 text-white rounded-2xl font-bold hover:bg-brand-600 hover:-translate-y-1 transition-all shadow-xl shadow-brand-500/25 flex items-center gap-2">
            <Search size={20} />
            Search Food
          </Link>
          <a href="#offers" className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white rounded-2xl font-bold transition-all border border-white/10 flex items-center gap-2">
            <Ticket size={20} className="text-brand-400" />
            View Offers
          </a>
        </div>
      </div>
    </motion.div>
  );
}

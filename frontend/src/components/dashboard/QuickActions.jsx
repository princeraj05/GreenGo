import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ShoppingBag, Package, Heart, Zap } from "lucide-react";

export default function QuickActions() {
  const actions = [
    { title: "Browse Menu", icon: <Search size={24} />, link: "/user/menu", color: "from-brand-400 to-brand-600", bg: "bg-brand-50", text: "text-brand-600" },
    { title: "View Cart", icon: <ShoppingBag size={24} />, link: "/user/cart", color: "from-blue-400 to-indigo-500", bg: "bg-blue-50", text: "text-blue-600" },
    { title: "My Orders", icon: <Package size={24} />, link: "/user/orders", color: "from-emerald-400 to-teal-500", bg: "bg-emerald-50", text: "text-emerald-600" },
    { title: "Favorite Foods", icon: <Heart size={24} />, link: "/user/menu", color: "from-rose-400 to-pink-500", bg: "bg-rose-50", text: "text-rose-600" },
  ];

  return (
    <div className="mb-10">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Zap size={24} className="text-brand-500" /> Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
            <Link 
              to={action.link}
              className="group relative overflow-hidden rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white block"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${action.color} opacity-[0.03] rounded-bl-full -z-10 group-hover:scale-150 group-hover:opacity-10 transition-all duration-500`} />
              
              <div className={`w-14 h-14 rounded-2xl ${action.bg} ${action.text} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                {action.icon}
              </div>
              <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{action.title}</h4>
              <div className="mt-4 w-8 h-1 rounded-full bg-slate-200 group-hover:w-full group-hover:bg-gradient-to-r group-hover:from-brand-400 group-hover:to-brand-600 transition-all duration-500"></div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

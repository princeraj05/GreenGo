import { Link } from "react-router-dom";

export default function QuickActions() {
  const actions = [
    { title: "Browse Menu", icon: "🍕", link: "/user/menu", color: "from-orange-400 to-red-500", bg: "bg-orange-50", text: "text-orange-600" },
    { title: "View Cart", icon: "🛒", link: "/user/cart", color: "from-blue-400 to-indigo-500", bg: "bg-blue-50", text: "text-blue-600" },
    { title: "My Orders", icon: "📦", link: "/user/orders", color: "from-emerald-400 to-teal-500", bg: "bg-emerald-50", text: "text-emerald-600" },
    { title: "Favorite Foods", icon: "❤️", link: "/user/menu", color: "from-rose-400 to-pink-500", bg: "bg-rose-50", text: "text-rose-600" },
  ];

  return (
    <div className="mb-10">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="text-2xl">⚡</span> Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, idx) => (
          <Link 
            key={idx} 
            to={action.link}
            className={`group relative overflow-hidden rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${action.color} opacity-5 rounded-bl-full -z-10 group-hover:scale-150 group-hover:opacity-10 transition-all duration-500`} />
            
            <div className={`w-12 h-12 rounded-xl ${action.bg} ${action.text} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
              {action.icon}
            </div>
            <h4 className="font-bold text-slate-800 group-hover:text-slate-900">{action.title}</h4>
            <div className="mt-2 w-8 h-1 rounded-full bg-slate-200 group-hover:w-full group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-red-500 transition-all duration-300"></div>
          </Link>
        ))}
      </div>
    </div>
  );
}

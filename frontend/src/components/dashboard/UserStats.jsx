export default function UserStats({ totalOrders, totalSpent, points }) {
  return (
    <div className="mb-10">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="text-2xl">📊</span> Your Stats
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Orders" value={totalOrders} icon="🛍️" colorClass="from-blue-500 to-indigo-600" />
        <StatCard title="Total Spent" value={`₹${totalSpent}`} icon="💰" colorClass="from-emerald-500 to-teal-600" />
        <StatCard title="Reward Points" value={points} icon="⭐" colorClass="from-amber-400 to-orange-500" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, colorClass }) {
  return (
    <div className={`relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br ${colorClass} text-white shadow-lg transition-transform hover:scale-[1.02] group`}>
      <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-500">
        <div className="text-8xl">{icon}</div>
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <p className="font-bold opacity-90 uppercase tracking-wider text-sm">{title}</p>
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl">
            {icon}
          </div>
        </div>
        <h2 className="text-4xl font-black tracking-tight">{value}</h2>
      </div>
    </div>
  );
}

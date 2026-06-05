import { Link } from "react-router-dom";

export default function ActiveOrdersCard({ activeOrdersCount }) {
  if (activeOrdersCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-2xl p-6 border border-orange-100 dark:border-orange-900/50 shadow-sm mb-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <svg className="w-32 h-32 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-2xl">
              🛵
            </div>
            <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-ping"></div>
            <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">You have {activeOrdersCount} active {activeOrdersCount === 1 ? 'order' : 'orders'}!</h3>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Your food is being prepared and will be on its way soon.</p>
          </div>
        </div>
        
        <Link to="/user/orders" className="shrink-0 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95">
          Track Order
        </Link>
      </div>
    </div>
  );
}

export default function ActivityTimeline({ activeOrder }) {
  if (!activeOrder) return null;

  const steps = ["Placed", "Accepted", "Preparing", "Rider Accepted", "On the Way", "Delivered"];
  
  const stepMap = {
    Pending: 0,
    RestaurantAccepted: 1,
    Preparing: 2,
    AcceptedByDeliveryBoy: 3,
    "Out for Delivery": 4,
    Delivered: 5
  };
  const currentStep = stepMap[activeOrder.status] ?? 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-10 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="text-2xl">⏱️</span> Order Tracker
        </h3>
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Order #{activeOrder._id.slice(-6)}</span>
      </div>

      <div className="relative mt-8 mb-4">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 rounded-full"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-brand-600 -translate-y-1/2 rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        ></div>
        
        <div className="relative flex justify-between w-full">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div key={idx} className="flex flex-col items-center group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all duration-300 z-10 ${
                  isCompleted ? 'bg-brand-600 border-brand-100 dark:border-brand-950/40 text-white' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400'
                } ${isCurrent ? 'ring-4 ring-brand-500/20 scale-110' : ''}`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`mt-3 text-xs md:text-sm font-bold absolute top-12 whitespace-nowrap transition-colors ${
                  isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-14 p-4 bg-brand-50 dark:bg-brand-950/20 rounded-xl border border-brand-100 dark:border-brand-900/40 text-sm font-medium text-brand-700 dark:text-brand-400 flex items-center gap-2">
        <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Your order is currently: {steps[currentStep]}.
      </div>
    </div>
  );
}

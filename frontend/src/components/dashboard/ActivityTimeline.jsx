export default function ActivityTimeline({ activeOrder }) {
  if (!activeOrder) return null;

  const steps = ["Pending", "Preparing", "Out for Delivery", "Delivered"];
  
  // A simple mapping of our statuses to steps. 
  // If backend only has "Pending", "Preparing", "Delivered", we adapt it.
  const currentStep = activeOrder.status === "Delivered" ? 3 : 
                      activeOrder.status === "Preparing" ? 1 : 
                      activeOrder.status === "Out for Delivery" ? 2 : 0;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="text-2xl">⏱️</span> Order Tracker
        </h3>
        <span className="text-sm font-bold text-slate-500">Order #{activeOrder._id.slice(-6)}</span>
      </div>

      <div className="relative mt-8 mb-4">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-orange-500 -translate-y-1/2 rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        ></div>
        
        <div className="relative flex justify-between w-full">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div key={idx} className="flex flex-col items-center group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all duration-300 z-10 ${
                  isCompleted ? 'bg-orange-500 border-orange-100 text-white' : 'bg-white border-slate-100 text-slate-400'
                } ${isCurrent ? 'ring-4 ring-orange-500/20 scale-110' : ''}`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`mt-3 text-xs md:text-sm font-bold absolute top-12 whitespace-nowrap transition-colors ${
                  isCompleted ? 'text-slate-800' : 'text-slate-400'
                }`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-14 p-4 bg-orange-50 rounded-xl border border-orange-100 text-sm font-medium text-orange-800 flex items-center gap-2">
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Your order is currently: {steps[currentStep]}.
      </div>
    </div>
  );
}

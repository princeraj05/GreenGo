export default function OffersSection() {
  const offers = [
    { code: "SAVE20", desc: "Get 20% off on orders above ₹500", color: "from-purple-500 to-indigo-500" },
    { code: "FREEDEL", desc: "Free delivery on your next 3 orders", color: "from-rose-500 to-pink-500" },
    { code: "WELCOME50", desc: "50% off on your first order!", color: "from-amber-500 to-orange-500" }
  ];

  return (
    <div id="offers" className="mb-10">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="text-2xl">🎟️</span> Special Offers
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {offers.map((offer, idx) => (
          <div key={idx} className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${offer.color} text-white p-6 shadow-lg shadow-${offer.color.split('-')[1]}/30 hover:-translate-y-1 transition-transform cursor-pointer group`}>
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="border-2 border-dashed border-white/40 rounded-2xl p-4 relative z-10 backdrop-blur-sm bg-white/10 flex flex-col h-full justify-between">
              <div>
                <p className="text-white/90 font-medium text-sm mb-2">{offer.desc}</p>
                <h4 className="text-3xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">{offer.code}</h4>
              </div>
              <button className="mt-4 w-full py-2 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm">
                Copy Code
              </button>
            </div>
            
            {/* Cutouts for ticket effect */}
            <div className="absolute top-1/2 -left-3 w-6 h-6 bg-slate-50 rounded-full -translate-y-1/2"></div>
            <div className="absolute top-1/2 -right-3 w-6 h-6 bg-slate-50 rounded-full -translate-y-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

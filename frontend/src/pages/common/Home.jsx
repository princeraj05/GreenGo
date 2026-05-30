import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

// Scroll-reveal hook for smooth animations
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Section({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const menuItems = [
    { emoji: "🍔", name: "Classic Burger", price: "₹149", tag: "Bestseller", color: "from-orange-400 to-red-500" },
    { emoji: "🍕", name: "Margherita Pizza", price: "₹199", tag: "Popular", color: "from-yellow-400 to-orange-500" },
    { emoji: "🌮", name: "Chicken Tacos", price: "₹129", tag: "Spicy", color: "from-red-400 to-rose-500" },
    { emoji: "🥗", name: "Caesar Salad", price: "₹109", tag: "Healthy", color: "from-emerald-400 to-teal-500" },
  ];

  const testimonials = [
    { name: "Priya S.", city: "Ludhiana", text: "ByteBite changed my life! The food is always piping hot and the delivery is incredibly fast.", stars: 5 },
    { name: "Rahul M.", city: "Chandigarh", text: "The cleanest UI and the best restaurant selection. I order from here almost every single day.", stars: 5 },
    { name: "Anjali K.", city: "Amritsar", text: "Highly recommend! The UI is gorgeous and the customer support is top-notch if you ever need it.", stars: 5 },
  ];

  const steps = [
    { emoji: "📱", title: "Browse Menu", desc: "Explore hundreds of premium dishes from top-rated restaurants near you." },
    { emoji: "🛒", title: "Place Order", desc: "Add to cart and checkout securely in seconds with multiple payment options." },
    { emoji: "🚀", title: "Fast Delivery", desc: "Track your order live while our riders bring your food hot and fresh." },
  ];

  return (
    <div className="w-full flex flex-col overflow-hidden bg-white">

      {/* ── Hero Section ── */}
      <section className="relative w-full min-h-[600px] flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-red-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-400/10 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-400/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          <Section>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-bold tracking-wide mb-6 shadow-sm border border-orange-200/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
              </span>
              Now Delivering in Your Area
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
              Craving Something? <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                Order in Minutes.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Experience the best local flavors delivered directly to your doorstep. Premium food, lightning-fast delivery, and zero hassle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate("/login")}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-lg shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 transition-all duration-300"
              >
                🚀 Order Now
              </button>
              <button 
                onClick={() => navigate("/about")}
                className="px-8 py-4 rounded-full bg-white text-gray-800 font-bold text-lg shadow-lg shadow-gray-200/50 hover:bg-gray-50 hover:-translate-y-1 transition-all duration-300 border border-gray-100"
              >
                Learn More
              </button>
            </div>
            
            <div className="flex justify-center gap-10 mt-16 pt-10 border-t border-gray-200/60 max-w-3xl mx-auto">
              {[
                { val: "10K+", label: "Happy Foodies" },
                { val: "500+", label: "Premium Dishes" },
                { val: "30 min", label: "Avg. Delivery" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-3xl font-black text-gray-900">{stat.val}</span>
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">{stat.label}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="w-full py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Section className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-3">Simple Process</h2>
            <h3 className="text-4xl font-black text-gray-900 tracking-tight">How ByteBite Works</h3>
            <p className="mt-4 text-lg text-gray-500 font-medium">From browsing to your first bite, it takes just a few taps.</p>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <Section delay={i * 150} key={step.title}>
                <div className="bg-gray-50 rounded-3xl p-10 text-center relative hover:bg-orange-50 transition-colors duration-500 group border border-gray-100/50">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-orange-500/30 border-4 border-white">
                    {i + 1}
                  </div>
                  <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-500 mt-4">{step.emoji}</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h4>
                  <p className="text-gray-500 leading-relaxed font-medium">{step.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── Menu Highlights ── */}
      <section className="w-full py-24 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <Section>
              <h2 className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-3">Fan Favorites</h2>
              <h3 className="text-4xl font-black text-gray-900 tracking-tight">Most Loved Dishes</h3>
              <p className="mt-4 text-lg text-gray-500 font-medium max-w-xl">Try what thousands of our customers are already enjoying.</p>
            </Section>
            <Section delay={100} className="mt-6 md:mt-0">
              <button 
                onClick={() => navigate("/login")}
                className="px-6 py-3 rounded-full bg-white text-gray-900 font-bold border border-gray-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all"
              >
                View Full Menu →
              </button>
            </Section>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuItems.map((item, i) => (
              <Section delay={i * 100} key={item.name}>
                <div className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100">
                  <div className={`w-full h-48 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-[1.02] transition-transform duration-300 shadow-inner`}>
                    <span className="text-7xl drop-shadow-xl">{item.emoji}</span>
                  </div>
                  <div className="px-2 pb-2">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                    </div>
                    <span className="inline-block px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 text-xs font-bold mb-4">
                      {item.tag}
                    </span>
                    <div className="flex justify-between items-center">
                      <span className="font-black text-xl text-gray-900">{item.price}</span>
                      <button 
                        onClick={() => navigate("/login")}
                        className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-orange-500 transition-colors shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="w-full py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Section className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-3">Customer Reviews</h2>
            <h3 className="text-4xl font-black text-gray-900 tracking-tight">People Love ByteBite</h3>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Section delay={i * 100} key={t.name}>
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                  <div className="flex gap-1 mb-4 text-yellow-400">
                    {[...Array(t.stars)].map((_, idx) => (
                      <svg key={idx} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed font-medium mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                      {t.name[0]}
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900">{t.name}</h5>
                      <span className="text-sm font-medium text-gray-500">{t.city}</span>
                    </div>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="w-full py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-orange-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
          
          <Section className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
              Hungry yet? 🍕
            </h2>
            <p className="text-lg md:text-xl text-orange-100 font-medium mb-10 max-w-2xl mx-auto">
              Join thousands of happy customers. Log in to your account and place your first order today!
            </p>
            <button 
              onClick={() => navigate("/login")}
              className="px-10 py-4 rounded-full bg-white text-orange-600 font-black text-lg shadow-xl hover:scale-105 transition-transform duration-300"
            >
              Order Now →
            </button>
          </Section>
        </div>
      </section>

    </div>
  );
}
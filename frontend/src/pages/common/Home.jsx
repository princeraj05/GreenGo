import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star, Clock, ShoppingBag, Smartphone, MapPin } from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

export default function Home() {
  const navigate = useNavigate();

  const menuItems = [
    { emoji: "🍔", name: "Classic Burger", price: "₹149", tag: "Bestseller", color: "from-brand-400 to-brand-600" },
    { emoji: "🍕", name: "Margherita Pizza", price: "₹199", tag: "Popular", color: "from-orange-400 to-amber-500" },
    { emoji: "🌮", name: "Chicken Tacos", price: "₹129", tag: "Spicy", color: "from-red-400 to-rose-500" },
    { emoji: "🥗", name: "Caesar Salad", price: "₹109", tag: "Healthy", color: "from-emerald-400 to-teal-500" },
  ];

  const testimonials = [
    { name: "Priya S.", city: "Ludhiana", text: "ByteBite changed my life! The food is always piping hot and the delivery is incredibly fast.", stars: 5 },
    { name: "Rahul M.", city: "Chandigarh", text: "The cleanest UI and the best restaurant selection. I order from here almost every single day.", stars: 5 },
    { name: "Anjali K.", city: "Amritsar", text: "Highly recommend! The UI is gorgeous and the customer support is top-notch if you ever need it.", stars: 5 },
  ];

  const steps = [
    { icon: <Smartphone size={40} className="text-brand-500" />, title: "Browse Menu", desc: "Explore hundreds of premium dishes from top-rated restaurants near you." },
    { icon: <ShoppingBag size={40} className="text-brand-500" />, title: "Place Order", desc: "Add to cart and checkout securely in seconds with multiple payment options." },
    { icon: <Clock size={40} className="text-brand-500" />, title: "Fast Delivery", desc: "Track your order live while our riders bring your food hot and fresh." },
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  return (
    <div className="w-full flex flex-col overflow-hidden bg-slate-50">

      {/* ── Hero Section ── */}
      <section className="relative w-full min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Modern Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50 via-slate-50 to-slate-50" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col items-center">
            
            <motion.div variants={fadeIn}>
              <Badge variant="brand" className="mb-8 px-4 py-1.5 shadow-sm">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600"></span>
                </span>
                Now Delivering in Your Area
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeIn} className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[1.05] mb-8">
              Craving Something? <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-orange-500">
                Order in Minutes.
              </span>
            </motion.h1>

            <motion.p variants={fadeIn} className="text-lg md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto font-medium">
              Experience the best local flavors delivered directly to your doorstep. Premium food, lightning-fast delivery, and zero hassle.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
              <Button size="lg" onClick={() => navigate("/login")} className="group">
                Start Ordering
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate("/about")}>
                How it Works
              </Button>
            </motion.div>
            
            <motion.div variants={fadeIn} className="flex justify-center gap-12 mt-20 pt-12 border-t border-slate-200/60 max-w-3xl mx-auto w-full">
              {[
                { val: "10K+", label: "Happy Foodies" },
                { val: "500+", label: "Premium Dishes" },
                { val: "30 min", label: "Avg. Delivery" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-4xl font-black text-slate-900">{stat.val}</span>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="w-full py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <h2 className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-4">Simple Process</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">How ByteBite Works</h3>
            <p className="mt-6 text-xl text-slate-500 font-medium">From browsing to your first bite, it takes just a few taps.</p>
          </motion.div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {steps.map((step, i) => (
              <motion.div variants={fadeIn} key={step.title}>
                <Card hover className="p-10 text-center h-full border-slate-100 group">
                  <div className="mx-auto w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-brand-100 transition-all duration-300">
                    {step.icon}
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h4>
                  <p className="text-slate-500 leading-relaxed font-medium">{step.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Menu Highlights ── */}
      <section className="w-full py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
              <h2 className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-4">Fan Favorites</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Most Loved Dishes</h3>
              <p className="mt-6 text-xl text-slate-500 font-medium max-w-xl">Try what thousands of our customers are already enjoying.</p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="mt-8 md:mt-0">
              <Button variant="secondary" onClick={() => navigate("/login")}>
                View Full Menu <ArrowRight size={16} className="ml-2" />
              </Button>
            </motion.div>
          </div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {menuItems.map((item, i) => (
              <motion.div variants={fadeIn} key={item.name}>
                <Card hover className="p-4 border-slate-100 group overflow-hidden">
                  <div className={`w-full h-56 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500 shadow-inner relative`}>
                    <span className="text-8xl drop-shadow-2xl">{item.emoji}</span>
                  </div>
                  <div className="px-2 pb-2">
                    <h4 className="font-bold text-slate-900 text-xl mb-3">{item.name}</h4>
                    <Badge variant="brand" className="mb-4">{item.tag}</Badge>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-black text-2xl text-slate-900">{item.price}</span>
                      <button 
                        onClick={() => navigate("/login")}
                        className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-brand-500 transition-colors shadow-md hover:scale-105 active:scale-95"
                      >
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="w-full py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-4">Customer Reviews</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">People Love ByteBite</h3>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div variants={fadeIn} key={t.name}>
                <Card className="p-10 border-slate-100">
                  <div className="flex gap-1.5 mb-6 text-yellow-400">
                    {[...Array(t.stars)].map((_, idx) => (
                      <Star key={idx} size={20} fill="currentColor" className="text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 leading-loose font-medium mb-8 text-lg">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-600 font-black text-xl flex items-center justify-center border border-slate-200">
                      {t.name[0]}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-lg">{t.name}</h5>
                      <span className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={14} /> {t.city}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="w-full py-32 px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto rounded-[3rem] bg-slate-950 p-12 md:p-24 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-600/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8">
              Hungry yet?
            </h2>
            <p className="text-xl md:text-2xl text-slate-400 font-medium mb-12 max-w-2xl mx-auto">
              Join thousands of happy customers. Log in to your account and place your first order today!
            </p>
            <Button size="lg" onClick={() => navigate("/login")} className="px-12 py-6 text-xl rounded-full shadow-brand-500/30">
              Order Now <ArrowRight size={24} className="ml-3" />
            </Button>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
import { useEffect, useRef, useState } from "react";

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
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function About() {
  const team = [
    { name: "Arjun Sharma", role: "Founder & CEO", emoji: "👨‍💼", city: "Ludhiana" },
    { name: "Priya Kapoor", role: "Head of Operations", emoji: "👩‍💼", city: "Chandigarh" },
    { name: "Rohan Mehta", role: "Lead Developer", emoji: "👨‍💻", city: "Delhi" },
  ];

  const values = [
    { icon: "🥗", title: "Quality First", desc: "Fresh, hygienic ingredients sourced from trusted local suppliers every day." },
    { icon: "🚀", title: "Speed & Reliability", desc: "We promise on-time delivery. Every order, every time — no exceptions." },
    { icon: "❤️", title: "Customer Love", desc: "Our 10,000+ customers are our biggest motivation. Your joy = our mission." },
    { icon: "🌱", title: "Sustainability", desc: "We use eco-friendly packaging and support local farmers across the region." },
    { icon: "🔒", title: "Hygiene Standards", desc: "All partner restaurants pass our strict hygiene certification process." },
    { icon: "🤝", title: "Community First", desc: "We're proudly rooted here, delivering happiness to every household." },
  ];

  const milestones = [
    { year: "2021", title: "Founded", desc: "Started in a small kitchen with big dreams and 5 restaurant partners." },
    { year: "2022", title: "500 Orders/Day", desc: "Expanded to multiple cities and launched our first app." },
    { year: "2023", title: "10K Customers", desc: "Hit 10,000 active users and completely rebranded to GreenGo." },
    { year: "2024", title: "Nationwide", desc: "Now serving 20+ cities and growing faster than ever." },
  ];

  return (
    <div className="w-full flex flex-col bg-white dark:bg-slate-950 overflow-hidden transition-colors duration-300">

      {/* ── Hero Section ── */}
      <section className="relative w-full min-h-[500px] flex items-center justify-center px-4 py-20 bg-gray-50 dark:bg-slate-900/40 overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Section>
            <span className="inline-block bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold px-4 py-2 rounded-full text-sm mb-6 border border-orange-200 dark:border-orange-900/50 transition-colors">
              🍔 Our Story
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-6">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">GreenGo</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
              Born with passion. Built with precision. Delivering happiness one premium meal at a time.
            </p>
            
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 pt-8 border-t border-gray-200 dark:border-slate-800 transition-colors">
              {[
                { val: "10K+", label: "Customers" }, 
                { val: "20+", label: "Cities" }, 
                { val: "500+", label: "Menu Items" }, 
                { val: "4.9★", label: "Rating" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-3xl font-black text-orange-600 dark:text-orange-500">{stat.val}</span>
                  <span className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-1">{stat.label}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="w-full py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Section>
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-[2.5rem] p-10 md:p-16 text-center border border-orange-100 dark:border-orange-900/40 shadow-xl shadow-orange-100/50 dark:shadow-none relative overflow-hidden transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>
              <span className="text-6xl mb-6 block">🎯</span>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6">Our Mission</h2>
              <p className="text-lg md:text-xl text-gray-600 dark:text-slate-300 leading-relaxed font-medium">
                To make premium quality food accessible to everyone — fast, fresh, and affordable. We connect passionate restaurants with hungry customers, ensuring every meal is a memorable experience.
              </p>
            </div>
          </Section>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="w-full py-24 bg-gray-50 dark:bg-slate-900/40 px-4 sm:px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <Section className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-3">What We Stand For</h2>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Our Core Values</h3>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <Section delay={i * 100} key={v.title}>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 h-full">
                  <span className="text-4xl mb-6 block">{v.icon}</span>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{v.title}</h4>
                  <p className="text-gray-500 dark:text-slate-400 font-medium leading-relaxed">{v.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="w-full py-24 px-4 sm:px-6 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          <Section className="text-center mb-16">
            <h2 className="text-sm font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-3">Our Journey</h2>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Growing Year by Year</h3>
          </Section>

          <div className="flex flex-col gap-8 relative before:absolute before:inset-0 before:ml-[3.5rem] md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gray-100 dark:before:bg-slate-800">
            {milestones.map((m, i) => (
              <Section delay={i * 100} key={m.year} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                {/* Timeline Dot */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white dark:border-slate-950 bg-orange-500 absolute left-[3.5rem] md:left-1/2 -translate-x-1/2 shadow-md group-hover:scale-125 transition-transform z-10"></div>
                
                {/* Year Label for Mobile (hidden on desktop) */}
                <div className="md:hidden w-[3rem] shrink-0 text-right pr-4 font-black text-orange-600 dark:text-orange-500">{m.year}</div>

                {/* Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all">
                  <div className="hidden md:block font-black text-orange-600 dark:text-orange-500 text-lg mb-2">{m.year}</div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{m.title}</h4>
                  <p className="text-gray-500 dark:text-slate-400 font-medium">{m.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="w-full py-24 bg-gray-50 dark:bg-slate-900/40 px-4 sm:px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <Section className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-3">Meet the Team</h2>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">The People Behind GreenGo</h3>
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((t, i) => (
              <Section delay={i * 150} key={t.name}>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm text-center hover:-translate-y-2 transition-transform duration-300">
                  <div className="w-24 h-24 mx-auto bg-orange-50 dark:bg-orange-950/20 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner">
                    {t.emoji}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t.name}</h4>
                  <p className="text-orange-600 dark:text-orange-550 font-bold mb-3">{t.role}</p>
                  <p className="text-gray-400 dark:text-slate-500 font-medium text-sm">📍 {t.city}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

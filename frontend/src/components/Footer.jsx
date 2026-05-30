import { NavLink } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 mt-auto overflow-hidden relative">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">

        {/* Brand */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-xl shadow-lg shadow-orange-500/30">
              🍔
            </span>
            <span className="text-white font-extrabold text-2xl tracking-tight">ByteBite</span>
          </div>
          <p className="text-sm text-slate-400 leading-loose max-w-sm">
            The most premium food delivery platform. We connect you with the finest local restaurants for a seamless, fast, and unforgettable dining experience right at your doorstep.
          </p>
          <div className="flex gap-4 mt-2">
            {[
              { label: "TW", href: "#" },
              { label: "IG", href: "#" },
              { label: "FB", href: "#" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-orange-500 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-orange-500/25"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">Quick Links</h4>
          {[
            { to: "/", label: "Home" },
            { to: "/about", label: "About Us" },
            { to: "/contact", label: "Contact Support" },
            { to: "/login", label: "Customer Login" },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className="text-sm font-medium text-slate-400 hover:text-orange-400 transition-colors w-fit flex items-center gap-2 group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500/0 group-hover:bg-orange-500 transition-colors"></span>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">Get in Touch</h4>
          <a href="mailto:hello@bytebite.com" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-orange-400">📧</span>
            hello@bytebite.com
          </a>
          <a href="tel:+919876543210" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-orange-400">📞</span>
            +91 98765 43210
          </a>
          <p className="text-sm text-slate-400 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-orange-400 shrink-0">📍</span>
            Punjab, India
          </p>
        </div>
      </div>

      {/* Divider & Bottom Bar */}
      <div className="border-t border-slate-800/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-slate-500">
            © {new Date().getFullYear()} ByteBite. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
import { NavLink } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { cn } from "../utils/cn";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 text-slate-300 mt-auto overflow-hidden relative border-t border-slate-900">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">

        {/* Brand */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center text-white text-xl shadow-lg shadow-brand-500/30">
              🍔
            </span>
            <span className="text-white font-extrabold text-2xl tracking-tight">ByteBite</span>
          </div>
          <p className="text-sm text-slate-400 leading-loose max-w-sm">
            The most premium food delivery platform. We connect you with the finest local restaurants for a seamless, fast, and unforgettable dining experience right at your doorstep.
          </p>
          <div className="flex gap-4 mt-2">
            {[
              { 
                icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>, 
                href: "#" 
              },
              { 
                icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>, 
                href: "#" 
              },
              { 
                icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>, 
                href: "#" 
              },
            ].map(({ icon, href }, i) => (
              <a
                key={i}
                href={href}
                className="w-10 h-10 rounded-full bg-slate-900 hover:bg-brand-500 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-300 hover:-translate-y-1 border border-slate-800 hover:border-brand-500 shadow-sm"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-2">Quick Links</h4>
          {[
            { to: "/", label: "Home" },
            { to: "/about", label: "About Us" },
            { to: "/contact", label: "Contact Support" },
            { to: "/login", label: "Customer Login" },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className="text-sm font-medium text-slate-400 hover:text-brand-400 transition-colors w-fit flex items-center gap-2 group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800 group-hover:bg-brand-500 transition-colors" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-2">Get in Touch</h4>
          <a href="mailto:hello@bytebite.com" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-brand-400 border border-slate-800">
              <Mail size={14} />
            </div>
            hello@bytebite.com
          </a>
          <a href="tel:+919876543210" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-brand-400 border border-slate-800">
              <Phone size={14} />
            </div>
            +91 98765 43210
          </a>
          <p className="text-sm text-slate-400 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-brand-400 border border-slate-800 shrink-0">
              <MapPin size={14} />
            </div>
            Punjab, India
          </p>
        </div>
      </div>

      {/* Divider & Bottom Bar */}
      <div className="border-t border-slate-900 relative z-10 bg-slate-950">
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
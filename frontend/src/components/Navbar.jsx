import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "../utils/cn";
import Button from "./ui/Button";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={cn(
      "w-full fixed top-0 z-50 transition-all duration-300",
      scrolled ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-100 py-3" : "bg-transparent py-5"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
            <span className="text-white text-lg">🍔</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">ByteBite</span>
        </NavLink>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 bg-white/50 backdrop-blur-md px-2 py-1.5 rounded-full border border-slate-200/50 shadow-sm">
          {[
            { to: "/", label: "Home" },
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" }
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                "px-5 py-2 rounded-full text-sm font-bold transition-all duration-300",
                isActive 
                  ? "bg-slate-900 text-white" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Login / Actions */}
        <div className="hidden md:flex items-center gap-4">
          <NavLink to="/login">
            <Button variant="primary" className="rounded-full shadow-brand-500/25 group">
              Get Started
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </NavLink>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-sm"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden absolute w-full left-0 top-full overflow-hidden transition-all duration-300 ease-in-out bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-xl",
        open ? "max-h-96 opacity-100 py-6" : "max-h-0 opacity-0 py-0"
      )}>
        <div className="px-6 flex flex-col gap-2">
          {[
            { to: "/", label: "Home" },
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" }
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn(
                "px-5 py-3.5 rounded-2xl text-base font-bold transition-all",
                isActive 
                  ? "bg-brand-50 text-brand-600" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {label}
            </NavLink>
          ))}
          <NavLink to="/login" onClick={() => setOpen(false)} className="mt-4">
            <Button variant="primary" className="w-full py-4 text-base rounded-2xl shadow-brand-500/25">
              Login to Account
            </Button>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight, Sun, Moon } from "lucide-react";
import { cn } from "../utils/cn";
import { useTheme } from "../context/ThemeContext";
import Button from "./ui/Button";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={cn(
      "w-full fixed top-0 z-50 transition-all duration-300",
      scrolled 
        ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm border-b border-slate-100 dark:border-slate-800/50 py-3" 
        : "bg-transparent py-5"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-brand-100/50 dark:border-brand-900/50 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
            <img src="/greengo-logo.png" alt="GreenGo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">GreenGo</span>
        </NavLink>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-2 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-800 shadow-sm">
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
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Login / Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <NavLink to="/login">
            <Button variant="primary" className="rounded-full shadow-brand-500/25 group">
              Get Started
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </NavLink>
        </div>

        {/* Mobile Toggle & Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden absolute w-full left-0 top-full overflow-hidden transition-all duration-300 ease-in-out bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/50 shadow-xl",
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
                  ? "bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
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

import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`w-full sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100 py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">

        {/* Logo */}
        <NavLink
          to="/"
          className="flex items-center gap-2 text-2xl font-extrabold text-gray-900 tracking-tight hover:opacity-80 transition-opacity"
        >
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-lg shadow-lg shadow-orange-500/30">
            🍔
          </span>
          <span>ByteBite</span>
        </NavLink>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-2">
          {["/ Home", "/about About", "/contact Contact"].map((item) => {
            const [path, label] = item.split(" ");
            return (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? "text-orange-600 bg-orange-50"
                      : "text-gray-600 hover:text-orange-600 hover:bg-orange-50/50"
                  }`
                }
              >
                {label}
              </NavLink>
            );
          })}

          {/* Login CTA */}
          <NavLink
            to="/login"
            className="ml-4 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:scale-105 shadow-orange-500/25"
          >
            Login
          </NavLink>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden w-12 h-12 flex flex-col items-center justify-center gap-1.5 rounded-2xl hover:bg-gray-100 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-gray-800 rounded-full transition-all duration-300 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-gray-800 rounded-full transition-all duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-gray-800 rounded-full transition-all duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute w-full left-0 top-full overflow-hidden transition-all duration-300 ease-in-out bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-xl ${open ? "max-h-80 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-6 py-6 flex flex-col gap-2">
          {[
            { to: "/", label: "Home" },
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-5 py-3.5 rounded-2xl text-base font-bold transition-all ${
                  isActive
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          <NavLink
            to="/login"
            onClick={() => setOpen(false)}
            className="mt-4 px-5 py-3.5 rounded-2xl text-base font-bold text-center bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90 transition-all shadow-lg shadow-orange-500/25"
          >
            Login to Account
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
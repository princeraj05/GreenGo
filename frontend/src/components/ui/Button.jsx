import { cn } from "../../utils/cn";

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) {
  const base = "inline-flex items-center justify-center font-bold transition-all duration-300 rounded-xl outline-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-brand-600 text-white shadow-premium hover:bg-brand-700 hover:shadow-premium-hover",
    secondary: "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow",
    danger: "bg-red-500 text-white shadow-premium hover:bg-red-600 hover:shadow-premium-hover",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button 
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export default function Badge({ children, variant = 'gray', className = '' }) {
  const variants = {
    brand: "bg-brand-50 text-brand-600 border border-brand-100",
    success: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border border-amber-100",
    danger: "bg-red-50 text-red-600 border border-red-100",
    gray: "bg-slate-50 text-slate-600 border border-slate-200",
    blue: "bg-blue-50 text-blue-600 border border-blue-100",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

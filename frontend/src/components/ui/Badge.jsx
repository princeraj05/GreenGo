import { cn } from "../../utils/cn";

export default function Badge({ children, variant = 'gray', className = '' }) {
  const variants = {
    brand: "bg-brand-50 text-brand-600 border border-brand-100 dark:bg-brand-950/35 dark:text-brand-300 dark:border-brand-900/60",
    success: "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/60",
    warning: "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/60",
    danger: "bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/60",
    gray: "bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
    blue: "bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/60",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold", variants[variant], className)}>
      {children}
    </span>
  );
}

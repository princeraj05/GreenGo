import { cn } from "../../utils/cn";

export default function Card({ children, className = '', hover = false }) {
  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300",
      hover && "hover:shadow-premium hover:-translate-y-1",
      className
    )}>
      {children}
    </div>
  );
}

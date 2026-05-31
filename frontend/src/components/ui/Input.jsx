import { forwardRef } from 'react';
import { cn } from "../../utils/cn";

const Input = forwardRef(({ className = '', error, ...props }, ref) => {
  return (
    <div className="w-full">
      <input
        ref={ref}
        className={cn(
          "w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all duration-300 focus:ring-4 focus:bg-white text-slate-900 placeholder:text-slate-400",
          error ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

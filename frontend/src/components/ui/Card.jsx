export default function Card({ children, className = '', hover = false }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 ${hover ? 'hover:shadow-premium hover:-translate-y-1' : ''} ${className}`}>
      {children}
    </div>
  );
}

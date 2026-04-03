/**
 * Bouton principal Trass CI — variantes cohérentes avec la charte.
 */
export default function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  disabled,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30 px-6 py-3",
    secondary: "bg-blue-900 text-white hover:bg-blue-800 px-6 py-3",
    outline: "border-2 border-slate-200 bg-white text-slate-800 hover:bg-slate-50 px-6 py-3",
    ghost: "text-slate-600 hover:bg-slate-100 px-3 py-2",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 px-3 py-2",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

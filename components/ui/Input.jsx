export default function Input({ label, className = "", id, ...props }) {
  const inputId = id || (label && label.replace(/\s/g, "-").toLowerCase());
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-bold text-slate-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none transition-all focus:border-blue-500 focus:bg-white ${className}`}
        {...props}
      />
    </div>
  );
}

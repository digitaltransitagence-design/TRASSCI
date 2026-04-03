export default function Textarea({ label, className = "", id, ...props }) {
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
      <textarea
        id={inputId}
        className={`w-full rounded-xl border border-slate-200 bg-white p-4 text-slate-700 outline-none transition-all focus:border-indigo-500 ${className}`}
        {...props}
      />
    </div>
  );
}

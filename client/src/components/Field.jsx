export default function Field({ label, as = "input", options = [], invalid = false, ...props }) {
  const baseClass = `w-full rounded-field border bg-white px-3.5 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 ${
    invalid ? "border-red-500 focus:ring-red-400/40" : "border-line focus:ring-sage/40"
  }`;

  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>}
      {as === "select" ? (
        <select className={baseClass} {...props}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : as === "textarea" ? (
        <textarea className={`${baseClass} min-h-[80px]`} {...props} />
      ) : (
        <input className={baseClass} {...props} />
      )}
    </label>
  );
}

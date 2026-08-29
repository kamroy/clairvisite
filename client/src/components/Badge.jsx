export default function Badge({ variant = "ok", children }) {
  const styles = {
    ok: "bg-sage/10 text-sage",
    pending: "bg-amber/10 text-amber",
    neutral: "bg-line/60 text-muted",
    danger: "bg-red-500/10 text-red-600",
  };
  const dotStyles = {
    ok: "bg-sage",
    pending: "bg-amber",
    neutral: "bg-muted",
    danger: "bg-red-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${styles[variant]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`} />
      {children}
    </span>
  );
}

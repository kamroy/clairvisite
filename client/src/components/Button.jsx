export default function Button({ variant = "primary", className = "", children, ...props }) {
  const base = "w-full rounded-full px-4 py-3 text-sm font-medium transition-colors";
  const styles = {
    primary: "bg-ink text-white hover:bg-ink/90",
    ghost: "bg-white text-ink border border-line hover:bg-paper",
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

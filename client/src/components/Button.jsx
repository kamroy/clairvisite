export default function Button({ variant = "primary", className = "", children, ...props }) {
  // h-12 (48px) : hauteur fixe des boutons dans le design system Stitch ("substantial,
  // tactile feel"), rounded-field (4px) plutôt que pilule — cohérent avec les inputs.
  const base = "flex w-full h-12 items-center justify-center rounded-field px-4 text-sm font-medium transition-colors";
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

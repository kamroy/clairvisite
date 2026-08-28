/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Tokens repris du design system Stitch "Architectural Integrity" (docs/specs/00-overview.md) :
      // Navy profond + Or comme couleurs de marque, radius net (4/8px), duo de polices
      // EB Garamond (titres) / Hanken Grotesk (texte).
      colors: {
        ink: "#1A365D",
        paper: "#F7FAFC",
        line: "#E0E3E5",
        sage: "#5C7A6B",
        muted: "#6B7280",
        amber: "#D4AF37",
      },
      fontFamily: {
        sans: ["Hanken Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["EB Garamond", "Georgia", "serif"],
      },
      borderRadius: {
        card: "8px",
        field: "4px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,20,30,0.04), 0 8px 24px rgba(20,20,30,0.05)",
        frame: "0 2px 4px rgba(20,20,30,0.04), 0 20px 40px rgba(20,20,30,0.06)",
      },
    },
  },
  plugins: [],
};

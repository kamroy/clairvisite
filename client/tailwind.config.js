/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#182A3D",
        paper: "#F7F7F5",
        line: "#EAEAEA",
        sage: "#5C7A6B",
        muted: "#8A8F98",
        amber: "#C9A227",
      },
      borderRadius: {
        card: "20px",
        field: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,20,30,0.04), 0 8px 24px rgba(20,20,30,0.05)",
        frame: "0 2px 4px rgba(20,20,30,0.04), 0 20px 40px rgba(20,20,30,0.06)",
      },
    },
  },
  plugins: [],
};

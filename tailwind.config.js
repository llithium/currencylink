/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        "card-hi": "var(--card-hi)",
        border: "var(--border)",
        "border-hi": "var(--border-hi)",
        ink: "var(--text)",
        text: "var(--text)",
        mid: "var(--mid)",
        dim: "var(--dim)",
        accent: "var(--accent)",
        up: "var(--up)",
        down: "var(--down)",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};

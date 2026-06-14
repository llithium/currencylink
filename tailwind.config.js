const { nextui } = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Hanken Grotesk", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "Times New Roman", "serif"],
      },
      colors: {
        bg: "var(--bg)",
        paper: "var(--paper)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        rule: "var(--rule)",
        hair: "var(--hair)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        up: "var(--up)",
        down: "var(--down)",
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};

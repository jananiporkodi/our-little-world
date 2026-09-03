import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Page background (very light warm-gray) vs card surface (pure white).
        cream: "#FAFAF8",
        paper: "#FFFFFF",
        // "peach" now carries the single red accent used for primary actions.
        peach: { DEFAULT: "#F6DEDC", deep: "#C1443A" },
        // "sage" is now a neutral warm-gray, used for calm/done states (no green).
        sage: { DEFAULT: "#F0EFEB", deep: "#8B8B85" },
        // "lavender" is now a neutral gray, used for tags/chips.
        lavender: { DEFAULT: "#F1F1EF", deep: "#4A4A48" },
        // "blush" mirrors the red accent at a softer tint, used for hearts/favorites.
        blush: { DEFAULT: "#FBEAE9", deep: "#C1443A" },
        // Explicit accent token for new components.
        accent: { DEFAULT: "#C1443A", soft: "#F6DEDC" },
        ink: { DEFAULT: "#232323", soft: "#6E6E6C" },
        bezel: "#232323",
        "cream-dark": "#141414",
        "paper-dark": "#1C1C1C",
      },
      fontFamily: {
        hand: ["var(--font-caveat)", "cursive"],
        patrick: ["var(--font-patrick)", "cursive"],
        sans: ["var(--font-quicksand)", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.75rem",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(10deg)" },
        },
        popIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        floaty: "floaty 5s ease-in-out infinite",
        popIn: "popIn 0.35s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

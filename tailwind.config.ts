import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0c0f1a",
        surface: "#131828",
        surface2: "#1a2035",
        surface3: "#222a44",
        accent: { DEFAULT: "#63b3ed", 2: "#68d391", 3: "#f6ad55" },
        danger: "#fc8181",
        muted: { DEFAULT: "#4a5568", 2: "#718096" },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
        display: ["Syne", "sans-serif"],
      },
      animation: { "fade-in": "fadeIn 0.4s ease" },
      keyframes: { fadeIn: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } } },
    },
  },
  plugins: [],
};
export default config;

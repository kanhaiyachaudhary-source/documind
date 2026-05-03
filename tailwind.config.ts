import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Ocean theme — deep teal background with cyan/aqua accents
        bg: "#051e26",          // deep ocean
        surface: "#0a2e3a",     // surface card
        surface2: "#0f3a4a",    // raised surface
        surface3: "#164a5e",    // higher surface
        accent: {
          DEFAULT: "#06b6d4",   // cyan-500 (primary)
          2: "#22d3ee",         // cyan-400 (lighter)
          3: "#67e8f9",         // cyan-300 (highlights)
        },
        teal: "#14b8a6",        // teal-500
        seafoam: "#5eead4",     // teal-300
        warn: "#fbbf24",
        danger: "#f87171",
        success: "#34d399",
        text: "#e0f2fe",        // sky-100 (primary text)
        muted: {
          DEFAULT: "#5b8aa1",   // dim sea blue
          2: "#7ba9c1",         // lighter dim
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
        display: ["Syne", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease",
        "wave": "wave 8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        wave: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
    },
  },
  plugins: [],
};
export default config;

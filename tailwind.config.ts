import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0a0a0f",
          card: "#111118",
          elevated: "#16161f",
        },
        border: {
          dim: "#1e1e2e",
          bright: "#2a2a3e",
        },
        neon: {
          green: "#00ff88",
          purple: "#7c3aed",
          blue: "#00b4ff",
        },
        risk: {
          safe: "#00ff88",
          moderate: "#fbbf24",
          high: "#f97316",
          scam: "#ff3333",
        },
      },
      fontFamily: {
        mono: ["'Courier New'", "Courier", "monospace"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(0,255,136,0.15)",
        "neon-strong": "0 0 40px rgba(0,255,136,0.25)",
        danger: "0 0 20px rgba(255,51,51,0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        ticker: "ticker 30s linear infinite",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

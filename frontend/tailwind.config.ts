import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#ffffff",
        "surface-container-lowest": "#f8fafc",
        "surface-container-low": "#f1f5f9",
        "surface-container": "#ffffff",
        "surface-container-high": "#e2e8f0",
        "surface-container-highest": "#cbd5e1",
        "surface-bright": "#ffffff",
        "surface-variant": "#f1f5f9",
        "surface-tint": "#0284c7",

        primary: "#0284c7",
        "primary-container": "#e0f2fe",
        "primary-fixed": "#bae6fd",
        "primary-fixed-dim": "#38bdf8",
        "on-primary": "#ffffff",
        "on-primary-container": "#0369a1",

        secondary: "#6366f1",
        "secondary-container": "#e0e7ff",
        "on-secondary": "#ffffff",

        tertiary: "#059669",
        "tertiary-container": "#d1fae5",
        "tertiary-fixed": "#a7f3d0",
        "on-tertiary": "#ffffff",

        error: "#dc2626",
        "error-container": "#fee2e2",
        "on-error": "#ffffff",
        "on-error-container": "#991b1b",

        "on-surface": "#0f172a",
        "on-surface-variant": "#475569",
        outline: "#94a3b8",
        "outline-variant": "#e2e8f0",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

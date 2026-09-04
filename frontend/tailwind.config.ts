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
        surface: "#0f131c",
        "surface-container-lowest": "#0a0e17",
        "surface-container-low": "#181b25",
        "surface-container": "#1c1f29",
        "surface-container-high": "#262a34",
        "surface-container-highest": "#31353f",
        "surface-bright": "#353943",
        "surface-variant": "#31353f",
        "surface-tint": "#4cd7f6",

        primary: "#4cd7f6",
        "primary-container": "#06b6d4",
        "primary-fixed": "#acedff",
        "primary-fixed-dim": "#4cd7f6",
        "on-primary": "#003640",
        "on-primary-container": "#00424f",

        secondary: "#d0bcff",
        "secondary-container": "#571bc1",
        "on-secondary": "#3c0091",

        tertiary: "#4edea3",
        "tertiary-container": "#1bbd85",
        "tertiary-fixed": "#6ffbbe",
        "on-tertiary": "#003824",

        error: "#ffb4ab",
        "error-container": "#93000a",
        "on-error": "#690005",
        "on-error-container": "#ffdad6",

        "on-surface": "#dfe2ef",
        "on-surface-variant": "#bcc9cd",
        outline: "#869397",
        "outline-variant": "#3d494c",
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

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6C3CE1",
          dark: "#5330B4",
        },
        secondary: "#F59E0B",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        background: "#0F0F13",
        surface: "#1A1A24",
        surface2: "#22222F",
        border: "#2E2E3F",
        text: {
          primary: "#F1F1F3",
          muted: "#8B8BA0",
        },
      },
      borderRadius: {
        xl: "0.75rem",
        lg: "0.5rem",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

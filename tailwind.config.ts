import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: "#006e2f",
        "primary-container": "#22c55e",
        "on-primary": "#ffffff",
        surface: "#f3fcef",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#edf6ea",
        "surface-container": "#e8f0e4",
        "surface-container-high": "#e2ebde",
        "on-surface": "#161d16",
        "on-surface-variant": "#3d4a3d",
        "on-secondary-container": "#60645f",
        "outline-variant": "#bccbb9",
        outline: "#6d7b6c",
        secondary: "#5b5f5b",
        error: "#dc2626",
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        }
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
      fontFamily: {
        geist: ["var(--font-geist)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "1.2", letterSpacing: "-0.04em", fontWeight: "700" }],
        "display-sm": ["32px", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "700" }],
        "headline-lg": ["24px", { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-sm": ["18px", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "1.5", letterSpacing: "0.05em", fontWeight: "600", textTransform: "uppercase" }],
        "mono-data": ["14px", { lineHeight: "1.5", letterSpacing: "-0.01em", fontWeight: "500" }],
      }
    },
  },
  plugins: [],
  darkMode: "class", 
};
export default config;
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
        primary: "var(--primary-color)",
        "primary-container": "var(--primary-container-color)",
        "on-primary": "var(--on-primary-color)",
        surface: "var(--bg-primary)",
        "surface-container-lowest": "var(--bg-card)",
        "surface-container-low": "var(--bg-sidebar)",
        "surface-container": "var(--bg-card)",
        "surface-container-high": "var(--bg-card)",
        "on-surface": "var(--text-primary)",
        "on-surface-variant": "var(--text-secondary)",
        "on-secondary-container": "var(--text-muted)",
        "outline-variant": "var(--border-color)",
        outline: "var(--border-color)",
        secondary: "var(--text-secondary)",
        error: "var(--error-color)",
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
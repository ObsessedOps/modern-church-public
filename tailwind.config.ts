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
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ["DM Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        tiny: ["0.625rem", { lineHeight: "0.8125rem" }],
        "tiny-plus": ["0.6875rem", { lineHeight: "0.875rem" }],
        "xs-plus": ["0.8125rem", { lineHeight: "1.125rem" }],
        "sm-plus": ["0.9375rem", { lineHeight: "1.375rem" }],
      },
      colors: {
        // Dark surfaces
        dark: {
          50: "#e6e7eb",
          100: "#d0d2db",
          200: "#b7bac4",
          300: "#838794",
          400: "#4c4f57",
          450: "#383a41",
          500: "#2a2c32",
          600: "#232429",
          700: "#1c1d21",
          750: "#1a1b1f",
          800: "#15161a",
          900: "#0e0f11",
        },
        // Brand surfaces
        surface: {
          primary: "var(--bg-primary)",
          DEFAULT: "var(--bg-surface)",
          2: "var(--bg-surface-2)",
        },
        // Primary accent — violet
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        // Grace — church AI accent (replaces Crystal)
        grace: {
          DEFAULT: "#7C3AED",
          light: "#8B5CF6",
          dark: "#6D28D9",
        },
        // Alert — rose (replaces Radar)
        alert: {
          DEFAULT: "#E11D48",
          light: "#FB7185",
          dark: "#BE123C",
        },
        // Semantic colors
        success: {
          DEFAULT: "#10B981",
          light: "#34D399",
          dark: "#059669",
        },
        error: {
          DEFAULT: "#EF4444",
          light: "#F87171",
          dark: "#DC2626",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          dark: "#D97706",
        },
        info: {
          DEFAULT: "#0EA5E9",
          light: "#38BDF8",
          dark: "#0284C7",
        },
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        badge: "6px",
      },
      boxShadow: {
        soft: "rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px",
        "soft-dark": "0 3px 10px 0 rgb(25 25 25 / 30%)",
      },
      spacing: {
        "sidebar-main": "5rem",
        "sidebar-prime": "240px",
        "sidebar-full": "calc(5rem + 240px)",
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "toast-in": "toast-in 0.3s ease-out",
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateX(100%)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

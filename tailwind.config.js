/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./views/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./constants/**/*.{ts,tsx}",
    "./programs/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      // Approved preview: quiet panels, compact controls, and larger dialog corners.
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      colors: {
        primary: {
          50:  "rgb(var(--primary-50)  / <alpha-value>)",
          100: "rgb(var(--primary-100) / <alpha-value>)",
          200: "rgb(var(--primary-200) / <alpha-value>)",
          300: "rgb(var(--primary-300) / <alpha-value>)",
          400: "rgb(var(--primary-400) / <alpha-value>)",
          500: "rgb(var(--primary-500) / <alpha-value>)",
          600: "rgb(var(--primary-600) / <alpha-value>)",
          700: "rgb(var(--primary-700) / <alpha-value>)",
          800: "rgb(var(--primary-800) / <alpha-value>)",
          900: "rgb(var(--primary-900) / <alpha-value>)",
        },
        surface: {
          app: "rgb(var(--surface-app) / <alpha-value>)",
          base: "rgb(var(--surface-base) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated) / <alpha-value>)",
        },
        border: {
          subtle: "rgb(var(--border-subtle) / <alpha-value>)",
          strong: "rgb(var(--border-strong) / <alpha-value>)",
        },
      },
      textColor: {
        muted: "rgb(var(--text-muted) / <alpha-value>)",
        secondary: "rgb(var(--text-secondary) / <alpha-value>)",
        accent: "rgb(var(--accent-text) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["'Inter Variable'", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
      },
      // ── Motion tokens (Fase 1) ─────────────────────────────────────────────
      // Use these instead of raw duration-100/200/300/400/500.
      transitionDuration: {
        fast:  "150ms",
        base:  "200ms",
        slow:  "300ms",
        sheet: "400ms",
      },
      transitionTimingFunction: {
        // out-expo — natural, Apple/Linear feel
        natural: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      // ── Z-index tokens (Fase 1) ────────────────────────────────────────────
      // Single source of truth. Never use z-[NNN] arbitrary values.
      // Order (low → high):
      //   base < nav < dropdown < sheet < modal < toast < confirm < tutorial.
      zIndex: {
        nav:         "30",
        dropdown:    "70",
        sheet:       "80",
        modal:       "90",
        toast:       "100",
        confirm:     "110", // ConfirmModal / Paywall — must overlay other modals
        celebration: "120", // PR celebration — above confirm
        tutorial:    "9999",
      },
      animation: {
        "in-up":            "fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        "fade-in-up":       { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [
    function({ addVariant }) {
      addVariant('effects-reduced', '[data-effects="reduced"] &');
      addVariant('effects-balanced', '[data-effects="balanced"] &');
    },
  ],
}
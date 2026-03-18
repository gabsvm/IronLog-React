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
  ],
  darkMode: "class",
  theme: {
    extend: {
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
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        "in-up":            "fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "spring-in":        "spring-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "bounce-cta":       "bounce-cta 1.8s ease-in-out infinite",
        "pulse-glow-green": "pulse-glow-green 1.5s ease-in-out infinite",
        "slide-in-right":   "slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-left":    "slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        "fade-in-up":       { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "spring-in":        { "0%": { opacity: "0", transform: "translateY(100%)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "bounce-cta":       { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.06)" } },
        "pulse-glow-green": { "0%, 100%": { boxShadow: "0 0 12px #22c55e66" }, "50%": { boxShadow: "0 0 28px #22c55ecc, 0 0 8px #22c55e66" } },
        "slide-in-right":   { "0%": { opacity: "0", transform: "translateX(40px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        "slide-in-left":    { "0%": { opacity: "0", transform: "translateX(-40px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
}
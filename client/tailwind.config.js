/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        display: ['"Fraunces"', "Georgia", "serif"],
      },
      colors: {
        // Warm neutral used everywhere the app says "gray"
        gray: {
          50: "#faf8f5",
          100: "#f3f0ea",
          200: "#e8e3da",
          300: "#d6d0c4",
          400: "#9b958a",
          500: "#736e65",
          600: "#59554d",
          700: "#44413b",
          800: "#2d2b27",
          900: "#1f1d1a",
        },
        // Calm sage-teal brand colour
        brand: {
          50: "#eff7f4",
          100: "#d9ede6",
          200: "#b5dacd",
          300: "#88c0ae",
          400: "#5ba18c",
          500: "#3f8572",
          600: "#316b5c",
          700: "#29574c",
          800: "#23463e",
          900: "#1e3a34",
        },
        peach: {
          100: "#fdebdd",
          200: "#f9d3b8",
          300: "#f3b48a",
        },
        lavender: {
          100: "#ece8f7",
          200: "#d9d1f0",
          300: "#bcaee3",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31, 29, 26, 0.04), 0 4px 16px rgba(31, 29, 26, 0.06)",
        lift: "0 2px 4px rgba(31, 29, 26, 0.05), 0 12px 32px rgba(31, 29, 26, 0.10)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(20px, -16px) scale(1.05)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        float: "float 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

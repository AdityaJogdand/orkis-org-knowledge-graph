/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      colors: {
        cream: {
          50: "#FDFCFA",
          100: "#F6F2EA",
          200: "#EFE7D8",
        },
        orkis: {
          50: "#FDF1EA",
          100: "#FBE1D0",
          200: "#F5C3A3",
          300: "#EEA476",
          400: "#E68A5C",
          500: "#D97757",
          600: "#C25F3F",
          700: "#A04A30",
          800: "#7A3A26",
          dark: "#231F1A",
        },
      },
      backgroundImage: {
        "orkis-gradient":
          "linear-gradient(135deg, #C25F3F 0%, #D97757 45%, #F0A878 100%)",
        "orkis-metallic":
          "linear-gradient(120deg, #7A3A26 0%, #C25F3F 22%, #F0A878 42%, #FBD9BC 52%, #EE9B67 62%, #A04A30 82%, #6B2E1D 100%)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: 0.35, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.4)" },
        },
        drift: {
          "0%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(6px,-8px)" },
          "100%": { transform: "translate(0,0)" },
        },
        sheen: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        revolve: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.5s ease-out both",
        pulseDot: "pulseDot 2.4s ease-in-out infinite",
        drift: "drift 6s ease-in-out infinite",
        sheen: "sheen 3.5s linear infinite",
        revolve: "revolve 16s linear infinite",
      },
      backgroundSize: {
        "sheen-size": "220% 100%",
      },
    },
  },
  plugins: [],
};
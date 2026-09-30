/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./index.html",
  ],
  darkMode: "class", // enables class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: "#0ea5e9", // sky-500
        accent: "#fbbf24", // amber-400
      },
    },
  },
  plugins: [],
};


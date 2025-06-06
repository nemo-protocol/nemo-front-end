import animate from "tailwindcss-animate"
import containerQueries from "@tailwindcss/container-queries"

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"SeasonSansTRIAL"', "sans-serif"],
        serif: ['"SeasonSerifTRIAL"', "serif"],
      },
      screens: {
        xs: "30rem",
      },
      spacing: {
        4.5: "1.125rem",
        7.5: "1.875rem",
      },
      colors: {
        "blue-primary": "#1954FF",
        "green-primary": "#44E0C3",
        "light-gray": "#FCFCFC",
        "line-gray": "#3F3F3F",
        "dark-gray": "#0E1520",
      },
    },
  },
  corePlugins: {
    container: true,
  },
  plugins: [animate, containerQueries],
}

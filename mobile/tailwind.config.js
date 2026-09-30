/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        "dark-green": "#005114",
        "accent-green": "#34C759",
        "light-green": "#E8FEEE",

        "heart-pink": "#FFE0E1",
        "oxygen-blue": "#E0ECFF",
        "light-yellow": "#FBFCC4",
        "sleep-green": "#E8FEEE",
      },

      fontFamily: {
        coiny: ["Coiny"],
      },
    },
  },

  plugins: [],
};

/** @type {import('tailwindcss').Config} */
const brand = require('./config/brand');

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Branzia brand palette — replaces indigo throughout the app.
        // Edit config/brand.js to change the brand colour everywhere at once.
        indigo: brand.palette,
      },
    },
  },
  plugins: [],
};

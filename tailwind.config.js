/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Branzia brand palette — replaces indigo throughout the app
        indigo: {
          50:  '#E9F9F1',
          100: '#D1F3E6',
          200: '#9FE1CB',
          300: '#5DCAA5',
          400: '#2EB88A',
          500: '#1D9E75',
          600: '#1D9E75',
          700: '#0F6E56',
          800: '#004E3B',
          900: '#003D2E',
          950: '#002D23',
        },
      },
    },
  },
  plugins: [],
};

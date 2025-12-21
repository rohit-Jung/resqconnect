/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './app/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#E13333',
        foreground: '#ffffff',
      },
      fontFamily: {
        chau: ['ChauPhilomeneOne'],
        inter: ['Inter'],
      },
    },
  },
  plugins: [],
};

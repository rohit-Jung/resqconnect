/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,tsx}',
    './components/**/*.{js,ts,tsx}',
    './screens/**/*.{js,ts,tsx}',
    './App.{js,ts,tsx}',
  ],

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

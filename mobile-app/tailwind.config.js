/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#e11d48', // Warm red accent matching screenshot button
          indigo: '#6366f1',
          cyan: '#06b6d4',
          darkBg: '#0a0a0f',
          lightBg: '#f8f9fa',
          cardDark: '#12121a',
          cardLight: '#ffffff',
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-funny': 'spin 2s infinite ease-in-out alternate'
      }
    },
  },
  plugins: [],
}


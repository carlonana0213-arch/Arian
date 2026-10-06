/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBase: '#121212',
        darkSurface: '#1e1e1e',
        darkElevated: '#2a2a2a',
        accentPurple: '#9d4edd',
        accentPink: '#ff477e',
        accentYellow: '#ffd166',
        statusApproved: '#06d6a0',
      }
    },
  },
  plugins: [],
}
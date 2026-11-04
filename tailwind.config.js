/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rostech: {
          blue: '#0054A6',
          dark: '#1A1A1A',
          danger: '#DC2626',
          warning: '#F59E0B',
          success: '#16A34A'
        }
      }
    },
  },
  plugins: [],
}
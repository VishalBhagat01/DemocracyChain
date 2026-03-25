/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          900: '#0a0a1a',
          800: '#111827',
          700: '#1f2937',
          600: '#374151',
        }
      }
    },
  },
  plugins: [],
}

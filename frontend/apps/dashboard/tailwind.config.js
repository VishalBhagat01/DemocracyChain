/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warmer, more organic primary palette
        primary: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b9dcfe',
          300: '#7cc2fd',
          400: '#36a4f9',
          500: '#0c87ea',
          600: '#0069c8',
          700: '#0154a2',
          800: '#064886',
          900: '#0b3d6f',
        },
        // Warmer grays with subtle warmth
        surface: {
          50: '#fafaf9',   // Warm off-white
          100: '#f4f4f2',  // Light cream
          200: '#e7e5e2',  // Warm border light
          300: '#d5d2cd',  // Warm border medium
          400: '#a19c94',  // Warm muted text
          500: '#716d66',  // Warm secondary text
          600: '#55524d',  // Warm primary text muted
          700: '#3d3b38',  // Warm primary text
          800: '#27251f',  // Warm headings
          900: '#141310',  // High contrast
        },
        // Accent colors
        accent: {
          green: '#16a34a',
          amber: '#d97706',
          red: '#dc2626',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        'card': '0 1px 2px -1px rgb(0 0 0 / 0.08), 0 2px 4px 0 rgb(0 0 0 / 0.04)',
        'elevated': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}

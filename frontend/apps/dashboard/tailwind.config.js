/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light theme primary palette
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Neutral grays for light theme
        surface: {
          50: '#f8fafc',   // Main background
          100: '#f1f5f9',  // Secondary background
          200: '#e2e8f0',  // Border light
          300: '#cbd5e1',  // Border medium
          400: '#94a3b8',  // Muted text
          500: '#64748b',  // Secondary text
          600: '#475569',  // Primary text muted
          700: '#334155',  // Primary text
          800: '#1e293b',  // Headings
          900: '#0f172a',  // High contrast
        },
        // Legacy dark palette (for reference/dark mode future)
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          900: '#0a0a1a',
          800: '#111827',
          700: '#1f2937',
          600: '#374151',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgb(0 0 0 / 0.07), 0 10px 20px -2px rgb(0 0 0 / 0.04)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
}

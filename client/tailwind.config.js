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
          navy: '#0F172A',
          indigo: '#4338CA',
          teal: '#14B8A6',
          sky: '#38BDF8',
          bgLight: '#F8FAFC',
          borderLight: '#E2E8F0',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#4338CA', // brand-indigo
          600: '#3730a3',
          700: '#312e81',
          800: '#1e1b4b',
          900: '#0f172a',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617', // Main background dark
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'], // Update font display to Inter as per rounded modern typography guidelines
      },
      boxShadow: {
        glass: '0 8px 30px rgba(0, 0, 0, 0.08)',
        glow: '0 0 15px rgba(67, 56, 202, 0.25)',
        'glow-teal': '0 0 15px rgba(20, 184, 166, 0.25)',
      }
    },
  },
  plugins: [],
}

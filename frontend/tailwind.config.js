/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff5f2',
          100: '#ffe8e0',
          200: '#ffd3c4',
          300: '#ffb59c',
          400: '#ff8a66',
          500: '#ff6233',
          600: '#f5410f',
          700: '#cc2f06',
          800: '#a32809',
          900: '#85240c',
          950: '#470f03',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 0 3px rgba(0,0,0,0.02)',
        'premium-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 0 5px rgba(0,0,0,0.03)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
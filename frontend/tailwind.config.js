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
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444', 
          600: '#dc2626', // Red vibrant premium
          700: '#b91c1c',
          900: '#7f1d1d',
        },
        accent: {
          500: '#f87171',
        },
        dark: {
          bg: '#0F1115', // Premium dark
          card: '#161920', // Slightly lighter dark
          border: '#2A2E39', // Dark border
          text: '#F8FAFC' // White text
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 8px 30px -4px rgba(0,0,0,0.1)',
        'premium-hover': '0 20px 40px -10px rgba(220, 38, 38, 0.15)',
        'dark-premium': '0 8px 30px -4px rgba(0,0,0,0.5)',
        'dark-premium-hover': '0 20px 40px -10px rgba(220, 38, 38, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

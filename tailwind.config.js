/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6faff',
          100: '#ccf5ff',
          200: '#99ebff',
          300: '#4dd9ff',
          400: '#00D2FF',
          500: '#00B8E6',
          600: '#0099BF',
          700: '#007A99',
          800: '#005C73',
          900: '#003D4D',
        },
        accent: {
          50: '#f3f0ff',
          100: '#e7e0ff',
          200: '#cfbfff',
          300: '#b09fff',
          400: '#7A5FFF',
          500: '#6B4FE6',
          600: '#5C3FCC',
          700: '#4D2FB3',
          800: '#3E1F99',
          900: '#2F0F80',
        },
        aurora: {
          ice: '#00D2FF',
          purple: '#7A5FFF',
          pink: '#FF6B9D',
          green: '#C3FF68',
          dark: '#0F0F1A',
          deeper: '#1A1A2E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'float-slower': 'floatSlower 10s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'aurora-breathe': 'auroraBreathe 8s ease-in-out infinite',
        'aurora-drift': 'auroraDrift 10s ease-in-out infinite',
        'aurora-pulse': 'auroraPulse 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 10px) scale(0.95)' },
        },
        floatSlower: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(-40px, 20px) rotate(5deg)' },
          '50%': { transform: 'translate(20px, -30px) rotate(-3deg)' },
          '75%': { transform: 'translate(30px, 15px) rotate(2deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #00D2FF, 0 0 10px #00D2FF' },
          '100%': { boxShadow: '0 0 20px #00D2FF, 0 0 30px #7A5FFF' },
        },
        auroraBreathe: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.1)' },
        },
        auroraDrift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '0.3' },
          '33%': { transform: 'translate(50px, -30px) rotate(120deg)', opacity: '0.5' },
          '66%': { transform: 'translate(-30px, 20px) rotate(240deg)', opacity: '0.4' },
        },
        auroraPulse: {
          '0%, 100%': { opacity: '0.2', filter: 'blur(60px)' },
          '50%': { opacity: '0.5', filter: 'blur(80px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

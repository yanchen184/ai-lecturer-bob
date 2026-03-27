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
          50: '#e5f2ff',
          100: '#cce5ff',
          200: '#99ccff',
          300: '#66b2ff',
          400: '#339aff',
          500: '#007AFF',
          600: '#0066dd',
          700: '#0052b3',
          800: '#003d88',
          900: '#00295e',
        },
        accent: {
          50: '#f3e8fc',
          100: '#e7d1f9',
          200: '#cfa3f3',
          300: '#b775ed',
          400: '#AF52DE',
          500: '#9B3DC8',
          600: '#8028B2',
          700: '#66209C',
          800: '#4D1886',
          900: '#331070',
        },
        success: {
          400: '#34C759',
          500: '#2daf4e',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.12)',
          'white-hover': 'rgba(255, 255, 255, 0.18)',
          border: 'rgba(255, 255, 255, 0.2)',
          'border-light': 'rgba(255, 255, 255, 0.3)',
          surface: 'rgba(255, 255, 255, 0.06)',
        },
        surface: {
          900: '#1a1a2e',
          800: '#1e1e32',
          700: '#232338',
          600: '#28283e',
          500: '#2d2d44',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'Noto Sans TC', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'glass': '24px',
        'glass-lg': '32px',
        'glass-sm': '16px',
      },
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out infinite 4s',
        'glow-soft': 'glowSoft 4s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        'spring-in': 'springIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'blob': 'blob 10s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-15px) rotate(1deg)' },
          '66%': { transform: 'translateY(-8px) rotate(-1deg)' },
        },
        glowSoft: {
          '0%': { boxShadow: '0 0 20px rgba(0, 122, 255, 0.1), 0 0 40px rgba(0, 122, 255, 0.05)' },
          '100%': { boxShadow: '0 0 30px rgba(175, 82, 222, 0.15), 0 0 60px rgba(175, 82, 222, 0.08)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        springIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        blob: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '25%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '50%': { borderRadius: '50% 60% 30% 60% / 30% 40% 70% 60%' },
          '75%': { borderRadius: '60% 30% 50% 40% / 70% 50% 40% 60%' },
        },
      },
      backdropBlur: {
        'glass': '40px',
        'glass-heavy': '60px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

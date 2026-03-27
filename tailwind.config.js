/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bold: {
          bg: '#0A0A0A',
          surface: '#111111',
          border: '#1A1A1A',
          text: '#FAFAFA',
          muted: '#808080',
          accent: '#FF3D00',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Space Grotesk"', '"Noto Sans TC"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(4.5rem, 10vw, 7.5rem)', { lineHeight: '0.9', letterSpacing: '-0.04em' }],
        'display-lg': ['clamp(3rem, 6vw, 5rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.5rem, 3vw, 2rem)', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
      },
      letterSpacing: {
        'ultra-tight': '-0.04em',
        'tight-bold': '-0.02em',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
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

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#e6fff3', 100: '#b3ffe0', 200: '#80ffcc', 300: '#4dffb9', 400: '#00FF88', 500: '#00DD77', 600: '#00BB66', 700: '#009955', 800: '#007744', 900: '#005533' },
        accent: { 50: '#f0ebff', 100: '#d9ccff', 200: '#c2adff', 300: '#ab8eff', 400: '#7B61FF', 500: '#6A50E0', 600: '#5940C0', 700: '#4830A0', 800: '#372080', 900: '#261060' },
        neon: { green: '#00FF88', purple: '#7B61FF', blue: '#00D4FF', pink: '#FF61D8' },
        surface: { 900: '#0A0E17', 800: '#0F1521', 700: '#141C2B', 600: '#1A2435', 500: '#1F2D40' },
      },
      fontFamily: { sans: ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'Fira Code', 'monospace'] },
      animation: {
        'float': 'float 6s ease-in-out infinite', 'glow': 'glow 2s ease-in-out infinite alternate', 'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out', 'fade-in': 'fadeIn 0.6s ease-out', 'scan-line': 'scanLine 8s linear infinite',
        'circuit-pulse': 'circuitPulse 4s ease-in-out infinite', 'neon-flicker': 'neonFlicker 3s ease-in-out infinite', 'border-glow': 'borderGlow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-20px)' } },
        glow: { '0%': { boxShadow: '0 0 5px #00FF88, 0 0 10px #00FF88' }, '100%': { boxShadow: '0 0 20px #00FF88, 0 0 40px #00FF88' } },
        glowPulse: { '0%, 100%': { boxShadow: '0 0 5px rgba(0,255,136,0.3), 0 0 10px rgba(0,255,136,0.1)' }, '50%': { boxShadow: '0 0 20px rgba(0,255,136,0.6), 0 0 40px rgba(0,255,136,0.3)' } },
        slideUp: { '0%': { transform: 'translateY(30px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        scanLine: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
        circuitPulse: { '0%, 100%': { opacity: '0.3' }, '50%': { opacity: '1' } },
        neonFlicker: { '0%, 100%': { opacity: '1' }, '92%': { opacity: '1' }, '93%': { opacity: '0.3' }, '94%': { opacity: '1' }, '96%': { opacity: '0.5' }, '97%': { opacity: '1' } },
        borderGlow: { '0%': { borderColor: 'rgba(0,255,136,0.2)' }, '50%': { borderColor: 'rgba(123,97,255,0.4)' }, '100%': { borderColor: 'rgba(0,212,255,0.2)' } },
      },
    },
  },
  plugins: [],
}

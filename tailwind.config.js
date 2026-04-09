/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* === Base / Shared === */
        primary: {
          50: '#e6fff3', 100: '#b3ffe0', 200: '#80ffcc', 300: '#4dffb9',
          400: '#00FF88', 500: '#00DD77', 600: '#00BB66', 700: '#009955',
          800: '#007744', 900: '#005533',
        },
        accent: {
          50: '#f0ebff', 100: '#d9ccff', 200: '#c2adff', 300: '#ab8eff',
          400: '#7B61FF', 500: '#6A50E0', 600: '#5940C0', 700: '#4830A0',
          800: '#372080', 900: '#261060',
        },
        neon: { green: '#00FF88', purple: '#7B61FF', blue: '#00D4FF', pink: '#FF61D8' },
        surface: {
          900: '#0A0E17', 800: '#0F1521', 700: '#141C2B', 600: '#1A2435', 500: '#1F2D40',
        },

        /* === Bento Box === */
        bento: {
          bg: '#FFFFFF', card: '#F5F5F7', 'card-hover': '#EFEFF1',
          text: '#1D1D1F', 'text-secondary': '#6E6E73', border: '#E8E8ED',
        },

        /* === Swiss Modernism (Neubrutalism) === */
        bold: {
          bg: '#FAFAFA', surface: '#FFFFFF', border: '#000000',
          text: '#000000', muted: '#333333', accent: '#FFEB3B',
          red: '#FF5252', blue: '#2196F3', green: '#4CAF50',
        },

        /* === Aurora === */
        aurora: {
          ice: '#00D2FF', purple: '#7A5FFF', pink: '#FF6B9D',
          green: '#C3FF68', dark: '#0F0F1A', deeper: '#1A1A2E',
        },

        /* === Liquid Glass === */
        glass: {
          white: 'rgba(255, 255, 255, 0.12)',
          'white-hover': 'rgba(255, 255, 255, 0.18)',
          border: 'rgba(255, 255, 255, 0.2)',
          'border-light': 'rgba(255, 255, 255, 0.3)',
          surface: 'rgba(255, 255, 255, 0.06)',
        },
        success: { 400: '#34C759', 500: '#2daf4e' },
      },

      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
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
        '18': '4.5rem', '22': '5.5rem', '26': '6.5rem', '30': '7.5rem',
      },

      borderRadius: {
        'bento': '1.25rem', 'bento-lg': '1.75rem',
        'glass': '24px', 'glass-lg': '32px', 'glass-sm': '16px',
      },

      boxShadow: {
        'bento': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'bento-hover': '0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
      },

      backdropBlur: {
        'glass': '40px', 'glass-heavy': '60px',
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },

      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'float-slower': 'floatSlower 10s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out infinite 4s',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'glow-soft': 'glowSoft 4s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'scan-line': 'scanLine 8s linear infinite',
        'data-flow': 'dataFlow 20s linear infinite',
        'circuit-pulse': 'circuitPulse 4s ease-in-out infinite',
        'neon-flicker': 'neonFlicker 3s ease-in-out infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite alternate',
        'aurora-breathe': 'auroraBreathe 8s ease-in-out infinite',
        'aurora-drift': 'auroraDrift 10s ease-in-out infinite',
        'aurora-pulse': 'auroraPulse 6s ease-in-out infinite',
        'spring-in': 'springIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'blob': 'blob 10s ease-in-out infinite',
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
          '0%': { boxShadow: '0 0 5px #00FF88, 0 0 10px #00FF88' },
          '100%': { boxShadow: '0 0 20px #00FF88, 0 0 40px #00FF88' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,255,136,0.3), 0 0 10px rgba(0,255,136,0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(0,255,136,0.6), 0 0 40px rgba(0,255,136,0.3)' },
        },
        glowSoft: {
          '0%': { boxShadow: '0 0 20px rgba(0, 122, 255, 0.1), 0 0 40px rgba(0, 122, 255, 0.05)' },
          '100%': { boxShadow: '0 0 30px rgba(175, 82, 222, 0.15), 0 0 60px rgba(175, 82, 222, 0.08)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        dataFlow: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
        circuitPulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        neonFlicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.3' },
          '94%': { opacity: '1' },
          '96%': { opacity: '0.5' },
          '97%': { opacity: '1' },
        },
        borderGlow: {
          '0%': { borderColor: 'rgba(0,255,136,0.2)' },
          '50%': { borderColor: 'rgba(123,97,255,0.4)' },
          '100%': { borderColor: 'rgba(0,212,255,0.2)' },
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
    },
  },
  plugins: [],
}

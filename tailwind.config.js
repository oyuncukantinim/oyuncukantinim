/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#050507',
          800: '#0a0a0f',
          700: '#111118',
          600: '#1a1a24',
          500: '#24243a',
        },
        neon: {
          purple: '#a855f7',
          cyan: '#06b6d4',
          pink: '#ec4899',
          green: '#22c55e',
        },
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(168,85,247,0.3), 0 0 60px rgba(168,85,247,0.1)',
        'neon-cyan': '0 0 20px rgba(6,182,212,0.3), 0 0 60px rgba(6,182,212,0.1)',
        'neon-pink': '0 0 20px rgba(236,72,153,0.3), 0 0 60px rgba(236,72,153,0.1)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(168,85,247,0.2), 0 0 20px rgba(168,85,247,0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(168,85,247,0.4), 0 0 60px rgba(168,85,247,0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
        },
        neon: {
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          pink: '#ec4899',
          green: '#10b981',
        },
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(139,92,246,0.15), 0 4px 20px rgba(139,92,246,0.1)',
        'neon-cyan': '0 0 20px rgba(6,182,212,0.15), 0 4px 20px rgba(6,182,212,0.1)',
        'neon-pink': '0 0 20px rgba(236,72,153,0.15), 0 4px 20px rgba(236,72,153,0.1)',
        'neon-green': '0 0 20px rgba(16,185,129,0.15), 0 4px 20px rgba(16,185,129,0.1)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(139,92,246,0.1)' },
          '100%': { boxShadow: '0 0 25px rgba(139,92,246,0.25)' },
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

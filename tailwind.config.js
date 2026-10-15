/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#080c14',
          card: '#0f172a',
          border: '#1e293b',
          accent: '#06b6d4', // cyan
          neon: '#3b82f6',   // blue
          purple: '#8b5cf6', // purple
          emerald: '#10b981',// green
          amber: '#f59e0b',  // warning amber
          rose: '#f43f5e',   // alert rose
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 6s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))' },
          '50%': { opacity: '0.9', filter: 'drop-shadow(0 0 16px rgba(59, 130, 246, 0.9))' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}

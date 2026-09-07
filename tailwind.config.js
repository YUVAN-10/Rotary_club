/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rotary: {
          navy: '#0C2340',
          darkBlue: '#0F2C59',
          royal: '#1E3A8A',
          blue: '#2563EB',
          sky: '#38BDF8',
          gold: '#D4AF37',
          goldDark: '#B8860B',
          goldLight: '#FDE047',
          amber: '#F59E0B',
          cream: '#FFFDF5',
          slate: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'gold': '0 4px 20px -2px rgba(212, 175, 55, 0.25)',
        'gold-lg': '0 10px 25px -3px rgba(212, 175, 55, 0.35)',
        'premium': '0 20px 40px -15px rgba(12, 35, 64, 0.12)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}

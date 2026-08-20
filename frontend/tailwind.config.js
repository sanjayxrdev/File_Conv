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
        surface: {
          canvas: '#FBFBFA',
          card: '#FFFFFF',
          raised: '#F9F9F8',
          border: '#EAEAEA',
        },
        ink: {
          primary: '#111111',
          secondary: '#2F3437',
          muted: '#787774',
          faint: '#AEA9A4',
        },
        accent: {
          red: '#FDEBEC',
          'red-text': '#9F2F2D',
          blue: '#E1F3FE',
          'blue-text': '#1F6C9F',
          green: '#EDF3EC',
          'green-text': '#346538',
          yellow: '#FBF3DB',
          'yellow-text': '#956400',
        },
      },
      fontFamily: {
        serif: ['Instrument Serif', 'Lyon Text', 'Newsreader', 'Playfair Display', 'serif'],
        sans: ['DM Sans', 'SF Pro Display', 'Geist Sans', 'Helvetica Neue', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Geist Mono', 'monospace'],
      },
      borderRadius: {
        'card': '8px',
        'card-lg': '12px',
      },
      boxShadow: {
        'lift': '0 2px 8px rgba(0,0,0,0.04)',
        'lift-hover': '0 4px 16px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'ambient-drift': 'ambientDrift 25s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ambientDrift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 15px) scale(0.95)' },
        },
      },
    },
  },
  plugins: [],
}

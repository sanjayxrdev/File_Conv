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
          canvas: 'var(--surface-canvas)',
          card: 'var(--surface-card)',
          raised: 'var(--surface-raised)',
          border: 'var(--surface-border)',
        },
        ink: {
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
          faint: 'var(--ink-faint)',
        },
        accent: {
          red: 'var(--accent-red)',
          'red-text': 'var(--accent-red-text)',
          blue: 'var(--accent-blue)',
          'blue-text': 'var(--accent-blue-text)',
          green: 'var(--accent-green)',
          'green-text': 'var(--accent-green-text)',
          yellow: 'var(--accent-yellow)',
          'yellow-text': 'var(--accent-yellow-text)',
          purple: 'var(--accent-purple)',
          'purple-text': 'var(--accent-purple-text)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'DM Sans', '-apple-system', 'sans-serif'],
        serif: ['Instrument Serif', 'Newsreader', 'serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      borderRadius: {
        'card': '8px',
        'card-lg': '12px',
        'pill': '9999px',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px rgba(0, 0, 0, 0.07)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lg': '0 10px 25px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

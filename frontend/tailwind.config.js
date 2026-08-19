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
        coral: {
          500: '#ff385c',
          600: '#e02847',
        },
        cyber: {
          lime: '#ccff00',
          cyan: '#00f2fe',
        },
        obsidian: {
          bg: '#0b0c10',
          card: '#12141d',
          border: '#1f2333',
        }
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        sans: ['Outfit', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}




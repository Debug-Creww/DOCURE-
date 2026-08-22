/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        serif: ['Lora', 'serif'],
        mono: ['Space Grotesk', 'sans-serif'],
        michroma: ['Michroma', 'sans-serif'],
      },
      colors: {
        brand: {
          bg: '#fbfbfa',
          sand: '#f5f4f0',
          accent: '#0f766e',
          glowingGreen: '#10b981',
          textDark: '#0f172a',
          textMuted: '#64748b',
          border: 'rgba(15, 23, 42, 0.08)',
          borderHover: 'rgba(15, 23, 42, 0.18)'
        }
      }
    },
  },
  plugins: [],
}

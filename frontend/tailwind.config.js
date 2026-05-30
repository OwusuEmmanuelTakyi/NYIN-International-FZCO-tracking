/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: 'var(--gold)',
          light:   'var(--gold-light)',
          dark:    'var(--gold-dark)',
        },
        nyin: {
          bg:      'var(--bg)',
          surface: 'var(--surface)',
          card:    'var(--card)',
          border:  'var(--border)',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eeeef7',
          100: '#ddddee',
          200: '#bbbbdd',
          300: '#9998cd',
          400: '#7776bc',
          500: '#5654ab',
          600: '#444389',
          700: '#333267',
          800: '#222244',
          900: '#111122',
          950: '#0c0c18',
        },
        glaucous: {
          50: '#eeeef7',
          100: '#ddddee',
          200: '#bbbbdd',
          300: '#9998cd',
          400: '#7776bc',
          500: '#5654ab',
          600: '#444389',
          700: '#333267',
          800: '#222244',
          900: '#111122',
          950: '#0c0c18',
        }
      }
    },
  },
  plugins: [],
} satisfies Config


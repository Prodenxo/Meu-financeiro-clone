/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FCECEC',
          100: '#F7D8D8',
          200: '#F0B4B4',
          300: '#E47E7E',
          400: '#D95555',
          500: '#C93B3B',
          600: '#B12D2D',
          700: '#8F1A1A',
          800: '#751212',
          900: '#5A0B0B'
        },
        surface: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          900: '#0F172A'
        }
      },
      boxShadow: {
        card: '0 16px 32px rgba(15, 23, 42, 0.12)',
        soft: '0 10px 24px rgba(15, 23, 42, 0.1)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
};

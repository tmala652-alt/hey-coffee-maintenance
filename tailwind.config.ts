import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Hey! Coffee Brand Colors
        coffee: {
          50: '#faf6f3',
          100: '#f5f0e8',
          200: '#e8dfd2',
          300: '#d4c4ad',
          400: '#bda384',
          500: '#a68965',
          600: '#8b6d4a',
          700: '#6f4e37', // Primary Coffee Brown
          800: '#5c4130',
          900: '#3d2914', // Dark Roast (Text)
          950: '#251a0d',
        },
        cream: {
          50: '#fffbf5', // Warm White (Background)
          100: '#f5f0e8', // Warm Cream (Secondary)
          200: '#ebe3d6',
          300: '#ddd1be',
          400: '#c9b89e',
          500: '#b59f7f',
        },
        honey: {
          50: '#fef9e7',
          100: '#fdf3cf',
          200: '#fbe79f',
          300: '#f8db6f',
          400: '#e8b84a',
          500: '#daa520', // Honey Gold (Accent)
          600: '#c49518',
          700: '#a47814',
          800: '#845f10',
          900: '#64480c',
        },
        matcha: {
          50: '#f0f7f2',
          100: '#dcede1',
          200: '#bddbc5',
          300: '#93c4a1',
          400: '#6dab7d',
          500: '#4a7c59', // Success
          600: '#3d6649',
          700: '#32523b',
          800: '#2a4232',
          900: '#24372a',
        },
        caramel: {
          50: '#fef7e8',
          100: '#fdefd1',
          200: '#fbdfa3',
          300: '#f8cf75',
          400: '#e8a838', // Warning
          500: '#d4962a',
          600: '#b87d22',
          700: '#96641c',
          800: '#7a5118',
          900: '#644214',
        },
        cherry: {
          50: '#fdf2f2',
          100: '#fce8e8',
          200: '#f9d0d0',
          300: '#f4a8a8',
          400: '#eb7a7a',
          500: '#c94c4c', // Error
          600: '#b43d3d',
          700: '#962f2f',
          800: '#7c2828',
          900: '#662424',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

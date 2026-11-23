/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { den: '#1F1F1E', red: '#D70114', xam: '#6F7176', xam20: 'rgba(111,113,118,0.2)', page: '#FBFBFB', input: '#F4F4F4', link: '#0084FF' },
      fontFamily: { grotesk: ['Space Grotesk', 'sans-serif'], chakra: ['Chakra Petch', 'sans-serif'] },
    },
  },
  plugins: [],
};

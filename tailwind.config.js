/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        kanit: ['Kanit', 'sans-serif'],
        geist: ['"Geist Sans"', 'sans-serif'],
      },
      transitionTimingFunction: {
        'out-custom': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out-custom': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
      }
    },
  },
  plugins: [],
};

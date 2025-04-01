/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#F56565', // Existing primary (Let's keep this for now)
          orange: '#ED8936', // Basketball Orange
          navy: '#2A4365', // Deep Blue/Navy
          secondary: '#4A5568', // Medium Gray
          light: '#F7FAFC', // Light background
          dark: '#1A202C', // Dark text/elements
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Example: Adding Inter font
        heading: ['Poppins', 'sans-serif'], // Example: Bolder heading font
      }
    },
  },
  plugins: [],
};

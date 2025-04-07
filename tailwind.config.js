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
          // Neo-brutalism basketball themed colors
          court: '#E8D0A9', // Basketball court tan/wood color
          basketball: '#FF8130', // Basketball orange
          lines: '#4D4D4D', // Court lines dark gray
          net: '#FFFFFF', // Net white
          trim: '#C76D3A', // Darker trim wood color
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Example: Adding Inter font
        heading: ['Poppins', 'sans-serif'], // Example: Bolder heading font
        mono: ['Space Mono', 'monospace'], // For neo-brutalism style
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px 0px rgba(0,0,0)',
        'neo-md': '4px 4px 0px 0px rgba(0,0,0)',
        'neo-lg': '8px 8px 0px 0px rgba(0,0,0)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "fade-out": {
          from: { opacity: 1 },
          to: { opacity: 0 },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-out-to-top": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(-100%)" },
        },
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-to-left": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
        "zoom-in": {
          from: { transform: "scale(0.95)" },
          to: { transform: "scale(1)" },
        },
        "zoom-out": {
          from: { transform: "scale(1)" },
          to: { transform: "scale(0.95)" },
        },
        "pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.2s ease-out",
        "slide-out-to-top": "slide-out-to-top 0.2s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.2s ease-out",
        "slide-out-to-left": "slide-out-to-left 0.2s ease-out",
        "zoom-in": "zoom-in 0.2s ease-out",
        "zoom-out": "zoom-out 0.2s ease-out",
        "in": "fade-in 0.2s ease-out",
        "out": "fade-out 0.2s ease-out",
        "pulse": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      }
    },
  },
  plugins: [],
};

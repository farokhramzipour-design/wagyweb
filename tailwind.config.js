/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Rover-inspired theme
        'brand': {
          'green': '#2a9d8f', // A friendly, trustworthy green
          'charcoal': '#264653', // Dark, for text
        },
        'accent': {
          'orange': '#f4a261', // For call-to-action buttons
          'yellow': '#e9c46a',
        },
        'neutral': {
          'light-gray': '#f7fafc',
          'gray': '#edf2f7',
          'dark-gray': '#a0aec0',
        },
        
        // Keeping your original colors in case they are used elsewhere
        primary: '#2a9d8f',
        secondary: '#264653',
      }
    },
  },
  plugins: [],
}

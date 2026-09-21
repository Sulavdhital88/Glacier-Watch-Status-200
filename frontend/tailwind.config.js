/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgCream: '#F7F1E8',
        cardWarm: '#FFFDF9',
        textDark: '#241F1B',
        textMuted: '#756D65',
        accentRed: '#B42318',
        lightRed: '#FCE8E6',
        borderWarm: '#E7DED4',
        accentSuccess: '#3F7D58',
        accentWarning: '#C98216',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
        lg: '10px',
        xl: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(36, 31, 27, 0.04), 0 1px 2px rgba(36, 31, 27, 0.02)',
        dropdown: '0 4px 12px rgba(36, 31, 27, 0.08)',
        modal: '0 12px 32px rgba(36, 31, 27, 0.12)',
      },
    },
  },
  plugins: [],
};

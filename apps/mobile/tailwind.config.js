/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: process.env.DARK_MODE ? process.env.DARK_MODE : 'class',
  content: ['./src/**/*.{html,js,jsx,ts,tsx,mdx}'],
  presets: [require('nativewind/preset')],
  important: 'html',
  theme: {
    extend: {
      colors: {
        // Notion-inspired core palette
        background: '#FFFFFF',
        foreground: '#37352F',
        surface: '#F7F6F3',
        border: '#E9E9E7',
        hover: '#EFEFEF',
        'muted-fg': '#787774',
        'text-tertiary': '#C0BFB9',

        // Semantic colors
        'accent-blue': '#2EAADC',
        'accent-green': '#0F7B6C',
        'accent-red': '#EB5757',
        'accent-yellow': '#F5C542',
        'selected-bg': '#E8F5FD',

        // Tinted backgrounds
        'fav-card-bg': '#FEF9EF',
        'strong-card-bg': '#EDF9F0',
      },
      fontFamily: {
        heading: ['Caveat_700Bold'],
        'heading-semi': ['Caveat_600SemiBold'],
        body: ['Nunito_400Regular'],
        'body-semi': ['Nunito_600SemiBold'],
        'body-bold': ['Nunito_700Bold'],
        mono: ['JetBrainsMono_400Regular'],
        'mono-medium': ['JetBrainsMono_500Medium'],
      },
      borderRadius: {
        'notion': '16px',
      },
      fontSize: {
        '2xs': '10px',
      },
      boxShadow: {
        'soft-1': '0px 0px 10px rgba(38, 38, 38, 0.1)',
        'soft-2': '0px 1px 3px rgba(38, 38, 38, 0.06)',
      },
    },
  },
};

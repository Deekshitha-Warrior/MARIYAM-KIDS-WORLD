/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgMain:    '#FFFFFF', // Clean white surface
        cardBg:    '#FFFFFF',
        brand: {
          black:      '#EC4899', // True vibrant Pink — Mariyam Kids World primary
          dark:       '#DB2777', // Deep pink
          gold:       '#F472B6', // Accent soft pink
          goldHover:  '#EC4899',
          goldLight:  '#FDF2F8', // Soft pink tint
          goldBorder: '#FBCFE8', // Delicate pink border
        },
        gold: {
          DEFAULT: '#EC4899',
          dark:    '#DB2777',
          light:   '#FDF2F8',
          border:  '#FBCFE8',
        },
        maroon: {
          DEFAULT: '#EC4899',
          dark:    '#DB2777',
          light:   '#FDF2F8',
        },
        // Branch accents for POS 1 / POS 2
        posOne: {
          DEFAULT: 'var(--pos-one, #EC4899)',
          dark:    'var(--pos-one-dark, #DB2777)',
          light:   'var(--pos-one-light, #FDF2F8)',
        },
        posTwo: {
          DEFAULT: 'var(--pos-two, #2563EB)',
          dark:    'var(--pos-two-dark, #1D4ED8)',
          light:   'var(--pos-two-light, #EFF6FF)',
        },
        textMain:  '#1F2937',
        textMuted: '#6B7280',
        borderLight: '#FCE7F3', // Soft pink-tinted neutral border
      },
      fontFamily: {
        sans:      ['"DM Sans"', '"Outfit"', '"Noto Sans Tamil"', 'system-ui', '-apple-system', 'sans-serif'],
        dmsans:    ['"DM Sans"', 'sans-serif'],
        'dm-sans': ['"DM Sans"', 'sans-serif'],
        outfit:    ['"Outfit"', 'sans-serif'],
        brand:     ['"Cinzel"', '"DM Sans"', '"Outfit"', '"Noto Sans Tamil"', 'serif'],
        headline:  ['"DM Sans"', '"Outfit"', '"Noto Sans Tamil"', 'sans-serif'],
      },
      boxShadow: {
        soft:   '0 1px 3px rgba(0,0,0,0.05)',
        gold:   '0 4px 20px -2px rgba(212, 175, 55, 0.25)',
      },
      borderRadius: {
        'card': '12px',
        'btn': '10px',
        'input': '10px',
        'table': '12px',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'floatDelay': 'float 4s ease-in-out 1.5s infinite',
        'slideUp': 'slideUp 0.6s ease forwards',
        'fadeIn': 'fadeIn 0.5s ease forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

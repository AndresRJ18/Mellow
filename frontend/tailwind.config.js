export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#93f57b',
        'on-primary': '#1a3d00',
        surface: '#FAF9F6',
        'surface-container': '#EFEDE8',
        'surface-container-high': '#E5E2DB',
        'surface-container-highest': '#D9D6CE',
        'on-surface': '#0a0a0a',
        'on-surface-variant': '#6b6860',
        'outline-variant': '#D4D0C8',
        error: '#cc3300',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '2px',
        md: '4px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
        full: '9999px',
      },
      keyframes: {
        wave: {
          '0%, 100%': { height: '3px' },
          '50%': { height: '18px' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        cursor: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'wave-1': 'wave 0.9s ease-in-out infinite',
        'wave-2': 'wave 0.9s ease-in-out infinite 0.12s',
        'wave-3': 'wave 0.9s ease-in-out infinite 0.24s',
        'wave-4': 'wave 0.9s ease-in-out infinite 0.36s',
        'wave-5': 'wave 0.9s ease-in-out infinite 0.48s',
        'float-1': 'floatY 4s ease-in-out infinite',
        'float-2': 'floatY 5s ease-in-out infinite 1s',
        'float-3': 'floatY 6s ease-in-out infinite 2s',
        'float-4': 'floatY 3.5s ease-in-out infinite 0.5s',
        cursor: 'cursor 1s step-end infinite',
        'fade-up': 'fadeUp 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}

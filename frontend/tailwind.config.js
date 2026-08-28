/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:             'var(--bg)',
        surface:        'var(--surface)',
        card:           'var(--card)',
        border:         'var(--border)',
        text:           'var(--text)',
        muted:          'var(--text-muted)',
        'accent-blue':  'var(--accent-blue)',
        'accent-purple':'var(--accent-purple)',
        'accent-green': 'var(--accent-green)',
        'accent-amber': 'var(--accent-amber)',
        'accent-red':   'var(--accent-red)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 20px 0 rgba(0,0,0,0.45)',
        glow: '0 0 24px rgba(37,99,235,0.3)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateX(-12px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};

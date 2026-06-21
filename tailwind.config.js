/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      colors: {
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
      },
      animation: {
        'slide-up': 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
        'fade-in': 'fadeIn 0.2s ease',
        'pop-in': 'popIn 0.3s ease',
        'slide-down': 'slideDown 0.25s ease',
      },
      keyframes: {
        slideUp: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        popIn: { from: { opacity: '0', transform: 'translate(-50%,-50%) scale(0.94)' }, to: { opacity: '1', transform: 'translate(-50%,-50%) scale(1)' } },
        slideDown: { from: { opacity: '0', transform: 'translate(-50%,-12px)' }, to: { opacity: '1', transform: 'translate(-50%,0)' } },
      },
    },
  },
  plugins: [],
};

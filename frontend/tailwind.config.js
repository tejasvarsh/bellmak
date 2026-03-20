/** @type {import('tailwindcss').Config} */
// NOTE: Using Tailwind v4 — animations are defined in globals.css @keyframes
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F97316',
        'primary-dark': '#EA580C',
        secondary: '#1a1a2e',
        accent: '#FACC15',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'sans-serif'],
      },
      // keyframes below kept for reference but v4 reads from globals.css
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        bounceSub: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        marqueeSlow: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        marqueeBrands: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-33.33%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-12px) rotate(2deg)' },
          '66%': { transform: 'translateY(-6px) rotate(-2deg)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(249, 115, 22, 0.7)' }
        },
        typewriter: {
          '0%': { width: '0' },
          '100%': { width: '100%' }
        },
        blink: {
          '0%, 100%': { borderColor: 'transparent' },
          '50%': { borderColor: '#F97316' }
        },
      },
      animation: {
        'fadeIn': 'fadeIn 0.25s ease-out',
        'slideInLeft': 'slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slideUp': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'bounce-subtle': 'bounceSub 1.2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'marquee-slow': 'marqueeSlow 25s linear infinite',
        'marquee-brands': 'marqueeBrands 30s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

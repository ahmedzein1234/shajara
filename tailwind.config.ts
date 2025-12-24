import type { Config } from 'tailwindcss';

const config: Config = {
  // Content paths
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // Dark mode using class strategy
  darkMode: 'class',

  theme: {
    extend: {
      // Custom colors for Shajara app - Enhanced with Islamic palette
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        secondary: {
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
        // Islamic color palette
        islamic: {
          50: '#F5F0E8',    // Cream/Ivory - parchment
          100: '#E8D4B8',   // Desert Sand
          200: '#D4AF37',   // Gold accent
          300: '#B85C3C',   // Terracotta
          400: '#9BA39D',   // Sage Green
          500: '#1B7F7E',   // Deep Turquoise - primary
          600: '#1A3A4A',   // Deep Navy
          700: '#0080A8',   // Moroccan Blue
          800: '#2C3E7A',   // Andalusian Indigo
          900: '#1B1B1B',   // Rich Black
        },
        gold: {
          50: '#FFFDF5',
          100: '#FFF8E1',
          200: '#F5D742',
          300: '#D4AF37',
          400: '#B8860B',
          500: '#996515',
          600: '#7A4F0F',
          700: '#5C3A0A',
          800: '#3D2606',
          900: '#1F1303',
        },
        heritage: {
          cream: '#F5F0E8',
          sand: '#E8D4B8',
          terracotta: '#B85C3C',
          navy: '#1A3A4A',
          turquoise: '#1B7F7E',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },

      // Arabic-friendly font stack with premium self-hosted fonts
      fontFamily: {
        sans: [
          'Tajawal',
          'Cairo',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        arabic: ['Tajawal', 'Cairo', 'sans-serif'],
        display: ['Aref Ruqaa', 'Amiri', 'serif'],
        accent: ['Cairo', 'Tajawal', 'sans-serif'],
        calligraphy: ['Aref Ruqaa', 'Amiri', 'serif'],
        elegant: ['Amiri', 'serif'],
        traditional: ['Aref Ruqaa', 'serif'],
        body: ['Tajawal', 'Cairo', 'sans-serif'],
      },

      // Spacing adjustments for RTL
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // Border radius
      borderRadius: {
        '4xl': '2rem',
      },

      // Box shadow for elevation
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        'islamic': '0 4px 20px rgba(27, 127, 126, 0.15)',
        'gold': '0 4px 15px rgba(212, 175, 55, 0.25)',
      },

      // Enhanced animation keyframes
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s infinite',
        'shimmer': 'shimmer 2s infinite',
        'float': 'floatGentle 4s ease-in-out infinite',
        'spin-slow': 'spinSlow 8s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.5)' },
          '50%': { boxShadow: '0 0 0 12px rgba(16, 185, 129, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        floatGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },

      // RTL-friendly utilities using logical properties
      margin: {
        'inline-start': 'var(--spacing-inline-start)',
        'inline-end': 'var(--spacing-inline-end)',
      },
      padding: {
        'inline-start': 'var(--spacing-inline-start)',
        'inline-end': 'var(--spacing-inline-end)',
      },

      // Background patterns
      backgroundImage: {
        'pattern-islamic': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231B7F7E' fill-opacity='0.03'%3E%3Cpath d='M30 30l15-15v30H15V15l15 15zm0 0L15 15h30L30 30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        'gradient-islamic': 'linear-gradient(135deg, #1B7F7E 0%, #10b981 50%, #0d9488 100%)',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #F5D742 50%, #D4AF37 100%)',
        'gradient-heritage': 'linear-gradient(135deg, #1A3A4A 0%, #1B7F7E 50%, #B85C3C 100%)',
      },
    },
  },

  plugins: [
    // Plugin for RTL support using logical properties
    function ({ addUtilities }: any) {
      const newUtilities = {
        '.text-start': {
          'text-align': 'start',
        },
        '.text-end': {
          'text-align': 'end',
        },
        '.float-start': {
          'float': 'inline-start',
        },
        '.float-end': {
          'float': 'inline-end',
        },
        '.ms-auto': {
          'margin-inline-start': 'auto',
        },
        '.me-auto': {
          'margin-inline-end': 'auto',
        },
        '.ps-0': {
          'padding-inline-start': '0',
        },
        '.pe-0': {
          'padding-inline-end': '0',
        },
        '.border-s': {
          'border-inline-start-width': '1px',
        },
        '.border-e': {
          'border-inline-end-width': '1px',
        },
        // Arabic typography utilities
        '.font-feature-arabic': {
          'font-feature-settings': "'cv01' 1, 'cv02' 1, 'liga' 1, 'calt' 1",
        },
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.leading-arabic': {
          'line-height': '1.85',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};

export default config;

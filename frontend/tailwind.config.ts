import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Academic color palette - warm, professional tones
        surface: {
          DEFAULT: '#FAFAF9',  // Warm off-white background
          raised: '#FFFFFF',   // Cards, elevated surfaces
          muted: '#F5F5F4',    // Subtle backgrounds
        },
        border: {
          DEFAULT: '#E7E5E4',  // Standard borders
          strong: '#D6D3D1',   // Emphasized borders
        },
        text: {
          primary: '#1C1917',   // Near-black, main text
          secondary: '#57534E', // Muted text
          tertiary: '#A8A29E',  // Placeholder, disabled
        },
        accent: {
          DEFAULT: '#0F766E',   // Deep teal - primary accent
          hover: '#0D9488',     // Lighter teal for hover
          muted: '#CCFBF1',     // Very light teal for backgrounds
        },
        status: {
          success: '#166534',   // Deep green
          warning: '#A16207',   // Deep amber
          error: '#B91C1C',     // Deep red
          info: '#1E40AF',      // Deep blue
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Refined type scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
      },
      boxShadow: {
        // Subtle, professional shadows
        'soft': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config

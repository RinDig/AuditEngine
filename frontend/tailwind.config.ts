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
        // Clinical Precision - Dark Scientific Theme
        surface: {
          DEFAULT: '#0A0A0B',   // Near-black background
          raised: '#141416',    // Elevated surfaces
          muted: '#1C1C1F',     // Cards, inputs
          hover: '#242428',     // Hover states
        },
        border: {
          DEFAULT: '#2A2A2E',   // Subtle borders
          strong: '#3A3A40',    // Emphasized borders
          focus: '#00D9FF',     // Focus rings (cyan)
        },
        text: {
          primary: '#FAFAFA',   // High contrast white
          secondary: '#A0A0A5', // Muted info
          tertiary: '#606065',  // Disabled, hints
        },
        // Primary: Cyan (diagnostic/medical feel)
        accent: {
          DEFAULT: '#00D9FF',   // Bright cyan
          hover: '#00B8D9',     // Darker cyan for hover
          muted: 'rgba(0, 217, 255, 0.12)', // Glow backgrounds
          glow: 'rgba(0, 217, 255, 0.4)',   // For shadows
        },
        // Secondary: Coral (warnings, highlights)
        coral: {
          DEFAULT: '#FF3366',
          hover: '#E62E5C',
          muted: 'rgba(255, 51, 102, 0.12)',
        },
        // Status colors (bright on dark)
        status: {
          success: '#00FF88',   // Bright green
          warning: '#FFB800',   // Amber
          error: '#FF4444',     // Red
          info: '#00D9FF',      // Cyan (same as accent)
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
      },
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
      },
      boxShadow: {
        // Dark theme shadows with glow effects
        'glow-sm': '0 0 10px rgba(0, 217, 255, 0.15)',
        'glow-md': '0 0 20px rgba(0, 217, 255, 0.2)',
        'glow-lg': '0 0 30px rgba(0, 217, 255, 0.25)',
        'glow-success': '0 0 10px rgba(0, 255, 136, 0.3)',
        'glow-error': '0 0 10px rgba(255, 68, 68, 0.3)',
        'glow-warning': '0 0 10px rgba(255, 184, 0, 0.3)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        scan: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
      },
      borderRadius: {
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
      },
    },
  },
  plugins: [],
}

export default config

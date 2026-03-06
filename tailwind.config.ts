import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        foreground: '#ffffff',
        card: {
          DEFAULT: '#111113',
          hover: '#161618',
          border: '#1a1a1f',
        },
        border: '#1a1a1f',
        primary: {
          DEFAULT: '#00ff88',
          hover: '#14f195',
          dark: '#00cc6a',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#18181b',
          hover: '#27272a',
        },
        accent: {
          DEFAULT: '#00ff88',
          glow: '#00ff8840',
        },
        success: {
          DEFAULT: '#00ff88',
          muted: '#00ff8815',
        },
        danger: {
          DEFAULT: '#ff4757',
          muted: '#ff475715',
        },
        warning: {
          DEFAULT: '#ffa502',
          muted: '#ffa50215',
        },
        muted: {
          DEFAULT: '#52525b',
          foreground: '#a1a1aa',
        },
        neon: {
          green: '#00ff88',
          blue: '#00d4ff',
          purple: '#a855f7',
          pink: '#ff00ff',
        },
        rank: {
          gold: '#FFD700',
          silver: '#C0C0C0',
          bronze: '#CD7F32',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      letterSpacing: {
        'tighter': '-0.02em',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 255, 136, 0.3)',
        'neon-sm': '0 0 10px rgba(0, 255, 136, 0.2)',
        'neon-lg': '0 0 40px rgba(0, 255, 136, 0.4)',
        'neon-intense': '0 0 30px rgba(0, 255, 136, 0.5), 0 0 60px rgba(0, 255, 136, 0.3)',
        'inner-sm': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
        'card': '0 4px 24px -2px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px -4px rgba(0, 255, 136, 0.15)',
        'gold': '0 0 20px rgba(255, 215, 0, 0.3)',
        'silver': '0 0 20px rgba(192, 192, 192, 0.3)',
        'bronze': '0 0 20px rgba(205, 127, 50, 0.3)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'icon-bounce': 'icon-bounce 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 255, 136, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(0, 255, 136, 0.5)' },
        },
        'pulse-neon': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(0, 255, 136, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(0, 255, 136, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'icon-bounce': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;

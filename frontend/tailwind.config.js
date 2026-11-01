/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#080A0F',
          secondary: '#10141C',
          panel: '#141A24',
          subtle: '#18202D',
        },
        accent: {
          cyan: '#5DE1E6',
          violet: '#8B7CFF',
        },
        border: {
          DEFAULT: '#242C39',
          light: '#2E394A',
          glow: 'rgba(93, 225, 230, 0.25)',
        },
        text: {
          primary: '#E8EDF5',
          secondary: '#8793A5',
          muted: '#526071',
        },
        apple: {
          canvas: '#000000',
          base: '#0c0c0e',
          sidebar: '#121214',
          surface: '#1c1c1e',
          elevated: '#242426',
          highlight: '#2c2c2e',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-subtle': 'rgba(255, 255, 255, 0.05)',
          'border-strong': 'rgba(255, 255, 255, 0.16)',
          blue: '#0a84ff',
          'blue-hover': '#0071e3',
          green: '#30d158',
          red: '#ff453a',
          indigo: '#5e5ce6',
          orange: '#ff9f0a',
          'text-primary': '#f5f5f7',
          'text-secondary': '#86868b',
          'text-tertiary': '#6e6e73',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Inter', 'sans-serif'],
        apple: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Inter', 'sans-serif'],
        heading: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(93, 225, 230, 0.25)',
        'glow-violet': '0 0 20px -3px rgba(139, 124, 255, 0.25)',
        'glow-subtle': '0 4px 20px -2px rgba(8, 10, 15, 0.8)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 10px rgba(93,225,230,0.3))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 20px rgba(93,225,230,0.6))' },
        }
      }
    },
  },
  plugins: [],
}

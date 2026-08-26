import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce8ff',
          200: '#b9d2ff',
          500: '#3b6fff',
          600: '#2557f7',
          700: '#1a41d4',
          900: '#0d1f6e'
        },
        surface: {
          0: '#f7f7f6',
          1: '#ffffff',
          2: '#f0efed'
        }
      },
      borderRadius: { DEFAULT: '8px', card: '12px' },
      boxShadow: {
        card: '0 0 0 0.5px rgba(0,0,0,0.08)',
        focus: '0 0 0 3px rgba(59,111,255,0.2)'
      }
    }
  },
  plugins: []
}
export default config

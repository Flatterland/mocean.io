/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        panel: '#11131a',
        'panel-light': '#181b24',
        'panel-border': '#222734',
        accent: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          light: '#818cf8',
          glow: 'rgba(99, 102, 241, 0.35)',
        },
        cyan: {
          neon: '#00f2fe',
        },
        pink: {
          neon: '#ff007f',
        },
        amber: {
          neon: '#fbbf24',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 20px -3px rgba(99, 102, 241, 0.45)',
        'glow-cyan': '0 0 20px -3px rgba(0, 242, 254, 0.45)',
      }
    },
  },
  plugins: [],
}

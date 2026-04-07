/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
        },
        border: {
          default: 'var(--border-default)',
          active: 'var(--border-active)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        risk: {
          low: 'var(--risk-low)',
          moderate: 'var(--risk-moderate)',
          high: 'var(--risk-high)',
          critical: 'var(--risk-critical)',
          glowLow: 'var(--risk-glow-low)',
          glowHigh: 'var(--risk-glow-high)',
        },
        accent: {
          blue: 'var(--accent-blue)',
          cyan: 'var(--accent-cyan)',
          purple: 'var(--accent-purple)',
        },
        fuel: 'var(--fuel-color)',
        power: 'var(--power-color)',
        food: 'var(--food-color)',
        logistics: 'var(--logistics-color)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['"Outfit"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

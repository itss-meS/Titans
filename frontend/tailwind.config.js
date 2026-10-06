export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        mute: 'var(--mute)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        accentSoft: 'var(--accent-soft)',
        accentFaint: 'var(--accent-faint)',
        muteSoft: 'var(--mute-soft)',
        onAccent: 'var(--on-accent)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Geist Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}

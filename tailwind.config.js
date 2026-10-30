/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Inter"',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace'
        ]
      },
      colors: {
        coral: {
          healthy: '#10B981', // emerald-500
          stressed: '#F59E0B', // amber-500
          bleached: '#F43F5E', // rose-500
          dead: '#334155',     // slate-700
        }
      }
    },
  },
  plugins: [],
}

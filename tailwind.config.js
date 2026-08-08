/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // App Shell & Backgrounds (Oceanic Slate)
        canvas: {
          bg: '#070A12',       // Deepest abyss
          panel: '#0B101D',    // Dark Navy Panel
          card: '#0F172A',     // Slate Card
          border: '#1E293B',   // Subtle Border
          hover: 'rgba(51, 65, 85, 0.4)', // Hover Overlay
        },
        // Accents (Strictly Cyan, Sky, Teal, Emerald, Coral - NO PURPLE)
        brand: {
          primary: '#06B6D4',   // Electric Cyan
          sky: '#38BDF8',       // Sky Blue
          teal: '#14B8A6',      // Deep Teal
          emerald: '#10B981',   // Live Status Green
          coral: '#F43F5E',     // Accent Rose/Coral
        },
        // Collaborator Cursor / Presence Colors
        presence: {
          user1: '#00E5FF', // Neon Cyan
          user2: '#10B981', // Emerald
          user3: '#38BDF8', // Sky Blue
          user4: '#F59E0B', // Amber
          user5: '#F43F5E', // Coral
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.35)',
        'glow-emerald': '0 0 15px -3px rgba(16, 185, 129, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}

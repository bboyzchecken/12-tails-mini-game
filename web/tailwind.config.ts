import type { Config } from 'tailwindcss';

// Warm, rounded 12Tails palette — the SAME brand tokens as the approved landing
// mockup (12tails-landing-mockup.html) and the game UI, so landing + admin read
// as one product. Never hardcode colors elsewhere; use these.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── brand core (from the mockup :root tokens) ──
        cream: '#FDF5EA', // page background
        'cream-2': '#FBEEDD', // alt section background
        ink: '#4A3629', // primary text
        soft: '#7E6959', // secondary text
        muted: '#A9927E', // tertiary / placeholder text
        accent: '#1FB4CF', // primary cyan (12 Tails logo)
        'accent-ink': '#0E7C90', // darker cyan for text on light
        'accent-soft': '#D6F0F5', // cyan tint
        mint: '#4FA595', // secondary teal
        'mint-soft': '#DBEFEA', // teal tint
        card: '#FFFFFF',
        line: '#F0E0CC', // warm hairline border
        // ── admin dashboard extras (Phase 4) ──
        panel: '#fffaf3',
        accent2: '#f2894a',
        danger: '#d6453e',
        bg: '#f4ede1',
      },
      fontFamily: {
        // next/font injects these CSS variables in app/layout.tsx.
        head: ['var(--font-head)', 'Mitr', 'Leelawadee UI', 'sans-serif'],
        body: ['var(--font-body)', 'Sarabun', 'Krub', 'Leelawadee UI', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
        'card-sm': '12px',
        stage: '24px',
      },
      boxShadow: {
        panel: '0 10px 28px rgba(20,14,6,0.10), 0 2px 6px rgba(20,14,6,0.06)',
        stage: '0 18px 40px rgba(150,100,50,0.14)',
        band: '0 14px 34px rgba(150,100,50,0.10)',
      },
      maxWidth: {
        wrap: '1040px',
      },
    },
  },
  plugins: [],
};

export default config;

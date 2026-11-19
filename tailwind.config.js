/**
 * Design tokens live in ONE place: the CSS variables in app/globals.css.
 * This file only maps them to Tailwind class names, so `bg-surface`,
 * `text-ink-2`, `border-line` etc. follow the active theme (dark or light)
 * automatically. Do not add raw hex colours to components; add a token.
 *
 * @type {import('tailwindcss').Config}
 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        // Surfaces, from the page background upwards
        canvas: token('canvas'),   // page background
        inset: token('inset'),     // recessed wells: nav bar, table headers, inputs, code
        surface: token('surface'), // cards and panels
        raised: token('raised'),   // hover and selected rows, menus
        // Hairlines
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        // A neutral overlay (white on dark, black on light) for subtle fills: bg-tint/5
        tint: token('tint'),
        // Text
        ink: {
          DEFAULT: token('ink'), // primary
          2: token('ink-2'),     // secondary
          3: token('ink-3'),     // tertiary; still >= 4.5:1 on every surface
        },
        // Brand accent
        accent: {
          DEFAULT: token('accent'),
          strong: token('accent-strong'), // solid button fill (white text passes AA)
          ink: token('accent-ink'),       // accent-coloured text and icons
        },
        // Status text and icon colours
        ok: token('ok'),
        warn: token('warn'),
        bad: token('bad'),
        violet: token('violet'),
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
      },
      fontSize: {
        // The smallest text size allowed in the app (11px).
        '2xs': '0.6875rem',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out both',
        'fade-up': 'fade-up 0.2s ease-out both',
      },
    },
  },
  plugins: [],
}

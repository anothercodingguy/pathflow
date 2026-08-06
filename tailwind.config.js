/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dev: {
          bg: "#08080A",
          surface: "#0F0F12",
          border: "#1E1E24",
          hover: "#16161A",
          text: "#FAFAFA",
          muted: "#8E8E93",
          subtle: "#545458",
          blue: "#3B82F6",
          emerald: "#10B981",
          red: "#EF4444"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Courier New", "monospace"],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          canvas: "#0B0F19",
          panel: "#111827",
          panelHover: "#161F33",
          border: "#1F2937",
          borderLight: "#374151",
          primary: "#6366F1",
          accent: "#38BDF8",
          healthy: "#10B981",
          warning: "#F59E0B",
          critical: "#EF4444",
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

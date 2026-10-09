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
          canvas: "#070A12",
          surface: "#0B0F19",
          panel: "#0F1626",
          panelHover: "#162038",
          panelGlass: "rgba(15, 22, 38, 0.75)",
          border: "#1C2740",
          borderLight: "#2A3A5E",
          borderGlow: "rgba(56, 189, 248, 0.3)",
          primary: "#6366F1",
          accent: "#00F2FE",
          cyan: "#38BDF8",
          healthy: "#10B981",
          warning: "#F59E0B",
          critical: "#EF4444",
        },
        cyber: {
          blue: "#38BDF8",
          neon: "#00F2FE",
          purple: "#A855F7",
          pink: "#EC4899",
          emerald: "#10B981",
          amber: "#F59E0B",
        }
      },
      fontFamily: {
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'equalizer': 'equalizer 1.2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        equalizer: {
          '0%': { height: '15%' },
          '50%': { height: '100%' },
          '100%': { height: '35%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}

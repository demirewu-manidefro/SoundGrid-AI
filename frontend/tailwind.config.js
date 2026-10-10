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
          canvas: "#181818",
          surface: "#1C1C1C",
          panel: "#232323",
          panelHover: "#2A2A2A",
          panelGlass: "rgba(35, 35, 35, 0.75)",
          border: "#3E3E3E",
          borderLight: "#4E4E4E",
          borderGlow: "rgba(62, 207, 142, 0.3)",
          primary: "#3ECF8E",
          accent: "#24B47E",
          cyan: "#3ECF8E",
          healthy: "#3ECF8E",
          warning: "#F59E0B",
          critical: "#EF4444",
        },
        cyber: {
          blue: "#3ECF8E",
          neon: "#24B47E",
          purple: "#2E2E2E",
          pink: "#3E3E3E",
          emerald: "#3ECF8E",
          amber: "#F59E0B",
        },
        cyan: {
          50: '#F5FCF9',
          100: '#E6F8F0',
          200: '#C1ECD7',
          300: '#94DDBC',
          400: '#3ECF8E',
          500: '#24B47E',
          600: '#1D9065',
          700: '#177351',
          800: '#115E41',
          900: '#0A3F2A',
          950: '#05291B',
        },
        indigo: {
          50: '#F5F5F5',
          100: '#EBEBEB',
          200: '#D6D6D6',
          300: '#C2C2C2',
          400: '#999999',
          500: '#2E2E2E',
          600: '#232323',
          700: '#1C1C1C',
          800: '#181818',
          900: '#111111',
          950: '#0A0A0A',
        },
        slate: {
          900: '#1C1C1C',
          950: '#111111',
        },
        emerald: {
          50: '#F5FCF9',
          100: '#E6F8F0',
          200: '#C1ECD7',
          300: '#94DDBC',
          400: '#3ECF8E',
          500: '#24B47E',
          600: '#1D9065',
          700: '#177351',
          800: '#115E41',
          900: '#0A3F2A',
          950: '#05291B',
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

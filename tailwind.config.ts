import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: '#1E52D0',
        'primary-light': '#ECF1FD',
        'primary-foreground': '#ffffff',
        accent: '#E96104',
        background: '#F8FBFA',
        'background-card': '#ffffff',
        'text-main': '#0B0A0A',
        'text-secondary': '#A5B0C0',
        border: '#E5E7EB',
      },
      fontFamily: {
        jakarta: ["var(--font-jakarta)", "sans-serif"],
      },
      fontWeight: {
        light: "200",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'reverse-spin': 'reverse-spin 2s linear infinite',
        'twinkle': 'twinkle 1.5s ease-in-out infinite',
        'border-flow': 'border-flow 2s ease-in-out infinite',
      },
      keyframes: {
        'reverse-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '0', transform: 'scale(0.5)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        'border-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animationDelay: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
      },
    },
  },
  plugins: [],
};
export default config;

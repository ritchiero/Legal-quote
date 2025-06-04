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
    },
  },
  plugins: [],
};
export default config;

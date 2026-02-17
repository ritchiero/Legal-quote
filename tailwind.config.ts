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
                            // Lawgic Design System — Brand Blue
                    primary: {
                                50: '#F2F8FF',
                                100: '#E8F2FC',
                                200: '#DDE8FD',
                                500: '#4166D4',
                                600: '#3C65E2',
                                700: '#4056BE',
                                DEFAULT: '#3C65E2',
                    },
                            'primary-foreground': '#ffffff',
                            accent: '#E96104',
                            // Lawgic DS — Neutrals
                            background: '#F5F6FA',
                            'background-card': '#ffffff',
                            'surface-2': '#F5F6FA',
                            'text-main': '#0B0F1A',
                            'text-900': '#0B0F1A',
                            'text-600': '#7C86A4',
                            'text-secondary': '#7C86A4',
                            'muted-300': '#C0C3CF',
                            'border-1': '#E9EEF5',
                            border: '#E9EEF5',
                            // Lawgic DS — Dark Mode
                            'navy-900': '#101836',
                            'navy-800': '#182249',
                            'navy-700': '#1E2A59',
                            // Semantic
                            green: '#22C55E',
                            red: '#EF4444',
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
                  borderRadius: {
                            'pill': '9999px',
                            'card': '16px',
                            'card-sm': '14px',
                            'input': '12px',
                            'tile': '12px',
                  },
                  boxShadow: {
                            'sm-lawgic': '0 1px 2px rgba(16,24,40,0.06)',
                            'md-lawgic': '0 8px 24px rgba(16,24,40,0.08)',
                            'fab': '0 10px 30px rgba(16,24,40,0.18)',
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

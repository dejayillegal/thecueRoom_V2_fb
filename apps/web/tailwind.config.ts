import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#ffffff",
        card: {
          DEFAULT: "#1a1a1a",
          foreground: "#ffffff",
        },
        primary: {
          DEFAULT: "#D7FF3C",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#9B5CFF",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#2a2a2a",
          foreground: "#999999",
        },
        border: "#2a2a2a",
        input: "#0a0a0a",
        ring: "#D7FF3C",
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      },
      transitionTimingFunction: {
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
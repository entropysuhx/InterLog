import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./pages/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./src/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        content: "90rem",
        reading: "44rem",
      },
      zIndex: {
        raised: "10",
        sticky: "20",
        dropdown: "30",
        overlay: "40",
        modal: "50",
        toast: "60",
        tooltip: "70",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;


import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Panasa brand colors
        navy: {
          DEFAULT: "#0B1F3A",
          50: "#E8ECF2",
          100: "#C5D0E0",
          200: "#9FB0C8",
          300: "#7890AF",
          400: "#597897",
          500: "#3D5E80",
          600: "#284A6C",
          700: "#173759",
          800: "#0B1F3A",
          900: "#050F1D",
        },
        teal: {
          DEFAULT: "#028090",
          50: "#E6F5F7",
          100: "#C0E7EB",
          200: "#96D7DE",
          300: "#68C4CE",
          400: "#3DAEBC",
          500: "#028090",
          600: "#026B79",
          700: "#025662",
          800: "#01414B",
          900: "#012B32",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

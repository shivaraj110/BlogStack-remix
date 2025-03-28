import type { Config } from "tailwindcss";
import { withUt } from "uploadthing/tw";
export default withUt({
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        typing: {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.6" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out forwards",
        pulse: "pulse 2s ease-in-out infinite",
        typing: "typing 1.3s infinite ease-in-out",
        bounce: "bounce 0.5s ease-in-out",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "inherit",
            a: {
              color: "#3b82f6",
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            },
            blockquote: {
              borderLeftColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              padding: "0.5em 1em",
              borderRadius: "0.25em",
            },
            code: {
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              padding: "0.2em 0.4em",
              borderRadius: "0.25em",
              fontFamily: "monospace",
            },
            pre: {
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              padding: "0.75em",
              borderRadius: "0.25em",
            },
            img: {
              borderRadius: "0.375rem",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}) satisfies Config;

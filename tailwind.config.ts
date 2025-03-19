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

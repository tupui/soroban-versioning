/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    screens: {
      sm: "480px",
      md: "768px",
      lg: "976px",
      xl: "1440px",
    },
    extend: {
      colors: {
        black: "#000000",
        white: "#FFFFFF",
        pink: "#311255",
        gray: "#B4B4B4",
        stone: "#231F20",
        lime: "#B9FF66",
        blue: "#0B32F6",
        red: "#FF3B30",
        yellow: "#E0D911",
        active: "#ED9033",
        interest: "#A9EE72",
        conflict: "#FF8383",
        abstain: "#C2C2C2",
        voted: "#B40BF6",
        approved: "#43B369",
        zinc: {
          100: "#F3F3F3",
          200: "#F0F0F0",
          300: "#D9D9D9",
          400: "#D5D5D5",
          500: "#CBCBCB",
          600: "#A3A3A3",
          700: "#868489",
          800: "#4C4354",
          900: "#191A23",
        },
      },
      fontFamily: {
        firacode: ["Fira Code", "monospace"],
        victorMono: ["Victor Mono", "monospace"],
        firaMono: ["Fira Mono", "monospace"],
      },
    },
    boxShadow: {
      card: "0px 5px 0px 0px #191A23",
      vote: "0px 0px 4px 4px #ACFF75",
      button: "1px 3px 18px rgba(45, 15, 81, 0.08)",
      searchBox: "4px 8px 36px rgba(49, 18, 85, 0.12)",
    },
  },
};

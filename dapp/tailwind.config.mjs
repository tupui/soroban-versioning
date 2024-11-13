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
        gray: "#B4B4B4",
        stone: "#231F20",
        lime: "#B9FF66",
        green: "#43B369",
        blue: "#0B32F6",
        red: "#E70C0C",
        yellow: "#E0D911",
        zinc: {
          100: "#F3F3F3",
          200: "#F0F0F0",
          300: "#D9D9D9",
          400: "#D5D5D5",
          500: "#CBCBCB",
          600: "#A3A3A3",
          700: "#787878",
          800: "#494949",
          900: "#191A23",
        },
      },
      fontFamily: {
        SpaceGrotesk: ["Space Grotesk", "sans-serif"],
      },
    },
    boxShadow: {
      card: "0px 5px 0px 0px #191A23",
    },
  },
};

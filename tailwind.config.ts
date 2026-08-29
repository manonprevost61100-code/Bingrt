import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#0E0E14",
        panel: "#17171F",
        "panel-2": "#1E1E28",
        stroke: "#2B2B38",
        cream: "#F4EFE6",
        slate: "#9391A3",
        amber: "#F5A544",
        magenta: "#FF4E86",
        teal: "#3FBFA6",
      },
      fontFamily: {
        display: ["Anton", "sans-serif"],
        body: ["Manrope", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

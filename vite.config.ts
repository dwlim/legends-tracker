import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/clash-upgrade-library/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        legends: "legends-summary.html",
      },
    },
  },
});

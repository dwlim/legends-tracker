import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/legends-tracker/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
      },
    },
  },
});

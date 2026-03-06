import { defineConfig } from "vite";
import { resolve } from "path";

import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        esponsor_en: resolve(__dirname, "sponsors/en/become_sponsor.html"),
        thank_you: resolve(__dirname, "thank-you.html"),
      },
    },
  },
});

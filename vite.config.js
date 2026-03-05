import { defineConfig } from "vite";
import { resolve } from "path";

import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        en: resolve(__dirname, "en.html"),
        esponsor_en: resolve(__dirname, "sponsors/en/become_sponsor.html"),
        esponsor_es: resolve(__dirname, "sponsors/es/conviertete_en_esponsor.html"),
      },
    },
  },
});

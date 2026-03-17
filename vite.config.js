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
        'admin-login': resolve(__dirname, 'admin/login.html'),
        'admin-dashboard': resolve(__dirname, 'admin/dashboard.html'),
        'admin-event-form': resolve(__dirname, 'admin/event-form.html'),
        'events': resolve(__dirname, 'events.html'),
        'event-details': resolve(__dirname, 'event-details.html'),
      },
    },
  },
});

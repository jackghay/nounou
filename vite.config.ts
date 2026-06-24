import { defineConfig } from "vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitropack/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro(),
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
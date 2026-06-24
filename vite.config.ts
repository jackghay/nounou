import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro as originalNitro } from "nitro/vite";
import { fileURLToPath, URL } from "node:url";

// Custom wrapper to patch a bug in Nitro v3 beta's Vite plugin
// where it accesses `this.meta` in the `config` hook where `this` is undefined in Vite 6.
function safeNitro(options?: any) {
  const plugins = originalNitro(options);
  if (!Array.isArray(plugins)) return plugins;
  return plugins.map((plugin: any) => {
    if (plugin && plugin.name === "nitro:init") {
      const originalConfig = plugin.config;
      plugin.config = function (this: any, config: any, configEnv: any) {
        const context = this || { meta: {} };
        if (!context.meta) {
          context.meta = {};
        }
        return originalConfig.call(context, config, configEnv);
      };
    }
    return plugin;
  });
}

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    safeNitro(),
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
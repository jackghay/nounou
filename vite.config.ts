import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath, URL } from "node:url";
import fs from "node:fs";
import path from "node:path";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    {
      name: "fix-malformed-input",
      enforce: "post",
      config(config: any) {
        // Enforce the correct outDir from the Vinxi router config if present
        if (config.router) {
          console.log("[Fix Config] Router:", config.router.name, "type:", config.router.type, "handler:", config.router.handler, "outDir:", config.router.outDir);
          const outDir = config.router.outDir;
          if (outDir) {
            config.build = config.build || {};
            config.build.outDir = outDir;
            
            // For Vite 6 Environment API, also enforce it on all environments
            if (config.environments) {
              for (const envName in config.environments) {
                const env = config.environments[envName];
                if (env) {
                  env.build = env.build || {};
                  env.build.outDir = outDir;
                  console.log(`[Fix Config] Forcibly set environments.${envName}.build.outDir to:`, env.build.outDir);
                }
              }
            }
          }

          // Write temporary index.html if it's an SPA router and index.html doesn't exist on disk
          if (config.router.type === "spa") {
            const htmlPath = path.join(config.root || process.cwd(), "index.html");
            if (!fs.existsSync(htmlPath)) {
              console.log("[Fix Config] Writing temporary index.html to:", htmlPath);
              fs.writeFileSync(htmlPath, `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nounou Gallery</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`, "utf8");
              
              // Register cleanup
              process.on("exit", () => {
                try {
                  if (fs.existsSync(htmlPath)) {
                    fs.unlinkSync(htmlPath);
                    console.log("[Fix Config] Cleaned up temporary index.html");
                  }
                } catch (e) {}
              });
            }
          }
        }
        if (config.build?.rollupOptions?.input) {
          const input = config.build.rollupOptions.input;
          if (Array.isArray(input)) {
            const newInputObject: Record<string, string> = {};
            for (const item of input) {
              if (typeof item === "string") {
                // Use relative path for index.html as Vite expects
                if (item.endsWith("index.html")) {
                  newInputObject["index.html"] = "index.html";
                } else {
                  newInputObject[item] = item;
                }
              } else if (item && typeof item === "object") {
                Object.assign(newInputObject, item);
              }
            }
            console.log("[Fix Config] Converted malformed input array to object:", newInputObject);
            config.build.rollupOptions.input = newInputObject;
          }
        }
      },
      configResolved(config: any) {
        // Enforce the correct outDir in configResolved as well
        if (config.router && config.router.outDir) {
          const outDir = config.router.outDir;
          config.build.outDir = outDir;
          
          if (config.environments) {
            for (const envName in config.environments) {
              const env = config.environments[envName];
              if (env && env.build) {
                env.build.outDir = outDir;
              }
            }
          }
        }
        if (config.build?.rollupOptions?.input) {
          const input = config.build.rollupOptions.input;
          if (Array.isArray(input)) {
            const newInputObject: Record<string, string> = {};
            for (const item of input) {
              if (typeof item === "string") {
                if (item.endsWith("index.html")) {
                  newInputObject["index.html"] = "index.html";
                } else {
                  newInputObject[item] = item;
                }
              } else if (item && typeof item === "object") {
                Object.assign(newInputObject, item);
              }
            }
            config.build.rollupOptions.input = newInputObject;
          }
          console.log("VITE RESOLVED INPUT FOR", config.name || "default", ":", config.build.rollupOptions.input);
          console.log("VITE RESOLVED OUTDIR FOR", config.name || "default", ":", config.build.outDir);
          if (config.environments) {
            for (const envName in config.environments) {
              console.log(`VITE RESOLVED OUTDIR FOR environment ${envName} :`, config.environments[envName]?.build?.outDir);
            }
          }
        }
      }
    }
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
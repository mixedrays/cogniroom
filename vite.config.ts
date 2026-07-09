import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { VitePWA } from "vite-plugin-pwa";

function resolveCommitHash(): string {
  if (process.env.APP_COMMIT_HASH) return process.env.APP_COMMIT_HASH;
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

const config = defineConfig({
  optimizeDeps: {
    include: ["mermaid"],
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
    APP_COMMIT_HASH: JSON.stringify(resolveCommitHash()),
  },
  envPrefix: ["VITE_", "APP_"],
  plugins: [
    devtools(),
    nitro({
      serverDir: "server",
      // Nitro's default chunk naming embeds route params like `[id]` in the
      // server chunk filenames (e.g. `_routes/api/courses/[id]/...`). With the
      // rollup-based Vite build those brackets are parsed as invalid output
      // placeholders and abort the build, so emit bracket-free chunk names.
      rollupConfig: {
        output: {
          chunkFileNames: (chunkInfo: { name: string }) =>
            `_chunks/${chunkInfo.name.replace(/[^\w.-]+/g, "_")}-[hash].mjs`,
        },
      },
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: {
        enabled: false,
      },
      // Manifest is served as a static file from public/manifest.webmanifest
      // so it works in dev without enabling the dev SW.
      manifest: false,
      workbox: {
        navigateFallback: "/",
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              request.method === "GET" &&
              /^\/api\/(courses|decks|prompts|settings)(\/|$)/.test(
                url.pathname
              ) &&
              !/\/(generate|enhance)(\/|$)/.test(url.pathname),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-reads",
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              /^\/api\/(.*\/generate|.*\/enhance|wizard-agent|wizard|agent|instructions)(\/|$)/.test(
                url.pathname
              ),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ request, url }) =>
              request.method === "GET" && /^\/api\//.test(url.pathname),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-other",
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});

export default config;

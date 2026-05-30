import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { VitePWA } from "vite-plugin-pwa";

const config = defineConfig({
  optimizeDeps: {
    include: ["mermaid"],
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  envPrefix: ["VITE_", "APP_"],
  plugins: [
    devtools(),
    nitro({
      serverDir: "server",
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

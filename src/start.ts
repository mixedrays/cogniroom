import { createStart } from "@tanstack/react-start";

/**
 * TanStack Start instance. `getOptions` runs on the server at request time, so
 * `defaultSsr` is resolved from the runtime `STORAGE_MODE` env (no rebuild to
 * switch). The value is serialized into the HTML (`window.__TSS_START_OPTIONS__`)
 * so the client uses the same setting.
 *
 * In `browser` mode the authoritative store is the browser's IndexedDB, which
 * does not exist during SSR — so we disable SSR data loading and let routes
 * render shells and load all data on the client after hydration. `filesystem`
 * mode keeps the framework default (SSR enabled), leaving behavior unchanged.
 */
export const startInstance = createStart(() => {
  const browserMode =
    typeof process !== "undefined" && process.env.STORAGE_MODE === "browser";
  return {
    defaultSsr: browserMode ? false : true,
  };
});

import { createStart } from "@tanstack/react-start";

/**
 * TanStack Start instance. `getOptions` runs on the server at request time AND
 * again on the client during hydration (`hydrateStart` calls
 * `startInstance.getOptions()` to populate `window.__TSS_START_OPTIONS__`), so
 * it MUST resolve the same `defaultSsr` on both sides.
 *
 * The switch is the runtime `STORAGE_MODE` env (no rebuild to flip on Vercel).
 * On the server we read `process.env` directly. In the client bundle that env
 * var does not exist, so we read the same value the server exposes at
 * `/api/config`. If the two disagreed (e.g. client falling back to the
 * framework default of SSR-on while the server rendered an SSR-off shell), the
 * client would try to hydrate DOM that was never sent and render nothing.
 *
 * In `browser` mode the authoritative store is the browser's IndexedDB, which
 * does not exist during SSR — so we disable SSR data loading and let routes
 * render shells and load all data on the client after hydration. `filesystem`
 * mode keeps the framework default (SSR enabled), leaving behavior unchanged.
 */
async function resolveBrowserMode(): Promise<boolean> {
  if (typeof window === "undefined") {
    return process.env.STORAGE_MODE === "browser";
  }
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const json = (await res.json()) as { storageMode?: unknown };
      return json.storageMode === "browser";
    }
  } catch {
    // fall through to the SSR-on default below
  }
  return false;
}

export const startInstance = createStart(async () => {
  const browserMode = await resolveBrowserMode();
  return {
    defaultSsr: !browserMode,
  };
});

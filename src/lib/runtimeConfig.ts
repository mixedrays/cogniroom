/**
 * Runtime storage-mode resolution, shared by the client data layer.
 *
 * The mode is delivered from the server at runtime (`GET /api/config`) rather
 * than a build-time `VITE_` var, so a deployment can flip `STORAGE_MODE`
 * without a rebuild. On the server we read `process.env` directly to avoid an
 * SSR self-fetch; in the browser we fetch once, memoize the promise, and mirror
 * the result into the IndexedDB cache so an offline reload still knows the mode.
 */

import { readCache, writeCache } from "./clientStorage";

export type StorageMode = "filesystem" | "browser";

const CONFIG_CACHE_KEY = "config/storageMode";

let modePromise: Promise<StorageMode> | null = null;

function normalizeMode(value: unknown): StorageMode | null {
  return value === "filesystem" || value === "browser" ? value : null;
}

async function resolveBrowserMode(): Promise<StorageMode> {
  try {
    const response = await fetch("/api/config");
    if (response.ok) {
      const json = (await response.json()) as { storageMode?: unknown };
      const mode = normalizeMode(json.storageMode);
      if (mode) {
        void writeCache(CONFIG_CACHE_KEY, mode);
        return mode;
      }
    }
  } catch {
    // fall through to cached/default resolution below
  }

  // Total failure (offline, server unreachable): trust a previously mirrored
  // value if present, otherwise preserve the historical default.
  const cached = normalizeMode(await readCache<string>(CONFIG_CACHE_KEY));
  return cached ?? "filesystem";
}

/**
 * Resolve the active storage mode. Memoized in the browser for the tab's
 * lifetime; recomputed cheaply on the server.
 */
export async function getStorageMode(): Promise<StorageMode> {
  if (typeof window === "undefined") {
    return normalizeMode(process.env.STORAGE_MODE) ?? "filesystem";
  }
  if (!modePromise) {
    modePromise = resolveBrowserMode();
  }
  return modePromise;
}

/** Test seam: force re-resolution of the memoized browser mode. */
export function resetStorageModeCache(): void {
  modePromise = null;
}

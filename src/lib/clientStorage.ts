/**
 * Browser-side JSON cache backed by the storage module's IndexedDB adapter.
 *
 * Cache keys are extensionless (e.g. "cache/courses/123"), so values are
 * explicitly JSON-encoded here rather than relying on the adapter's
 * extension-based auto-parsing. This also lets non-object values (strings,
 * numbers) round-trip safely.
 */

import { createClientStorageApi } from "@/modules/storage/client";
import type { StorageApi } from "@/modules/storage/client";
import { StorageStatus } from "@/modules/storage/types";

let api: StorageApi | null = null;

function getClientApi(): StorageApi | null {
  if (typeof window === "undefined") return null;
  if (typeof indexedDB === "undefined") return null;
  if (!api) {
    api = createClientStorageApi({
      databaseName: "cogniroom-cache",
      storeName: "entries",
    });
  }
  return api;
}

export async function readCache<T>(path: string): Promise<T | null> {
  const a = getClientApi();
  if (!a) return null;
  try {
    const response = await a.get(path);
    if (!response.ok) return null;
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function writeCache(path: string, value: unknown): Promise<void> {
  const a = getClientApi();
  if (!a) return;
  try {
    await a.put(path, JSON.stringify(value));
  } catch {
    // Cache write failures are non-fatal.
  }
}

export async function listCachePaths(prefix: string): Promise<string[]> {
  const a = getClientApi();
  if (!a) return [];
  try {
    const entries = await a.list(prefix, {
      files: true,
      directories: false,
      recursive: true,
    });
    return entries.map((e) => e.path);
  } catch {
    return [];
  }
}

export async function deleteCache(
  path: string,
  recursive = false
): Promise<void> {
  const a = getClientApi();
  if (!a) return;
  try {
    await a.delete(path, recursive);
  } catch {
    // Non-fatal.
  }
}

/**
 * Try a network fetch and mirror its result into the IndexedDB cache.
 * If the fetch throws (e.g. offline) or returns falsy, fall back to the
 * cached value at `cachePath`.
 *
 * The fetcher is responsible for returning the value to cache; on null/undefined
 * (e.g. a 404 from the server) we do not overwrite the cache so older cached
 * content remains available offline.
 */
export async function withReadMirror<T>(
  cachePath: string,
  fetcher: () => Promise<T | null>
): Promise<T | null> {
  try {
    const value = await fetcher();
    if (value !== null && value !== undefined) {
      void writeCache(cachePath, value);
      return value;
    }
    // Fall through to cache only when the network result was falsy
    const cached = await readCache<T>(cachePath);
    return cached;
  } catch {
    const cached = await readCache<T>(cachePath);
    return cached;
  }
}

export { StorageStatus };

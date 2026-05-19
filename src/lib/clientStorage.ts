import { IndexedDBAdapter } from "@/modules/storage/adapters/indexeddb";
import { StorageStatus } from "@/modules/storage/types";

let adapter: IndexedDBAdapter | null = null;

function getClientAdapter(): IndexedDBAdapter | null {
  if (typeof window === "undefined") return null;
  if (typeof indexedDB === "undefined") return null;
  if (!adapter) {
    adapter = new IndexedDBAdapter({
      adapter: "indexeddb",
      basePath: "/",
      databaseName: "cogniroom-cache",
      storeName: "entries",
    });
  }
  return adapter;
}

export async function readCache<T>(path: string): Promise<T | null> {
  const a = getClientAdapter();
  if (!a) return null;
  try {
    const response = await a.execute<string>({
      path,
      method: "GET",
      headers: {},
      options: {},
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function writeCache(path: string, value: unknown): Promise<void> {
  const a = getClientAdapter();
  if (!a) return;
  try {
    await a.execute({
      path,
      method: "PUT",
      body: JSON.stringify(value),
      headers: {},
      options: {},
    });
  } catch {
    // Cache write failures are non-fatal.
  }
}

export async function listCachePaths(prefix: string): Promise<string[]> {
  const a = getClientAdapter();
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
  const a = getClientAdapter();
  if (!a) return;
  try {
    await a.execute({
      path,
      method: "DELETE",
      headers: {},
      options: { recursive },
    });
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

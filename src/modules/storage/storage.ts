/**
 * Main storage module (server entry)
 * Provides a fetch()-like API for storage operations.
 *
 * This entry can construct the FileSystemAdapter and therefore pulls in Node
 * built-ins. Browser code should import from `./client` instead.
 */

import { FileSystemAdapter, IndexedDBAdapter, StorageAdapter } from "./adapters";
import { buildStorageApi, executeStorage } from "./api";
import type { StorageApi } from "./api";
import type { StorageConfig, StorageInit, StorageResponse } from "./types";

// Default adapter instance
let defaultAdapter: StorageAdapter | null = null;

/**
 * Initialize storage with a specific adapter
 * Call this at application startup to configure the storage backend
 */
export function initStorage(adapter: StorageAdapter): void {
  defaultAdapter = adapter;
}

/**
 * Get the current adapter, initializing from environment defaults if needed.
 * The server adapter is always the filesystem; the only user-facing switch is
 * `STORAGE_MODE` (see `server/env.ts`), which routes writes to the browser's
 * IndexedDB via the client data layer rather than swapping the server adapter.
 */
export function getAdapter(): StorageAdapter {
  if (!defaultAdapter) {
    defaultAdapter = createStorage({
      basePath: process.env.DATA_PATH || "./data",
      adapter: "filesystem",
    });
  }
  return defaultAdapter;
}

/**
 * Create a storage adapter with custom configuration
 */
export function createStorage(config: StorageConfig = {}): StorageAdapter {
  const adapterType = config.adapter ?? "filesystem";

  switch (adapterType) {
    case "filesystem":
      return new FileSystemAdapter(config);
    case "indexeddb":
      return new IndexedDBAdapter(config);
    default:
      throw new Error(`Unknown adapter type: ${adapterType}`);
  }
}

/**
 * Main storage function - works like fetch()
 *
 * @example
 * // GET a file
 * const response = await storage<Course>("courses/123/course.json");
 * const course = await response.json();
 *
 * @example
 * // POST a new file
 * await storage("courses/123/course.json", {
 *   method: "POST",
 *   body: courseData
 * });
 *
 * @example
 * // DELETE a directory
 * await storage("courses/123", {
 *   method: "DELETE",
 *   options: { recursive: true }
 * });
 */
export async function storage<T = unknown>(
  path: string,
  init: StorageInit = {},
  customAdapter?: StorageAdapter
): Promise<StorageResponse<T>> {
  return executeStorage<T>(customAdapter ?? getAdapter(), path, init);
}

/**
 * Convenience methods for common operations against the default adapter.
 * The default adapter is resolved lazily on each call, so `initStorage` can
 * still reconfigure the backend after module load.
 */
export const storageApi: StorageApi = buildStorageApi(() => getAdapter());

export type { StorageApi } from "./api";

/**
 * Create a scoped storage API bound to a custom adapter configuration.
 * Use this to access storage with a different base path or backend.
 *
 * @example
 * const settingsStorage = createStorageApi({ basePath: ".settings" });
 * const response = await settingsStorage.get<Settings>("settings.json");
 */
export function createStorageApi(config: StorageConfig): StorageApi {
  const adapter = createStorage(config);
  return buildStorageApi(() => adapter);
}

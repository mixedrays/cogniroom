/**
 * Main storage module
 * Provides a fetch()-like API for storage operations
 */

import { resolve } from "node:path";
import {
  FileSystemAdapter,
  IndexedDBAdapter,
  StorageAdapter,
} from "./adapters";
import type {
  FileMetadata,
  ListOptions,
  StorageConfig,
  StorageInit,
  StorageRequest,
  StorageResponse,
} from "./types";

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
 * Get the current adapter, initializing with FileSystemAdapter if needed
 */
export function getAdapter(): StorageAdapter {
  if (!defaultAdapter) {
    const basePath = resolve(process.cwd(), process.env.DATA_PATH || "./data");
    const adapter =
      (process.env.STORAGE_ADAPTER as StorageConfig["adapter"]) ?? "filesystem";
    defaultAdapter = createStorage({ basePath, adapter });
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
    case "database":
      throw new Error("Database adapter not yet implemented");
    case "localstorage":
      throw new Error("LocalStorage adapter not yet implemented");
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
  const adapter = customAdapter ?? getAdapter();

  const request: StorageRequest = {
    path,
    method: init.method ?? "GET",
    body: init.body,
    headers: init.headers ?? {},
    options: init.options ?? {},
  };

  return adapter.execute<T>(request);
}

/**
 * Build a convenience API over an adapter. When `customAdapter` is omitted the
 * default adapter is resolved lazily on each call (via `getAdapter()`), so
 * `initStorage` can still configure the backend after this object is created.
 * Every method — including `list`/`stat` — honors `customAdapter`, so a scoped
 * API never silently falls back to the default backend.
 */
function buildStorageApi(customAdapter?: StorageAdapter) {
  const resolveAdapter = () => customAdapter ?? getAdapter();

  return {
    /**
     * GET a file
     * @example
     * const response = await storageApi.get<Course>("courses/123/course.json");
     * const course = await response.json();
     */
    get: <T = unknown>(path: string): Promise<StorageResponse<T>> =>
      storage<T>(path, { method: "GET" }, customAdapter),

    /**
     * POST (create) a new file
     * @example
     * await storageApi.post("courses/123/course.json", courseData);
     */
    post: <T = unknown>(
      path: string,
      body: string | object
    ): Promise<StorageResponse<T>> =>
      storage<T>(path, { method: "POST", body }, customAdapter),

    /**
     * PUT (update) an existing file
     * @example
     * await storageApi.put("courses/123/course.json", updatedCourse);
     */
    put: <T = unknown>(
      path: string,
      body: string | object
    ): Promise<StorageResponse<T>> =>
      storage<T>(path, { method: "PUT", body }, customAdapter),

    /**
     * DELETE a file or directory
     * @example
     * await storageApi.delete("courses/123", true); // recursive
     */
    delete: (path: string, recursive = false): Promise<StorageResponse<void>> =>
      storage<void>(
        path,
        { method: "DELETE", options: { recursive } },
        customAdapter
      ),

    /**
     * Check if a path exists
     * @example
     * if (await storageApi.exists("courses/123/course.json")) { ... }
     */
    exists: async (path: string): Promise<boolean> => {
      const response = await storage(path, { method: "HEAD" }, customAdapter);
      return response.ok;
    },

    /**
     * List directory contents
     * @example
     * const files = await storageApi.list("courses", { extension: ".json" });
     */
    list: (path: string, options?: ListOptions): Promise<FileMetadata[]> =>
      resolveAdapter().list(path, options),

    /**
     * Get file/directory metadata
     * @example
     * const meta = await storageApi.stat("courses/123/course.json");
     */
    stat: (path: string): Promise<FileMetadata | null> =>
      resolveAdapter().stat(path),
  };
}

/**
 * Convenience methods for common operations against the default adapter.
 */
export const storageApi = buildStorageApi();

export type StorageApi = typeof storageApi;

/**
 * Create a scoped storage API bound to a custom adapter configuration.
 * Use this to access storage with a different base path or backend.
 *
 * @example
 * const settingsStorage = createStorageApi({ basePath: ".settings" });
 * const response = await settingsStorage.get<Settings>("settings.json");
 */
export function createStorageApi(config: StorageConfig): StorageApi {
  return buildStorageApi(createStorage(config));
}

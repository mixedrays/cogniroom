/**
 * Main storage module
 * Provides a fetch()-like API for storage operations
 */

import { resolve } from "node:path";
import { FileSystemAdapter, StorageAdapter } from "./adapters";
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
    // Default to filesystem adapter with data directory as base
    const basePath = resolve(process.cwd(), process.env.DATA_PATH || "./data");
    defaultAdapter = new FileSystemAdapter({ basePath });
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
  init: StorageInit = {}
): Promise<StorageResponse<T>> {
  const adapter = getAdapter();

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
 * Convenience methods for common operations
 */
export const storageApi = {
  /**
   * GET a file
   * @example
   * const response = await storageApi.get<Course>("courses/123/course.json");
   * const course = await response.json();
   */
  get: <T = unknown>(path: string): Promise<StorageResponse<T>> => {
    return storage<T>(path, { method: "GET" });
  },

  /**
   * POST (create) a new file
   * @example
   * await storageApi.post("courses/123/course.json", courseData);
   */
  post: <T = unknown>(
    path: string,
    body: string | object
  ): Promise<StorageResponse<T>> => {
    return storage<T>(path, { method: "POST", body });
  },

  /**
   * PUT (update) an existing file
   * @example
   * await storageApi.put("courses/123/course.json", updatedCourse);
   */
  put: <T = unknown>(
    path: string,
    body: string | object
  ): Promise<StorageResponse<T>> => {
    return storage<T>(path, { method: "PUT", body });
  },

  /**
   * DELETE a file or directory
   * @example
   * await storageApi.delete("courses/123", true); // recursive
   */
  delete: (path: string, recursive = false): Promise<StorageResponse<void>> => {
    return storage<void>(path, { method: "DELETE", options: { recursive } });
  },

  /**
   * Check if a path exists
   * @example
   * if (await storageApi.exists("courses/123/course.json")) { ... }
   */
  exists: async (path: string): Promise<boolean> => {
    const response = await storage(path, { method: "HEAD" });
    return response.ok;
  },

  /**
   * List directory contents
   * @example
   * const files = await storageApi.list("courses", { extension: ".json" });
   */
  list: (path: string, options?: ListOptions): Promise<FileMetadata[]> => {
    return getAdapter().list(path, options);
  },

  /**
   * Get file/directory metadata
   * @example
   * const meta = await storageApi.stat("courses/123/course.json");
   */
  stat: (path: string): Promise<FileMetadata | null> => {
    return getAdapter().stat(path);
  },
};

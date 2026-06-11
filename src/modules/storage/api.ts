/**
 * Adapter-agnostic storage API core.
 *
 * Browser-safe: imports no Node built-ins and no concrete adapters. Both the
 * server entry (`storage.ts`) and the browser entry (`client.ts`) build their
 * public APIs from here so every backend goes through the same code paths.
 */

import type { StorageAdapter } from "./adapters/base";
import type {
  FileMetadata,
  ListOptions,
  StorageInit,
  StorageResponse,
} from "./types";

/**
 * Execute a fetch()-like storage request against an explicit adapter.
 */
export function executeStorage<T = unknown>(
  adapter: StorageAdapter,
  path: string,
  init: StorageInit = {}
): Promise<StorageResponse<T>> {
  return adapter.execute<T>({
    path,
    method: init.method ?? "GET",
    body: init.body,
    options: init.options ?? {},
  });
}

/**
 * Build a convenience API over an adapter. The adapter is resolved lazily on
 * each call, so a resolver backed by mutable state (e.g. `initStorage`) can
 * reconfigure the backend after this object is created.
 */
export function buildStorageApi(resolveAdapter: () => StorageAdapter) {
  return {
    /**
     * GET a file
     * @example
     * const response = await storageApi.get<Course>("courses/123/course.json");
     * const course = await response.json();
     */
    get: <T = unknown>(path: string): Promise<StorageResponse<T>> =>
      executeStorage<T>(resolveAdapter(), path),

    /**
     * POST (create) a new file. Fails with 409 if the path already exists.
     * @example
     * await storageApi.post("courses/123/course.json", courseData);
     */
    post: <T = unknown>(
      path: string,
      body: string | object
    ): Promise<StorageResponse<T>> =>
      executeStorage<T>(resolveAdapter(), path, { method: "POST", body }),

    /**
     * PUT (create or update) a file
     * @example
     * await storageApi.put("courses/123/course.json", updatedCourse);
     */
    put: <T = unknown>(
      path: string,
      body: string | object
    ): Promise<StorageResponse<T>> =>
      executeStorage<T>(resolveAdapter(), path, { method: "PUT", body }),

    /**
     * DELETE a file or directory
     * @example
     * await storageApi.delete("courses/123", true); // recursive
     */
    delete: (path: string, recursive = false): Promise<StorageResponse<void>> =>
      executeStorage<void>(resolveAdapter(), path, {
        method: "DELETE",
        options: { recursive },
      }),

    /**
     * Check if a path exists
     * @example
     * if (await storageApi.exists("courses/123/course.json")) { ... }
     */
    exists: async (path: string): Promise<boolean> => {
      const response = await executeStorage(resolveAdapter(), path, {
        method: "HEAD",
      });
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

export type StorageApi = ReturnType<typeof buildStorageApi>;

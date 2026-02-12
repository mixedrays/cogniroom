/**
 * Storage module - fetch()-compatible storage abstraction
 *
 * @example
 * import { storage, storageApi } from "@/modules/storage";
 *
 * // Using the fetch-like API
 * const response = await storage<Course>("courses/123/course.json");
 * if (response.ok) {
 *   const course = await response.json();
 * }
 *
 * // Using convenience methods
 * const exists = await storageApi.exists("courses/123/course.json");
 * const files = await storageApi.list("courses", { extension: ".json" });
 */

// Main API
export {
  createStorage,
  getAdapter,
  initStorage,
  storage,
  storageApi,
} from "./storage";

// Adapters
export {
  DatabaseAdapter,
  FileSystemAdapter,
  LocalStorageAdapter,
  StorageAdapter,
} from "./adapters";

// Types
export type {
  FileMetadata,
  ListOptions,
  StorageConfig,
  StorageContentType,
  StorageInit,
  StorageMethod,
  StorageOptions,
  StorageRequest,
  StorageResponse,
  StorageStatusCode,
} from "./types";

export { StorageStatus, StorageStatusText } from "./types";

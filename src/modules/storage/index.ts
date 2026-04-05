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
 *
 * // Creating a scoped storage API with a different base path
 * const settingsStorage = createStorageApi({ basePath: ".settings" });
 * const settings = await settingsStorage.get<Settings>("settings.json");
 */

// Main API
export {
  createStorage,
  createStorageApi,
  getAdapter,
  initStorage,
  storage,
  storageApi,
} from "./storage";

export type { StorageApi } from "./storage";

// Types
export type {
  FileMetadata,
  ListOptions,
  StorageConfig,
  StorageContentType,
  StorageInit,
  StorageMethod,
  StorageOptions,
  StorageResponse,
  StorageStatusCode,
} from "./types";

export { StorageStatus, StorageStatusText } from "./types";

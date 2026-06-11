/**
 * Browser entry for the storage module.
 *
 * Imports no Node built-ins, so it is safe to include in client bundles.
 * Browser code should use this instead of `./storage` (the server entry),
 * which pulls in the filesystem adapter.
 *
 * @example
 * import { createClientStorageApi } from "@/modules/storage/client";
 *
 * const cache = createClientStorageApi({ databaseName: "my-cache" });
 * await cache.put("courses/123", JSON.stringify(course));
 */

import { IndexedDBAdapter } from "./adapters/indexeddb";
import { buildStorageApi } from "./api";
import type { StorageApi } from "./api";
import type { StorageConfig } from "./types";

export type { StorageApi } from "./api";

/**
 * Create a storage API backed by IndexedDB.
 */
export function createClientStorageApi(config: StorageConfig = {}): StorageApi {
  const adapter = new IndexedDBAdapter({ ...config, adapter: "indexeddb" });
  return buildStorageApi(() => adapter);
}

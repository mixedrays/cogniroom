/**
 * Browser-mode authoritative data store.
 *
 * A dedicated IndexedDB database ("cogniroom-data") that mirrors the exact
 * on-disk layout (`courses/<id>/course.md`, `decks/<id>/deck.json`, …) and file
 * formats used on the server filesystem, so the shared repository functions run
 * unchanged against it. This is deliberately a SEPARATE database from the
 * `cogniroom-cache` read-mirror (`clientStorage.ts`): the cache is disposable,
 * this store is the source of truth in `STORAGE_MODE=browser`.
 */

import { createClientStorageApi } from "@/modules/storage/client";
import type { StorageApi } from "@/modules/storage/client";

let dataApi: StorageApi | null = null;

/**
 * Whether the authoritative IndexedDB store can be reached from the current
 * execution context. False during SSR (no `window`/`indexedDB`), where browser
 * mode has no store to read — callers should return empty and let the client
 * refetch after hydration.
 */
export function isLocalDataAvailable(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

/** Resolve the IndexedDB-backed authoritative data API (browser only). */
export function getLocalDataApi(): StorageApi {
  if (!dataApi) {
    dataApi = createClientStorageApi({
      databaseName: "cogniroom-data",
      storeName: "files",
    });
  }
  return dataApi;
}

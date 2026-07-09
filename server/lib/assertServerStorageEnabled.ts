import { HTTPError } from "h3";
import { STORAGE_MODE } from "@root/server/env";

/**
 * Guard for content-mutating server endpoints. When `STORAGE_MODE=browser` the
 * browser's IndexedDB is authoritative and the server filesystem is read-only
 * (or vanishes on the next cold start), so any server-side write is a bug — a
 * dispatch site that should have gone to the local repo. Fail loudly with a 501
 * instead of attempting an fs write that ENOENTs or silently disappears.
 */
export function assertServerStorageEnabled(): void {
  if (STORAGE_MODE === "browser") {
    throw new HTTPError({
      status: 501,
      message: "Server storage is disabled (STORAGE_MODE=browser)",
    });
  }
}

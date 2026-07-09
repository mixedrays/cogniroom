import { defineEventHandler } from "h3";
import { STORAGE_MODE } from "@root/server/env";

/**
 * Runtime configuration the browser needs before it can dispatch data
 * operations. Delivered at runtime (not a build-time `VITE_` var) so the
 * storage mode can change on a deployment without rebuilding the client.
 */
export default defineEventHandler(() => {
  return { storageMode: STORAGE_MODE };
});

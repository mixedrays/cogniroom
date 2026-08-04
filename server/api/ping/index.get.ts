import { defineEventHandler, setResponseHeader } from "h3";

/**
 * Connectivity probe for the client's online detection (`src/lib/online.ts`).
 * Deliberately trivial and uncacheable: the client only cares whether the
 * request reaches the origin at all.
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  return { ok: true };
});

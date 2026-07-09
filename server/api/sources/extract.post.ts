import { defineEventHandler, readFormData, HTTPError } from "h3";
import { extractSource } from "@root/server/lib/sources/store";
import { toErrorMessage } from "@root/server/lib/errors";

/** Max upload size per file (25 MB), mirroring `sources/index.post.ts`. */
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Stateless upload processing for browser mode: run classification/extraction
 * server-side (parsing libs live here) but persist nothing. The client stores
 * the returned metadata, extracted text, and the original blob in its local
 * IndexedDB data store. See `.features/browser-storage-mode.md` §5.8.
 */
export default defineEventHandler(async (event) => {
  try {
    const form = await readFormData(event);
    const files = [...form.getAll("file"), ...form.getAll("files")].filter(
      (f): f is File => f instanceof File
    );
    if (files.length === 0) {
      throw new HTTPError({ status: 400, message: "No file provided" });
    }

    const results = [];
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        throw new HTTPError({
          status: 413,
          message: `"${file.name}" exceeds the ${MAX_BYTES / (1024 * 1024)}MB limit`,
        });
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      const extracted = await extractSource({
        bytes,
        filename: file.name || "upload",
        mimeType: file.type || undefined,
      });
      results.push(extracted);
    }

    return { success: true, results };
  } catch (error) {
    if (error instanceof HTTPError) throw error;
    console.error("Error extracting source:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});

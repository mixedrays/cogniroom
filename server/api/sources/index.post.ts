import { defineEventHandler, readFormData, HTTPError } from "h3";
import type { Source, SourceScope } from "@modules/core";
import { createSource } from "@root/server/lib/sources/store";
import { toErrorMessage } from "@root/server/lib/errors";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";

/** Max upload size per file (25 MB), mirroring the safeFetch cap planned for links. */
const MAX_BYTES = 25 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  try {
    assertServerStorageEnabled();
    const form = await readFormData(event);

    const scope: SourceScope = {};
    const courseId = form.get("courseId");
    const lessonId = form.get("lessonId");
    if (typeof courseId === "string" && courseId) scope.courseId = courseId;
    if (typeof lessonId === "string" && lessonId) scope.lessonId = lessonId;
    const hasScope = scope.courseId || scope.lessonId;

    const files = [...form.getAll("file"), ...form.getAll("files")].filter(
      (f): f is File => f instanceof File
    );
    if (files.length === 0) {
      throw new HTTPError({ status: 400, message: "No file provided" });
    }

    const sources: Source[] = [];
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        throw new HTTPError({
          status: 413,
          message: `"${file.name}" exceeds the ${MAX_BYTES / (1024 * 1024)}MB limit`,
        });
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      sources.push(
        await createSource({
          bytes,
          filename: file.name || "upload",
          mimeType: file.type || undefined,
          scope: hasScope ? scope : undefined,
        })
      );
    }

    return { success: true, sources };
  } catch (error) {
    if (error instanceof HTTPError) throw error;
    console.error("Error creating source:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});

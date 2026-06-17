import { defineEventHandler, getRouterParam, getQuery } from "h3";
import type { SourceScope } from "@modules/core";
import { deleteSource } from "@root/server/lib/sources/store";
import { toErrorMessage } from "@root/server/lib/errors";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) return { success: false, error: "Missing source ID" };

    const query = getQuery(event);
    const scope: SourceScope = {};
    if (query.courseId) scope.courseId = String(query.courseId);
    if (query.lessonId) scope.lessonId = String(query.lessonId);

    await deleteSource(id, scope.courseId || scope.lessonId ? scope : undefined);
    return { success: true };
  } catch (error) {
    console.error("Error deleting source:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});

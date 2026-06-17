import { defineEventHandler, getQuery } from "h3";
import type { SourceScope } from "@modules/core";
import { listSources } from "@root/server/lib/sources/store";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const scope: SourceScope = {};
  if (query.courseId) scope.courseId = String(query.courseId);
  if (query.lessonId) scope.lessonId = String(query.lessonId);
  const sources = await listSources(scope.courseId ? scope : undefined);
  return { sources };
});

import { defineEventHandler, readBody, createError, getRouterParam } from "h3";
import { storageApi } from "@root/modules/storage";
import { getFormatAdapter } from "@root/modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";

export default defineEventHandler(async (event) => {
  const courseId = getRouterParam(event, "id");
  const lessonId = getRouterParam(event, "lessonId");

  if (!courseId || !lessonId) {
    throw createError({ statusCode: 400, statusMessage: "Missing courseId or lessonId" });
  }

  const body = await readBody<{ content: unknown }>(event);
  if (!body?.content) {
    throw createError({ statusCode: 400, statusMessage: "content is required" });
  }

  const adapter = getFormatAdapter("quiz");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await storageApi.post(storagePaths.quiz(courseId, lessonId), adapter.serialize(body.content as any));
  return { success: true };
});

import { defineEventHandler, readBody, HTTPError, getRouterParam } from "h3";
import { storageApi } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";

export default defineEventHandler(async (event) => {
  const courseId = getRouterParam(event, "id");
  const lessonId = getRouterParam(event, "lessonId");

  if (!courseId || !lessonId) {
    throw new HTTPError({
      status: 400,
      message: "Missing courseId or lessonId",
    });
  }

  const body = await readBody<{ content: unknown }>(event);
  if (typeof body?.content !== "string" || body.content.trim().length === 0) {
    throw new HTTPError({
      status: 400,
      message: "content must be a non-empty string",
    });
  }

  await storageApi.post(storagePaths.lesson(courseId, lessonId), body.content);
  return { success: true };
});

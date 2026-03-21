import { defineEventHandler, readBody, createError, getRouterParam } from "h3";
import { storageApi } from "@root/modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";

export default defineEventHandler(async (event) => {
  const courseId = getRouterParam(event, "id");
  const lessonId = getRouterParam(event, "lessonId");

  if (!courseId || !lessonId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing courseId or lessonId",
    });
  }

  const body = await readBody<{ content: string }>(event);
  if (typeof body?.content !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "content must be a string",
    });
  }

  await storageApi.post(
    storagePaths.exercise(courseId, lessonId),
    body.content
  );
  return { success: true };
});

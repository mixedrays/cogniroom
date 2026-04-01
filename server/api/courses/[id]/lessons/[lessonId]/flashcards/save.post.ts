import { defineEventHandler, readBody, createError, getRouterParam } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { FlashcardsContent } from "@modules/core";

export default defineEventHandler(async (event) => {
  const courseId = getRouterParam(event, "id");
  const lessonId = getRouterParam(event, "lessonId");

  if (!courseId || !lessonId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing courseId or lessonId",
    });
  }

  const body = await readBody<{ content: FlashcardsContent }>(event);
  if (!body?.content) {
    throw createError({
      statusCode: 400,
      statusMessage: "content is required",
    });
  }

  const adapter = getFormatAdapter("flashcards");
  await storageApi.post(
    storagePaths.flashcards(courseId, lessonId),
    adapter.serialize(body.content)
  );
  return { success: true };
});

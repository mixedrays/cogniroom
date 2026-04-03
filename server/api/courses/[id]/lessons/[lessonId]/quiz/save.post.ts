import { defineEventHandler, readBody, HTTPError, getRouterParam } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { QuizContent } from "@modules/core";

export default defineEventHandler(async (event) => {
  const courseId = getRouterParam(event, "id");
  const lessonId = getRouterParam(event, "lessonId");

  if (!courseId || !lessonId) {
    throw new HTTPError({
      status: 400,
      message: "Missing courseId or lessonId",
    });
  }

  const body = await readBody<{ content: QuizContent }>(event);
  if (!body?.content) {
    throw new HTTPError({
      status: 400,
      message: "content is required",
    });
  }

  const adapter = getFormatAdapter("quiz");
  await storageApi.post(
    storagePaths.quiz(courseId, lessonId),
    adapter.serialize(body.content)
  );
  return { success: true };
});

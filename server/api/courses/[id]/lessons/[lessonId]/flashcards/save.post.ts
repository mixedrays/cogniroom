import { defineEventHandler, readBody, HTTPError, getRouterParam } from "h3";
import { storageApi } from "@modules/storage";
import { FlashcardsContentOutputSchema } from "@/modules/wizard-agent/lib/contentOutputSchemas";
import { courseRepo } from "@modules/repository";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";

export default defineEventHandler(async (event) => {
  assertServerStorageEnabled();
  const courseId = getRouterParam(event, "id");
  const lessonId = getRouterParam(event, "lessonId");

  if (!courseId || !lessonId) {
    throw new HTTPError({
      status: 400,
      message: "Missing courseId or lessonId",
    });
  }

  const body = await readBody<{ content: unknown }>(event);
  const parsed = FlashcardsContentOutputSchema.safeParse(body?.content);
  if (!parsed.success) {
    throw new HTTPError({
      status: 400,
      message: `Invalid flashcards content: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
    });
  }

  return courseRepo.saveLessonFlashcards(storageApi, courseId, lessonId, {
    version: 2,
    ...parsed.data,
  });
});

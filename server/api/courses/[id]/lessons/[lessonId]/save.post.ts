import { defineEventHandler, readBody, HTTPError, getRouterParam } from "h3";
import { storageApi } from "@modules/storage";
import { lessonContentSchema } from "@modules/core";
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

  const parsed = lessonContentSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw new HTTPError({
      status: 400,
      message: parsed.error.issues[0]?.message ?? "Invalid content",
    });
  }

  return courseRepo.saveLessonContent(
    storageApi,
    courseId,
    lessonId,
    parsed.data.content
  );
});

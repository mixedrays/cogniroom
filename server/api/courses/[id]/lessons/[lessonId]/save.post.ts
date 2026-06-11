import { defineEventHandler, readBody, HTTPError, getRouterParam } from "h3";
import { storageApi } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";
import { lessonContentSchema } from "@modules/core";

export default defineEventHandler(async (event) => {
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

  await storageApi.put(
    storagePaths.lesson(courseId, lessonId),
    parsed.data.content
  );
  return { success: true };
});

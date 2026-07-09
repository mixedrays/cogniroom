import { defineEventHandler, readBody, HTTPError, getRouterParam } from "h3";
import { storageApi } from "@modules/storage";
import { lessonCompletionUpdateSchema } from "@modules/core";
import { courseRepo } from "@modules/repository";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";

export default defineEventHandler(
  withErrorGuard("Failed to update lesson completion", async (event) => {
    assertServerStorageEnabled();
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      throw new HTTPError({
        status: 400,
        message: "Missing courseId or lessonId",
      });
    }

    const parsed = lessonCompletionUpdateSchema.safeParse(
      (await readBody(event)) ?? {}
    );
    if (!parsed.success) {
      throw new HTTPError({
        status: 400,
        message: `Invalid request body: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
      });
    }

    const result = await courseRepo.updateLessonCompletion(
      storageApi,
      courseId,
      lessonId,
      parsed.data.completed,
      parsed.data.section ?? "theory"
    );

    if (!result) {
      throw new HTTPError({
        status: 404,
        message: "Lesson not found in course",
      });
    }
    return result;
  })
);

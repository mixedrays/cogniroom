import { defineEventHandler, getRouterParam, readBody, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { reviewDataSchema } from "@modules/core";
import { courseRepo } from "@modules/repository";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";

export default defineEventHandler(
  withErrorGuard("Failed to save reviews", async (event) => {
    assertServerStorageEnabled();
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      throw new HTTPError({
        status: 400,
        message: "Missing course ID or lesson ID",
      });
    }

    const parsed = reviewDataSchema.safeParse(await readBody(event));
    if (!parsed.success) {
      throw new HTTPError({
        status: 400,
        message: `Invalid review data: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
      });
    }

    return courseRepo.saveFlashcardsReviews(
      storageApi,
      courseId,
      lessonId,
      parsed.data
    );
  })
);

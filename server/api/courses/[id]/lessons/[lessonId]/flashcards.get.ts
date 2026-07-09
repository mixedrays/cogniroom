import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { courseRepo } from "@modules/repository";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";

export default defineEventHandler(
  withErrorGuard("Failed to load flashcards", async (event) => {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      throw new HTTPError({
        status: 400,
        message: "Missing course ID or lesson ID",
      });
    }

    const result = await courseRepo.getLessonFlashcards(
      storageApi,
      courseId,
      lessonId
    );
    if (!result) {
      throw new HTTPError({ status: 404, message: "Flashcards not found" });
    }
    return result;
  })
);

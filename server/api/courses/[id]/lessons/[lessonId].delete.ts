import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { toErrorMessage } from "@root/server/lib/errors";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";
import { courseRepo } from "@modules/repository";

export default defineEventHandler(async (event) => {
  try {
    assertServerStorageEnabled();
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      return { success: false, error: "Missing courseId or lessonId" };
    }

    return await courseRepo.deleteLessonContent(storageApi, courseId, lessonId);
  } catch (error: unknown) {
    if (error instanceof HTTPError) throw error;
    console.error("Error deleting lesson content:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});

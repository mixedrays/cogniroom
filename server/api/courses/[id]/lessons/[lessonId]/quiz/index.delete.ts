import { defineEventHandler, getRouterParam } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import { toErrorMessage } from "@root/server/lib/errors";

export default defineEventHandler(async (event) => {
  try {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      return { success: false, error: "Missing courseId or lessonId" };
    }

    const courseAdapter = getFormatAdapter("course");

    const deleteResult = await storageApi.delete(
      storagePaths.quiz(courseId, lessonId)
    );

    if (!deleteResult.ok && deleteResult.status !== 404) {
      return { success: false, error: "Failed to delete quiz" };
    }

    // Reset quiz completion flag in course file
    const coursePath = storagePaths.course(courseId);
    const courseResponse = await storageApi.get<string>(coursePath);

    if (courseResponse.ok) {
      const text = await courseResponse.text();
      const course = courseAdapter.deserialize(text);

      for (const topic of course.topics ?? []) {
        const lesson = topic.lessons?.find((l) => l.id === lessonId);
        if (lesson) {
          lesson.quizCompleted = false;
          delete lesson.quizCompletedAt;
          break;
        }
      }

      course.updatedAt = new Date().toISOString();
      await storageApi.put(coursePath, courseAdapter.serialize(course));
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting quiz:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});

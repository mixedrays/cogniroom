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

    // Delete exercises file
    const deleteResponse = await storageApi.delete(
      storagePaths.exercise(courseId, lessonId)
    );
    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      return { success: false, error: deleteResponse.statusText };
    }

    const courseAdapter = getFormatAdapter("course");
    const coursePath = storagePaths.course(courseId);
    const courseResponse = await storageApi.get<string>(coursePath);

    if (courseResponse.ok) {
      const text = await courseResponse.text();
      const course = courseAdapter.deserialize(text);

      for (const topic of course.topics ?? []) {
        const lesson = topic.lessons?.find((l) => l.id === lessonId);
        if (lesson) {
          lesson.exercisesCompleted = false;
          delete lesson.exercisesCompletedAt;
          break;
        }
      }

      course.updatedAt = new Date().toISOString();
      await storageApi.put(coursePath, courseAdapter.serialize(course));
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting lesson exercises:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});

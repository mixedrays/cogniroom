import { defineEventHandler, getRouterParam } from "h3";
import { storageApi } from "@root/modules/storage";
import { getFormatAdapter } from "@root/modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";

export default defineEventHandler(async (event) => {
  try {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      return { success: false, error: "Missing courseId or lessonId" };
    }

    const courseAdapter = getFormatAdapter("course");

    const deleteResult = await storageApi.delete(
      storagePaths.flashcards(courseId, lessonId)
    );

    if (!deleteResult.ok && deleteResult.status !== 404) {
      return { success: false, error: "Failed to delete flashcards" };
    }

    // Reset flashcards completion flag in course file
    const coursePath = storagePaths.course(courseId);
    const courseResponse = await storageApi.get<string>(coursePath);

    if (courseResponse.ok) {
      const text = await courseResponse.text();
      const course = courseAdapter.deserialize(text);

      for (const topic of course.topics ?? []) {
        const lesson = topic.lessons?.find((l) => l.id === lessonId);
        if (lesson) {
          lesson.flashcardsCompleted = false;
          delete lesson.flashcardsCompletedAt;
          break;
        }
      }

      course.updatedAt = new Date().toISOString();
      await storageApi.put(coursePath, courseAdapter.serialize(course));
    }

    // Best-effort cleanup of orphaned review data
    await storageApi.delete(storagePaths.reviews(courseId, lessonId));

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting flashcards:", error);
    return { success: false, error: String(error) };
  }
});

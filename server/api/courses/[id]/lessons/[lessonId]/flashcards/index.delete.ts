import { defineEventHandler, getRouterParam } from "h3";
import { storageApi } from "@root/modules/storage";
import { storage } from "@root/modules/storage";

export default defineEventHandler(async (event) => {
  try {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      return { success: false, error: "Missing courseId or lessonId" };
    }

    const deleteResult = await storageApi.delete(
      `courses/${courseId}/lessons/${lessonId}/flashcards.json`
    );

    if (!deleteResult.ok && deleteResult.status !== 404) {
      return { success: false, error: "Failed to delete flashcards" };
    }

    // Reset flashcards completion flag in course.json
    const coursePath = `courses/${courseId}/course.json`;
    const courseResponse = await storage<any>(coursePath);

    if (courseResponse.ok) {
      const course = await courseResponse.json();

      for (const topic of course.topics ?? []) {
        const lesson = topic.lessons?.find((l: any) => l.id === lessonId);
        if (lesson) {
          lesson.flashcardsCompleted = false;
          delete lesson.flashcardsCompletedAt;
          break;
        }
      }

      course.updatedAt = new Date().toISOString();
      await storageApi.put(coursePath, course);
    }

    // Best-effort cleanup of orphaned review data
    await storageApi.delete(`courses/${courseId}/lessons/${lessonId}/reviews.json`);

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting flashcards:", error);
    return { success: false, error: String(error) };
  }
});

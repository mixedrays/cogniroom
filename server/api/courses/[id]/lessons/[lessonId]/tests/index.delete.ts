import { defineEventHandler, getRouterParam } from "h3";
import { storage, storageApi } from "@root/modules/storage";

export default defineEventHandler(async (event) => {
  try {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      return { success: false, error: "Missing courseId or lessonId" };
    }

    const jsonDelete = await storageApi.delete(`courses/${courseId}/lessons/${lessonId}/tests.json`);

    if (!jsonDelete.ok && jsonDelete.status !== 404) {
      return { success: false, error: "Failed to delete tests content" };
    }

    // Reset completion flags in course.json
    const coursePath = `courses/${courseId}/course.json`;
    const courseResponse = await storage<any>(coursePath);

    if (courseResponse.ok) {
      const course = await courseResponse.json();

      for (const topic of course.topics ?? []) {
        const lesson = topic.lessons?.find((l: any) => l.id === lessonId);
        if (lesson) {
          lesson.testsCompleted = false;
          delete lesson.testsCompletedAt;
          break;
        }
      }

      course.updatedAt = new Date().toISOString();
      await storageApi.put(coursePath, course);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting lesson tests:", error);
    return { success: false, error: String(error) };
  }
});

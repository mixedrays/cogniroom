import { defineEventHandler, getRouterParam } from "h3";
import { storage, storageApi } from "@root/modules/storage";

export default defineEventHandler(async (event) => {
  try {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      return { success: false, error: "Missing courseId or lessonId" };
    }

    // Delete exercises file
    const deleteResponse = await storageApi.delete(`courses/${courseId}/exercises/${lessonId}.md`);
    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      return { success: false, error: deleteResponse.statusText };
    }

    // Reset completion flags in course.json
    const coursePath = `courses/${courseId}/course.json`;
    const courseResponse = await storage<any>(coursePath);

    if (courseResponse.ok) {
      const course = await courseResponse.json();

      for (const topic of course.topics ?? []) {
        const lesson = topic.lessons?.find((l: any) => l.id === lessonId);
        if (lesson) {
          lesson.exercisesCompleted = false;
          delete lesson.exercisesCompletedAt;
          break;
        }
      }

      course.updatedAt = new Date().toISOString();
      await storageApi.put(coursePath, course);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting lesson exercises:", error);
    return { success: false, error: String(error) };
  }
});

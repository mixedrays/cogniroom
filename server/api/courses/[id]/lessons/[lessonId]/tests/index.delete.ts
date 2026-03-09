import { defineEventHandler, getRouterParam } from "h3";
import { storageApi } from "@root/modules/storage";
import { getFormatAdapter } from "@root/modules/content-formats";

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

    const courseAdapter = getFormatAdapter("course");
    const coursePath = `courses/${courseId}/course${courseAdapter.extension}`;
    const courseResponse = await storageApi.get<string>(coursePath);

    if (courseResponse.ok) {
      const text = await courseResponse.text();
      const course = courseAdapter.deserialize(text);

      for (const topic of course.topics ?? []) {
        const lesson = topic.lessons?.find((l) => l.id === lessonId);
        if (lesson) {
          (lesson as any).testsCompleted = false;
          delete (lesson as any).testsCompletedAt;
          break;
        }
      }

      course.updatedAt = new Date().toISOString();
      await storageApi.put(coursePath, courseAdapter.serialize(course));
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting lesson tests:", error);
    return { success: false, error: String(error) };
  }
});

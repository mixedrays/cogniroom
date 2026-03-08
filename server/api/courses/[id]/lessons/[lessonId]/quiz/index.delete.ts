import { defineEventHandler, getRouterParam } from "h3";
import { storageApi } from "@root/modules/storage";
import { mdToCourse, courseToMd } from "@root/modules/md-formats";

export default defineEventHandler(async (event) => {
  try {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      return { success: false, error: "Missing courseId or lessonId" };
    }

    const deleteResult = await storageApi.delete(
      `courses/${courseId}/lessons/${lessonId}/quiz.md`
    );

    if (!deleteResult.ok && deleteResult.status !== 404) {
      return { success: false, error: "Failed to delete quiz" };
    }

    // Reset quiz completion flag in course.md
    const coursePath = `courses/${courseId}/course.md`;
    const courseResponse = await storageApi.get<string>(coursePath);

    if (courseResponse.ok) {
      const text = await courseResponse.text();
      const course = mdToCourse(text);

      for (const topic of course.topics ?? []) {
        const lesson = topic.lessons?.find((l) => l.id === lessonId);
        if (lesson) {
          lesson.quizCompleted = false;
          delete lesson.quizCompletedAt;
          break;
        }
      }

      course.updatedAt = new Date().toISOString();
      await storageApi.put(coursePath, courseToMd(course));
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting quiz:", error);
    return { success: false, error: String(error) };
  }
});

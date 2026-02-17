import { defineEventHandler, getRouterParam, createError } from "h3";
import { storage, storageApi } from "@root/modules/storage";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing course ID",
      });
    }

    const response = await storage<any>(`courses/${id}/course.json`);

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: response.status === 404 ? "Course not found" : response.statusText,
      });
    }

    const course = await response.json();

    const topics = await Promise.all(
      (course.topics ?? []).map(async (topic: any) => {
        const lessons = await Promise.all(
          (topic.lessons ?? []).map(async (lesson: any) => {
            // Check lesson content
            const lessonStat = await storageApi.stat(`courses/${id}/lessons/${lesson.id}/lesson.md`);
            const hasContent = lessonStat !== null && !lessonStat.isDirectory && lessonStat.size > 0;

            // Check tests
            const testsJsonStat = await storageApi.stat(`courses/${id}/lessons/${lesson.id}/tests.json`);
            const hasTests = testsJsonStat !== null && !testsJsonStat.isDirectory && testsJsonStat.size > 0;

            // Check exercises
            const exercisesStat = await storageApi.stat(`courses/${id}/lessons/${lesson.id}/exercise.md`);
            const hasExercises = exercisesStat !== null && !exercisesStat.isDirectory && exercisesStat.size > 0;

            return { ...lesson, hasContent, hasTests, hasExercises };
          })
        );

        return { ...topic, lessons };
      })
    );

    return { ...course, topics };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error("Error getting course:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});

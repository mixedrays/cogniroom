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

            // Check flashcards (new format, with fallback to legacy tests.json)
            const flashcardsStat = await storageApi.stat(`courses/${id}/lessons/${lesson.id}/flashcards.json`);
            const hasFlashcards = flashcardsStat !== null && !flashcardsStat.isDirectory && flashcardsStat.size > 0;

            // Check quiz (new format, with fallback to legacy tests.json)
            const quizStat = await storageApi.stat(`courses/${id}/lessons/${lesson.id}/quiz.json`);
            const hasQuiz = quizStat !== null && !quizStat.isDirectory && quizStat.size > 0;

            // Check exercises
            const exercisesStat = await storageApi.stat(`courses/${id}/lessons/${lesson.id}/exercise.md`);
            const hasExercises = exercisesStat !== null && !exercisesStat.isDirectory && exercisesStat.size > 0;

            return { ...lesson, hasContent, hasFlashcards, hasQuiz, hasExercises };
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

import { defineEventHandler, getRouterParam, createError } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { Topic, Lesson } from "@modules/core";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing course ID",
      });
    }

    const courseAdapter = getFormatAdapter("course");

    const response = await storageApi.get<string>(storagePaths.course(id));

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage:
          response.status === 404 ? "Course not found" : response.statusText,
      });
    }

    const course = courseAdapter.deserialize(await response.text());

    const topics = await Promise.all(
      (course.topics ?? []).map(async (topic: Topic) => {
        const lessons = await Promise.all(
          (topic.lessons ?? []).map(async (lesson: Lesson) => {
            // Check lesson content
            const lessonStat = await storageApi.stat(
              storagePaths.lesson(id, lesson.id)
            );
            const hasContent =
              lessonStat !== null &&
              !lessonStat.isDirectory &&
              lessonStat.size > 0;

            // Check flashcards
            const flashcardsStat = await storageApi.stat(
              storagePaths.flashcards(id, lesson.id)
            );
            const hasFlashcards =
              flashcardsStat !== null &&
              !flashcardsStat.isDirectory &&
              flashcardsStat.size > 0;

            // Check quiz
            const quizStat = await storageApi.stat(
              storagePaths.quiz(id, lesson.id)
            );
            const hasQuiz =
              quizStat !== null && !quizStat.isDirectory && quizStat.size > 0;

            // Check exercises
            const exercisesStat = await storageApi.stat(
              storagePaths.exercise(id, lesson.id)
            );
            const hasExercises =
              exercisesStat !== null &&
              !exercisesStat.isDirectory &&
              exercisesStat.size > 0;

            return {
              ...lesson,
              hasContent,
              hasFlashcards,
              hasQuiz,
              hasExercises,
            };
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

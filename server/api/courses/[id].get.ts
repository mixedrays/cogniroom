import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { Topic, Lesson } from "@modules/core";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw new HTTPError({
        status: 400,
        message: "Missing course ID",
      });
    }

    const courseAdapter = getFormatAdapter("course");

    const response = await storageApi.get<string>(storagePaths.course(id));

    if (!response.ok) {
      throw new HTTPError({
        status: response.status,
        message:
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
  } catch (error: unknown) {
    if (error instanceof HTTPError) {
      throw error;
    }
    console.error("Error getting course:", error);
    throw new HTTPError({
      status: 500,
      message: "Internal server error",
    });
  }
});

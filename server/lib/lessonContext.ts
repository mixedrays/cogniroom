import { HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import type { Course, Lesson, Topic } from "@modules/core";
import { storagePaths } from "./storagePaths";

export interface LessonContext {
  course: Course;
  topic: Topic;
  lesson: Lesson;
}

/**
 * Load a course, locate the target lesson and its topic, and return all three.
 * Throws an HTTPError (404/storage status) when the course or lesson is absent,
 * so route handlers wrapped in `withErrorGuard` surface the right status.
 */
export async function loadLessonContext(
  courseId: string,
  lessonId: string
): Promise<LessonContext> {
  const courseAdapter = getFormatAdapter("course");
  const courseResponse = await storageApi.get<string>(
    storagePaths.course(courseId)
  );
  if (!courseResponse.ok) {
    throw new HTTPError({
      status: courseResponse.status,
      message:
        courseResponse.status === 404
          ? "Course not found"
          : courseResponse.statusText,
    });
  }

  const course = courseAdapter.deserialize(await courseResponse.text());

  for (const topic of course.topics) {
    const lesson = topic.lessons?.find((l) => l.id === lessonId);
    if (lesson) {
      return { course, topic, lesson };
    }
  }

  throw new HTTPError({ status: 404, message: "Lesson not found in course" });
}

/**
 * Load a lesson's saved theory and format it as the prompt context block.
 * Returns an empty string when content is excluded, missing, or blank.
 */
export async function loadLessonTheoryBlock(
  courseId: string,
  lessonId: string,
  includeContent = true
): Promise<string> {
  if (!includeContent) return "";

  const lessonResponse = await storageApi.get<string>(
    storagePaths.lesson(courseId, lessonId)
  );
  if (!lessonResponse.ok) return "";

  const text = await lessonResponse.text();
  if (!text?.trim()) return "";

  return `\n\nLesson Theory Content:\n---\n${text.trim()}\n---`;
}

/**
 * Build the shared `{{variable}}` set consumed by the lesson/flashcards/quiz/
 * exercises generation prompt templates.
 */
export function buildLessonPromptVars(
  ctx: LessonContext,
  additionalInstructions: string,
  lessonContent = ""
): Record<string, string> {
  return {
    courseTitle: ctx.course.title,
    topicTitle: ctx.topic.title,
    topicDescription: ctx.topic.description ?? "",
    lessonTitle: ctx.lesson.title,
    lessonDescription: ctx.lesson.description ?? "",
    lessonContent,
    additionalInstructions,
  };
}

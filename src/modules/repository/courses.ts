/**
 * Isomorphic course/lesson domain operations.
 *
 * Every function takes an explicit `StorageApi`, so the same implementation
 * runs against the filesystem adapter (server routes) and the IndexedDB adapter
 * (browser local repository). No `node:*` imports — `StorageApi`,
 * `@modules/content-formats`, and `@modules/core` only.
 */

import type { StorageApi } from "@modules/storage/client";
import { storagePaths } from "@modules/storage/paths";
import { getFormatAdapter } from "@modules/content-formats";
import {
  getCourseMetadata,
  generateUniqueCourseId,
  toSlug,
  findLessonInCourse,
  isLessonSectionCompleted,
  setLessonSectionCompletion,
} from "@modules/core";
import type {
  Course,
  CourseMetadata,
  CourseCreateInput,
  FlashcardsContent,
  QuizContent,
  Lesson,
  LessonSection,
  ReviewData,
  Topic,
} from "@modules/core";
import {
  readCourse,
  writeCourse,
  resetLessonSectionCompletion,
} from "./courseFile";

export interface MutationResult {
  success: boolean;
  error?: string;
}

async function statHasContent(api: StorageApi, path: string): Promise<boolean> {
  const stat = await api.stat(path);
  return stat !== null && !stat.isDirectory && stat.size > 0;
}

/** List course metadata, newest first. */
export async function listCourses(
  api: StorageApi
): Promise<CourseMetadata[]> {
  const folders = await api.list("courses", {
    directories: true,
    files: false,
  });

  const courses = await Promise.all(
    folders.map(async (folder) => {
      try {
        const course = await readCourse(api, folder.name);
        return course ? getCourseMetadata(course) : null;
      } catch (error) {
        console.error(`Error reading course ${folder.name}:`, error);
        return null;
      }
    })
  );

  const valid = courses.filter((c): c is CourseMetadata => c !== null);
  valid.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return valid;
}

/**
 * Load a course with per-lesson content-availability flags, or null if the
 * course does not exist.
 */
export async function getCourse(
  api: StorageApi,
  courseId: string
): Promise<Course | null> {
  const course = await readCourse(api, courseId);
  if (!course) return null;

  const topics = await Promise.all(
    (course.topics ?? []).map(async (topic: Topic) => {
      const lessons = await Promise.all(
        (topic.lessons ?? []).map(async (lesson: Lesson) => {
          const [hasContent, hasFlashcards, hasQuiz, hasExercises] =
            await Promise.all([
              statHasContent(api, storagePaths.lesson(courseId, lesson.id)),
              statHasContent(api, storagePaths.flashcards(courseId, lesson.id)),
              statHasContent(api, storagePaths.quiz(courseId, lesson.id)),
              statHasContent(api, storagePaths.exercise(courseId, lesson.id)),
            ]);
          return { ...lesson, hasContent, hasFlashcards, hasQuiz, hasExercises };
        })
      );
      return { ...topic, lessons };
    })
  );

  return { ...course, topics };
}

/**
 * Create a course from validated input: assigns a unique id and normalizes
 * topic/lesson ids, then persists `course.md`.
 */
export async function createCourse(
  api: StorageApi,
  input: CourseCreateInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const existing = await api.list("courses", {
    directories: true,
    files: false,
  });
  const existingIds = existing.map((f) => f.name);
  const id = generateUniqueCourseId(input.title ?? "", existingIds);

  const updatedTopics = (input.topics ?? []).map((topic) => {
    const topicTitle = typeof topic.title === "string" ? topic.title : "";
    const topicId =
      typeof topic.id === "string" && topic.id
        ? topic.id
        : toSlug(topicTitle) || "topic";
    return {
      ...topic,
      id: topicId,
      lessons: (topic.lessons ?? []).map((lesson) => ({
        ...lesson,
        id:
          typeof lesson.id === "string" && lesson.id
            ? lesson.id
            : toSlug(lesson.title) || "lesson",
      })),
    };
  });

  const now = new Date().toISOString();
  const course: Course = {
    ...input,
    id,
    title: input.title ?? "Untitled Course",
    topics: updatedTopics,
    source: input.source ?? "llm",
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };

  const response = await api.post(
    storagePaths.course(id),
    getFormatAdapter("course").serialize(course)
  );
  if (!response.ok) {
    return { success: false, error: response.error ?? response.statusText };
  }
  return { success: true, id };
}

export async function deleteCourse(
  api: StorageApi,
  courseId: string
): Promise<MutationResult> {
  const response = await api.delete(storagePaths.courseDir(courseId), true);
  if (!response.ok && response.status !== 404) {
    return { success: false, error: response.error ?? response.statusText };
  }
  return { success: true };
}

// --- Lesson theory ---

export async function getLessonContent(
  api: StorageApi,
  courseId: string,
  lessonId: string
): Promise<{ content: string } | null> {
  const response = await api.get<string>(
    storagePaths.lesson(courseId, lessonId)
  );
  if (!response.ok) return null;
  return { content: await response.text() };
}

export async function saveLessonContent(
  api: StorageApi,
  courseId: string,
  lessonId: string,
  content: string
): Promise<MutationResult> {
  await api.put(storagePaths.lesson(courseId, lessonId), content);
  return { success: true };
}

export async function deleteLessonContent(
  api: StorageApi,
  courseId: string,
  lessonId: string
): Promise<MutationResult> {
  const del = await api.delete(storagePaths.lesson(courseId, lessonId));
  if (!del.ok && del.status !== 404) {
    return { success: false, error: del.statusText };
  }
  await resetLessonSectionCompletion(api, courseId, lessonId, "theory");
  return { success: true };
}

// --- Flashcards ---

export async function getLessonFlashcards(
  api: StorageApi,
  courseId: string,
  lessonId: string
): Promise<{ content: FlashcardsContent } | null> {
  const response = await api.get<string>(
    storagePaths.flashcards(courseId, lessonId)
  );
  if (!response.ok) return null;
  return {
    content: getFormatAdapter("flashcards").deserialize(await response.text()),
  };
}

export async function saveLessonFlashcards(
  api: StorageApi,
  courseId: string,
  lessonId: string,
  content: FlashcardsContent
): Promise<MutationResult> {
  await api.put(
    storagePaths.flashcards(courseId, lessonId),
    getFormatAdapter("flashcards").serialize(content)
  );
  return { success: true };
}

export async function deleteLessonFlashcards(
  api: StorageApi,
  courseId: string,
  lessonId: string
): Promise<MutationResult> {
  const del = await api.delete(storagePaths.flashcards(courseId, lessonId));
  if (!del.ok && del.status !== 404) {
    return { success: false, error: "Failed to delete flashcards" };
  }
  await resetLessonSectionCompletion(api, courseId, lessonId, "flashcards");
  // Best-effort cleanup of orphaned review data.
  await api.delete(storagePaths.reviews(courseId, lessonId));
  return { success: true };
}

// --- Quiz ---

export async function getLessonQuiz(
  api: StorageApi,
  courseId: string,
  lessonId: string
): Promise<{ content: QuizContent } | null> {
  const response = await api.get<string>(
    storagePaths.quiz(courseId, lessonId)
  );
  if (!response.ok) return null;
  return {
    content: getFormatAdapter("quiz").deserialize(await response.text()),
  };
}

export async function saveLessonQuiz(
  api: StorageApi,
  courseId: string,
  lessonId: string,
  content: QuizContent
): Promise<MutationResult> {
  await api.put(
    storagePaths.quiz(courseId, lessonId),
    getFormatAdapter("quiz").serialize(content)
  );
  return { success: true };
}

export async function deleteLessonQuiz(
  api: StorageApi,
  courseId: string,
  lessonId: string
): Promise<MutationResult> {
  const del = await api.delete(storagePaths.quiz(courseId, lessonId));
  if (!del.ok && del.status !== 404) {
    return { success: false, error: "Failed to delete quiz" };
  }
  await resetLessonSectionCompletion(api, courseId, lessonId, "quiz");
  return { success: true };
}

// --- Exercises ---

export async function getLessonExercises(
  api: StorageApi,
  courseId: string,
  lessonId: string
): Promise<{ content: string } | null> {
  const response = await api.get<string>(
    storagePaths.exercise(courseId, lessonId)
  );
  if (!response.ok) return null;
  return { content: await response.text() };
}

export async function saveLessonExercises(
  api: StorageApi,
  courseId: string,
  lessonId: string,
  content: string
): Promise<MutationResult> {
  await api.put(storagePaths.exercise(courseId, lessonId), content);
  return { success: true };
}

export async function deleteLessonExercises(
  api: StorageApi,
  courseId: string,
  lessonId: string
): Promise<MutationResult> {
  const del = await api.delete(storagePaths.exercise(courseId, lessonId));
  if (!del.ok && del.status !== 404) {
    return { success: false, error: del.statusText };
  }
  await resetLessonSectionCompletion(api, courseId, lessonId, "exercises");
  return { success: true };
}

// --- Reviews ---

export async function getFlashcardsReviews(
  api: StorageApi,
  courseId: string,
  lessonId: string
): Promise<ReviewData | null> {
  const response = await api.get<ReviewData>(
    storagePaths.reviews(courseId, lessonId)
  );
  if (!response.ok) return null;
  return await response.json();
}

export async function saveFlashcardsReviews(
  api: StorageApi,
  courseId: string,
  lessonId: string,
  data: ReviewData
): Promise<MutationResult> {
  await api.put(storagePaths.reviews(courseId, lessonId), data);
  return { success: true };
}

// --- Completion ---

export interface LessonCompletionResult {
  success: boolean;
  section: LessonSection;
  completed: boolean;
  completedAt: string | null;
}

/**
 * Toggle (or set) a lesson section's completion flag in `course.md`. Returns
 * null when the course or lesson does not exist so callers can map to 404.
 */
export async function updateLessonCompletion(
  api: StorageApi,
  courseId: string,
  lessonId: string,
  completed: boolean | undefined,
  section: LessonSection = "theory"
): Promise<LessonCompletionResult | null> {
  const course = await readCourse(api, courseId);
  if (!course) return null;

  const found = findLessonInCourse(course, lessonId);
  if (!found) return null;

  const now = new Date().toISOString();
  const currentValue = isLessonSectionCompleted(found.lesson, section);
  const nextCompleted = typeof completed === "boolean" ? completed : !currentValue;

  setLessonSectionCompletion(
    found.lesson,
    section,
    nextCompleted,
    nextCompleted ? now : undefined
  );
  course.updatedAt = now;
  await writeCourse(api, course);

  return {
    success: true,
    section,
    completed: nextCompleted,
    completedAt: nextCompleted ? now : null,
  };
}

import type {
  Course,
  CourseMetadata,
  FlashcardsContent,
  QuizContent,
  ReviewData,
  LessonSection,
} from "./types";
import { withReadMirror, writeCache, deleteCache } from "./clientStorage";
import { enqueueFlashcardsReview } from "./syncQueue";
import { postJson, getJson } from "./apiClient";
import { getStorageMode } from "./runtimeConfig";
import { getLocalDataApi, isLocalDataAvailable } from "./localRepo";
import { courseRepo } from "@modules/repository";
import { findLessonInCourse } from "@modules/core";
import type { LessonGenerationContext } from "@modules/core";
import {
  FlashcardsContentOutputSchema,
  QuizContentOutputSchema,
} from "@/modules/wizard-agent/lib/contentOutputSchemas";

const COURSE_LIST_KEY = "cache/courses/index";
const courseKey = (id: string) => `cache/courses/${id}`;
const lessonKey = (cid: string, lid: string) =>
  `cache/courses/${cid}/lessons/${lid}`;
const flashcardsKey = (cid: string, lid: string) =>
  `cache/courses/${cid}/lessons/${lid}/flashcards`;
const quizKey = (cid: string, lid: string) =>
  `cache/courses/${cid}/lessons/${lid}/quiz`;
const exercisesKey = (cid: string, lid: string) =>
  `cache/courses/${cid}/lessons/${lid}/exercises`;
const reviewsKey = (cid: string, lid: string) =>
  `cache/courses/${cid}/lessons/${lid}/reviews`;

export type CourseSkillLevel = "beginner" | "intermediate" | "advanced";

/** True when the browser's IndexedDB is the authoritative store. */
async function isBrowserMode(): Promise<boolean> {
  return (await getStorageMode()) === "browser";
}

/**
 * Assemble the lesson context the stateless generation endpoints need, from
 * data the client already holds (mode-dispatched reads). Returns null when the
 * course or lesson is missing. When `includeLessonTheory` is set, the saved
 * lesson theory is attached for the "include lesson content" generation option.
 */
async function buildLessonContext(
  courseId: string,
  lessonId: string,
  includeLessonTheory: boolean
): Promise<LessonGenerationContext | null> {
  const course = await getCourse(courseId);
  if (!course) return null;
  const found = findLessonInCourse(course, lessonId);
  if (!found) return null;

  const context: LessonGenerationContext = {
    courseTitle: course.title,
    topicTitle: found.topic.title,
    topicDescription: found.topic.description ?? "",
    lessonTitle: found.lesson.title,
    lessonDescription: found.lesson.description ?? "",
  };

  if (includeLessonTheory) {
    const lesson = await getLesson(courseId, lessonId);
    if (lesson?.content?.trim()) {
      context.lessonContent = lesson.content;
    }
  }

  return context;
}

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return "http://localhost:3000";
}

// Client-side API helpers for course operations

// List all courses
export async function listCourses(): Promise<CourseMetadata[]> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return [];
    return courseRepo.listCourses(getLocalDataApi());
  }
  const cached = await withReadMirror<CourseMetadata[]>(
    COURSE_LIST_KEY,
    async () => {
      try {
        const response = await fetch(`${getBaseUrl()}/api/courses`);
        if (!response.ok) {
          console.error("Failed to list courses:", response.statusText);
          return null;
        }
        return (await response.json()) as CourseMetadata[];
      } catch (e) {
        console.error("Error listing courses:", e);
        return null;
      }
    }
  );
  return cached ?? [];
}

// Save a course
export async function saveCourse(
  course: Course
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (await isBrowserMode()) {
    return courseRepo.createCourse(getLocalDataApi(), course);
  }
  return postJson<{ success: boolean; id?: string; error?: string }>(
    `${getBaseUrl()}/api/courses`,
    course,
    "Save failed"
  );
}

export async function generateCourse(params: {
  topic: string;
  level: CourseSkillLevel;
  model: string;
  instructions?: string;
}): Promise<{
  success: boolean;
  course?: Course;
  roadmap?: Course;
  error?: string;
}> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/courses/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const json = await response.json();
    if (!response.ok) {
      return { success: false, error: json?.error || response.statusText };
    }
    // Support both old and new response format
    return {
      ...json,
      course: json.course || json.roadmap,
    };
  } catch (e) {
    console.error("Error generating course:", e);
    return { success: false, error: String(e) };
  }
}

// Get a single course
export async function getCourse(id: string): Promise<Course | null> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return null;
    return courseRepo.getCourse(getLocalDataApi(), id);
  }
  return withReadMirror<Course>(courseKey(id), async () => {
    try {
      const url = `${getBaseUrl()}/api/courses/${id}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error(
          `Failed to fetch course ${id}: ${response.status} ${response.statusText}`
        );
        const text = await response.text();
        console.error(`Response body: ${text}`);
        return null;
      }
      return (await response.json()) as Course;
    } catch (e) {
      console.error(`Error getting course ${id}:`, e);
      return null;
    }
  });
}

// Delete a course
export async function deleteCourse(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (await isBrowserMode()) {
    return courseRepo.deleteCourse(getLocalDataApi(), id);
  }
  try {
    const response = await fetch(`${getBaseUrl()}/api/courses/${id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (response.ok) {
      void deleteCache(courseKey(id));
      void deleteCache(`cache/courses/${id}`, true);
      void deleteCache(COURSE_LIST_KEY);
    }
    return result;
  } catch (e) {
    console.error(`Error deleting course ${id}:`, e);
    return { success: false, error: String(e) };
  }
}

// Delete lesson content (theory)
export async function deleteLessonContent(
  courseId: string,
  lessonId: string
): Promise<{ success: boolean; error?: string }> {
  if (await isBrowserMode()) {
    return courseRepo.deleteLessonContent(getLocalDataApi(), courseId, lessonId);
  }
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}`,
      { method: "DELETE" }
    );
    return await response.json();
  } catch (e) {
    console.error(`Error deleting lesson content ${lessonId}:`, e);
    return { success: false, error: String(e) };
  }
}

export interface GenerateLessonContentOptions {
  additionalInstructions?: string;
  model?: string;
  includeContent?: boolean;
  /** Free-form, server-appended generation options text (e.g. "Generation Options:\n- Count: 12"). */
  generationOptions?: string;
}

export async function generateLessonFlashcards(
  courseId: string,
  lessonId: string,
  options: GenerateLessonContentOptions = {}
): Promise<{ success: boolean; content?: FlashcardsContent; error?: string }> {
  const context = await buildLessonContext(
    courseId,
    lessonId,
    options.includeContent !== false
  );
  if (!context) {
    return { success: false, error: "Lesson not found in course" };
  }
  const res = await postJson<{
    success: boolean;
    content?: FlashcardsContent;
    error?: string;
  }>(
    `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/flashcards/generate`,
    { ...options, context },
    "Generate failed"
  );
  if (!res.success || !res.content) return res;

  const save = await saveLessonFlashcards(courseId, lessonId, res.content);
  if (!save.success) return { success: false, error: save.error };
  return { success: true, content: res.content };
}

export async function deleteLessonFlashcards(
  courseId: string,
  lessonId: string
): Promise<{ success: boolean; error?: string }> {
  if (await isBrowserMode()) {
    return courseRepo.deleteLessonFlashcards(
      getLocalDataApi(),
      courseId,
      lessonId
    );
  }
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/flashcards`,
      { method: "DELETE" }
    );
    return await response.json();
  } catch (e) {
    console.error("Error deleting flashcards:", e);
    return { success: false, error: String(e) };
  }
}

export async function generateLessonQuiz(
  courseId: string,
  lessonId: string,
  options: GenerateLessonContentOptions = {}
): Promise<{ success: boolean; content?: QuizContent; error?: string }> {
  const context = await buildLessonContext(
    courseId,
    lessonId,
    options.includeContent !== false
  );
  if (!context) {
    return { success: false, error: "Lesson not found in course" };
  }
  const res = await postJson<{
    success: boolean;
    content?: QuizContent;
    error?: string;
  }>(
    `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/quiz/generate`,
    { ...options, context },
    "Generate failed"
  );
  if (!res.success || !res.content) return res;

  const save = await saveLessonQuiz(courseId, lessonId, res.content);
  if (!save.success) return { success: false, error: save.error };
  return { success: true, content: res.content };
}

export async function deleteLessonQuiz(
  courseId: string,
  lessonId: string
): Promise<{ success: boolean; error?: string }> {
  if (await isBrowserMode()) {
    return courseRepo.deleteLessonQuiz(getLocalDataApi(), courseId, lessonId);
  }
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/quiz`,
      { method: "DELETE" }
    );
    return await response.json();
  } catch (e) {
    console.error("Error deleting quiz:", e);
    return { success: false, error: String(e) };
  }
}

// Delete lesson exercises
export async function deleteLessonExercises(
  courseId: string,
  lessonId: string
): Promise<{ success: boolean; error?: string }> {
  if (await isBrowserMode()) {
    return courseRepo.deleteLessonExercises(
      getLocalDataApi(),
      courseId,
      lessonId
    );
  }
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/exercises`,
      { method: "DELETE" }
    );
    return await response.json();
  } catch (e) {
    console.error(`Error deleting lesson exercises ${lessonId}:`, e);
    return { success: false, error: String(e) };
  }
}

// Get lesson content
export async function getLesson(
  courseId: string,
  lessonId: string
): Promise<{ content: string } | null> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return null;
    return courseRepo.getLessonContent(getLocalDataApi(), courseId, lessonId);
  }
  return withReadMirror<{ content: string }>(
    lessonKey(courseId, lessonId),
    () =>
      getJson<{ content: string }>(
        `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}`,
        `Error getting lesson ${lessonId}:`
      )
  );
}

export async function getLessonFlashcards(
  courseId: string,
  lessonId: string
): Promise<{ content: FlashcardsContent } | null> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return null;
    return courseRepo.getLessonFlashcards(getLocalDataApi(), courseId, lessonId);
  }
  return withReadMirror<{ content: FlashcardsContent }>(
    flashcardsKey(courseId, lessonId),
    () =>
      getJson<{ content: FlashcardsContent }>(
        `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/flashcards`,
        `Error getting flashcards ${lessonId}:`
      )
  );
}

export async function getLessonQuiz(
  courseId: string,
  lessonId: string
): Promise<{ content: QuizContent } | null> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return null;
    return courseRepo.getLessonQuiz(getLocalDataApi(), courseId, lessonId);
  }
  return withReadMirror<{ content: QuizContent }>(
    quizKey(courseId, lessonId),
    () =>
      getJson<{ content: QuizContent }>(
        `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/quiz`,
        `Error getting quiz ${lessonId}:`
      )
  );
}

export async function getFlashcardsReviews(
  courseId: string,
  lessonId: string
): Promise<ReviewData | null> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return null;
    return courseRepo.getFlashcardsReviews(
      getLocalDataApi(),
      courseId,
      lessonId
    );
  }
  return withReadMirror<ReviewData>(reviewsKey(courseId, lessonId), () =>
    getJson<ReviewData>(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/reviews`,
      `Error getting reviews ${lessonId}:`
    )
  );
}

export async function saveFlashcardsReviews(
  courseId: string,
  lessonId: string,
  data: ReviewData
): Promise<{ success: boolean; error?: string; queued?: boolean }> {
  if (await isBrowserMode()) {
    return courseRepo.saveFlashcardsReviews(
      getLocalDataApi(),
      courseId,
      lessonId,
      data
    );
  }
  void writeCache(reviewsKey(courseId, lessonId), data);
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/reviews`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      await enqueueFlashcardsReview(courseId, lessonId, data);
      return { success: true, queued: true };
    }
    return await response.json();
  } catch {
    await enqueueFlashcardsReview(courseId, lessonId, data);
    return { success: true, queued: true };
  }
}

export async function getLessonExercises(
  courseId: string,
  lessonId: string
): Promise<{ content: string } | null> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return null;
    return courseRepo.getLessonExercises(getLocalDataApi(), courseId, lessonId);
  }
  return withReadMirror<{ content: string }>(
    exercisesKey(courseId, lessonId),
    () =>
      getJson<{ content: string }>(
        `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/exercises`,
        `Error getting lesson exercises ${lessonId}:`
      )
  );
}

// Generate lesson content (stateless endpoint; client builds context + persists)
export async function generateLesson(
  courseId: string,
  lessonId: string,
  options: GenerateLessonContentOptions = {}
): Promise<{ success: boolean; content?: string; error?: string }> {
  const context = await buildLessonContext(courseId, lessonId, false);
  if (!context) {
    return { success: false, error: "Lesson not found in course" };
  }
  const res = await postJson<{
    success: boolean;
    content?: string;
    error?: string;
  }>(
    `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/generate`,
    { ...options, context },
    "Generate failed"
  );
  if (!res.success || res.content === undefined) return res;

  const save = await saveLessonContent(courseId, lessonId, res.content);
  if (!save.success) return { success: false, error: save.error };
  return { success: true, content: res.content };
}

export async function generateLessonExercises(
  courseId: string,
  lessonId: string,
  options: GenerateLessonContentOptions = {}
): Promise<{ success: boolean; content?: string; error?: string }> {
  const context = await buildLessonContext(
    courseId,
    lessonId,
    options.includeContent !== false
  );
  if (!context) {
    return { success: false, error: "Lesson not found in course" };
  }
  const res = await postJson<{
    success: boolean;
    content?: string;
    error?: string;
  }>(
    `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/exercises/generate`,
    { ...options, context },
    "Generate failed"
  );
  if (!res.success || res.content === undefined) return res;

  const save = await saveLessonExercises(courseId, lessonId, res.content);
  if (!save.success) return { success: false, error: save.error };
  return { success: true, content: res.content };
}

export async function saveLessonContent(
  courseId: string,
  lessonId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  if (await isBrowserMode()) {
    return courseRepo.saveLessonContent(
      getLocalDataApi(),
      courseId,
      lessonId,
      content
    );
  }
  return postJson(
    `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/save`,
    { content },
    "Save failed"
  );
}

export async function saveLessonQuiz(
  courseId: string,
  lessonId: string,
  content: unknown
): Promise<{ success: boolean; error?: string }> {
  if (await isBrowserMode()) {
    const parsed = QuizContentOutputSchema.safeParse(content);
    if (!parsed.success) {
      return {
        success: false,
        error: `Invalid quiz content: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
      };
    }
    return courseRepo.saveLessonQuiz(getLocalDataApi(), courseId, lessonId, {
      version: 2,
      ...parsed.data,
    });
  }
  return postJson(
    `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/quiz/save`,
    { content },
    "Save failed"
  );
}

export async function saveLessonFlashcards(
  courseId: string,
  lessonId: string,
  content: unknown
): Promise<{ success: boolean; error?: string }> {
  if (await isBrowserMode()) {
    const parsed = FlashcardsContentOutputSchema.safeParse(content);
    if (!parsed.success) {
      return {
        success: false,
        error: `Invalid flashcards content: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
      };
    }
    return courseRepo.saveLessonFlashcards(
      getLocalDataApi(),
      courseId,
      lessonId,
      { version: 2, ...parsed.data }
    );
  }
  return postJson(
    `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/flashcards/save`,
    { content },
    "Save failed"
  );
}

export async function saveLessonExercises(
  courseId: string,
  lessonId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  if (await isBrowserMode()) {
    return courseRepo.saveLessonExercises(
      getLocalDataApi(),
      courseId,
      lessonId,
      content
    );
  }
  return postJson(
    `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/exercises/save`,
    { content },
    "Save failed"
  );
}

export async function updateLessonCompletion(
  courseId: string,
  lessonId: string,
  completed: boolean,
  section: LessonSection = "theory"
): Promise<{ success: boolean; completed?: boolean; error?: string }> {
  if (await isBrowserMode()) {
    const result = await courseRepo.updateLessonCompletion(
      getLocalDataApi(),
      courseId,
      lessonId,
      completed,
      section
    );
    if (!result) {
      return { success: false, error: "Lesson not found in course" };
    }
    return { success: true, completed: result.completed };
  }
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed, section }),
      }
    );

    return await response.json();
  } catch (e) {
    console.error("Error updating lesson completion:", e);
    return { success: false, error: String(e) };
  }
}

// Instruction enhancement types
export type InstructionContentType = "lesson" | "exercise" | "test" | "course";
export type InstructionSkillLevel = "beginner" | "intermediate" | "advanced";

export interface EnhanceInstructionParams {
  /** The original user instruction to enhance */
  userInstruction: string;
  /** The type of content being generated */
  contentType: InstructionContentType;
  /** Optional course title for context */
  courseTitle?: string;
  /** Optional topic title for context */
  topicTitle?: string;
  /** Optional lesson title for context */
  lessonTitle?: string;
  /** Target skill level */
  skillLevel?: InstructionSkillLevel;
  /** Model to use for enhancement */
  model?: string;
}

export interface EnhanceInstructionResponse {
  success: boolean;
  enhancedInstruction?: string;
  error?: string;
}

/**
 * Enhance a user instruction using AI to create a more detailed,
 * actionable prompt for content generation.
 */
export async function enhanceInstruction(
  params: EnhanceInstructionParams
): Promise<EnhanceInstructionResponse> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/instructions/enhance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const json = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: json?.error || json?.statusMessage || response.statusText,
      };
    }
    return json;
  } catch (e) {
    console.error("Error enhancing instruction:", e);
    return { success: false, error: String(e) };
  }
}

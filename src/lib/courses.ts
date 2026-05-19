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

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return "http://localhost:3000";
}

// Client-side API helpers for course operations

// List all courses
export async function listCourses(): Promise<CourseMetadata[]> {
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
  try {
    const response = await fetch(`${getBaseUrl()}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(course),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (body && typeof body === "object" && "message" in body
          ? String((body as { message?: unknown }).message)
          : null) ?? `Save failed (${response.status})`;
      return { success: false, error: message };
    }
    return body ?? { success: true };
  } catch (e) {
    console.error("Error saving course:", e);
    return { success: false, error: String(e) };
  }
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
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/flashcards/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      }
    );
    return await response.json();
  } catch (e) {
    console.error("Error generating flashcards:", e);
    return { success: false, error: String(e) };
  }
}

export async function deleteLessonFlashcards(
  courseId: string,
  lessonId: string
): Promise<{ success: boolean; error?: string }> {
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
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/quiz/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      }
    );
    return await response.json();
  } catch (e) {
    console.error("Error generating quiz:", e);
    return { success: false, error: String(e) };
  }
}

export async function deleteLessonQuiz(
  courseId: string,
  lessonId: string
): Promise<{ success: boolean; error?: string }> {
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
  return withReadMirror<{ content: string }>(
    lessonKey(courseId, lessonId),
    async () => {
      try {
        const response = await fetch(
          `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}`
        );
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(response.statusText);
        }
        return (await response.json()) as { content: string };
      } catch (e) {
        console.error(`Error getting lesson ${lessonId}:`, e);
        return null;
      }
    }
  );
}

export async function getLessonFlashcards(
  courseId: string,
  lessonId: string
): Promise<{ content: FlashcardsContent } | null> {
  return withReadMirror<{ content: FlashcardsContent }>(
    flashcardsKey(courseId, lessonId),
    async () => {
      try {
        const response = await fetch(
          `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/flashcards`
        );
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(response.statusText);
        }
        return (await response.json()) as { content: FlashcardsContent };
      } catch (e) {
        console.error(`Error getting flashcards ${lessonId}:`, e);
        return null;
      }
    }
  );
}

export async function getLessonQuiz(
  courseId: string,
  lessonId: string
): Promise<{ content: QuizContent } | null> {
  return withReadMirror<{ content: QuizContent }>(
    quizKey(courseId, lessonId),
    async () => {
      try {
        const response = await fetch(
          `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/quiz`
        );
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(response.statusText);
        }
        return (await response.json()) as { content: QuizContent };
      } catch (e) {
        console.error(`Error getting quiz ${lessonId}:`, e);
        return null;
      }
    }
  );
}

export async function getFlashcardsReviews(
  courseId: string,
  lessonId: string
): Promise<ReviewData | null> {
  return withReadMirror<ReviewData>(
    reviewsKey(courseId, lessonId),
    async () => {
      try {
        const response = await fetch(
          `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/reviews`
        );
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(response.statusText);
        }
        return (await response.json()) as ReviewData;
      } catch (e) {
        console.error(`Error getting reviews ${lessonId}:`, e);
        return null;
      }
    }
  );
}

export async function saveFlashcardsReviews(
  courseId: string,
  lessonId: string,
  data: ReviewData
): Promise<{ success: boolean; error?: string; queued?: boolean }> {
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
  return withReadMirror<{ content: string }>(
    exercisesKey(courseId, lessonId),
    async () => {
      try {
        const response = await fetch(
          `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/exercises`
        );
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(response.statusText);
        }
        return (await response.json()) as { content: string };
      } catch (e) {
        console.error(`Error getting lesson exercises ${lessonId}:`, e);
        return null;
      }
    }
  );
}

// Generate lesson content
export async function generateLesson(
  courseId: string,
  lessonId: string,
  options: GenerateLessonContentOptions = {}
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      }
    );

    return await response.json();
  } catch (e) {
    console.error("Error generating lesson:", e);
    return { success: false, error: String(e) };
  }
}

export async function generateLessonExercises(
  courseId: string,
  lessonId: string,
  options: GenerateLessonContentOptions = {}
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/exercises/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      }
    );

    return await response.json();
  } catch (e) {
    console.error("Error generating lesson exercises:", e);
    return { success: false, error: String(e) };
  }
}

export async function saveLessonContent(
  courseId: string,
  lessonId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }
    );
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (body && typeof body === "object" && "message" in body
          ? String((body as { message?: unknown }).message)
          : null) ?? `Save failed (${response.status})`;
      return { success: false, error: message };
    }
    return body ?? { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function saveLessonQuiz(
  courseId: string,
  lessonId: string,
  content: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/quiz/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }
    );
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (body && typeof body === "object" && "message" in body
          ? String((body as { message?: unknown }).message)
          : null) ?? `Save failed (${response.status})`;
      return { success: false, error: message };
    }
    return body ?? { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function saveLessonFlashcards(
  courseId: string,
  lessonId: string,
  content: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/flashcards/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }
    );
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (body && typeof body === "object" && "message" in body
          ? String((body as { message?: unknown }).message)
          : null) ?? `Save failed (${response.status})`;
      return { success: false, error: message };
    }
    return body ?? { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function saveLessonExercises(
  courseId: string,
  lessonId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/exercises/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }
    );
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (body && typeof body === "object" && "message" in body
          ? String((body as { message?: unknown }).message)
          : null) ?? `Save failed (${response.status})`;
      return { success: false, error: message };
    }
    return body ?? { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateLessonCompletion(
  courseId: string,
  lessonId: string,
  completed: boolean,
  section: LessonSection = "theory"
): Promise<{ success: boolean; completed?: boolean; error?: string }> {
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

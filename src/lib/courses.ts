import type { Course, CourseMetadata, FlashcardsContent, QuizContent, ReviewData, LessonSection } from "./types";

export type CourseSkillLevel = "beginner" | "intermediate" | "advanced";

/** @deprecated Use CourseSkillLevel instead */
export type RoadmapSkillLevel = CourseSkillLevel;

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return "http://localhost:3000";
}

// Client-side API helpers for course operations

// List all courses
export async function listCourses(): Promise<CourseMetadata[]> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/courses`);
    if (!response.ok) {
      console.error("Failed to list courses:", response.statusText);
      return [];
    }
    return await response.json();
  } catch (e) {
    console.error("Error listing courses:", e);
    return [];
  }
}

/** @deprecated Use listCourses instead */
export const listRoadmaps = listCourses;

// Save a course
export async function saveCourse(
  course: Course
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(course),
    });
    return await response.json();
  } catch (e) {
    console.error("Error saving course:", e);
    return { success: false, error: String(e) };
  }
}

/** @deprecated Use saveCourse instead */
export const saveRoadmap = saveCourse;

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

/** @deprecated Use generateCourse instead */
export const generateRoadmap = generateCourse;

// Get a single course
export async function getCourse(id: string): Promise<Course | null> {
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
    return await response.json();
  } catch (e) {
    console.error(`Error getting course ${id}:`, e);
    return null;
  }
}

/** @deprecated Use getCourse instead */
export const getRoadmap = getCourse;

// Delete a course
export async function deleteCourse(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/courses/${id}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (e) {
    console.error(`Error deleting course ${id}:`, e);
    return { success: false, error: String(e) };
  }
}

/** @deprecated Use deleteCourse instead */
export const deleteRoadmap = deleteCourse;

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

export async function generateLessonFlashcards(
  courseId: string,
  lessonId: string,
  additionalInstructions?: string,
  model?: string,
  includeContent?: boolean
): Promise<{ success: boolean; content?: FlashcardsContent; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/flashcards/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalInstructions, model, includeContent }),
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
  additionalInstructions?: string,
  model?: string,
  includeContent?: boolean
): Promise<{ success: boolean; content?: QuizContent; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/quiz/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalInstructions, model, includeContent }),
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

// Delete lesson tests
export async function deleteLessonTests(
  courseId: string,
  lessonId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/tests`,
      { method: "DELETE" }
    );
    return await response.json();
  } catch (e) {
    console.error(`Error deleting lesson tests ${lessonId}:`, e);
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
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}`
    );
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(response.statusText);
    }
    return await response.json();
  } catch (e) {
    console.error(`Error getting lesson ${lessonId}:`, e);
    return null;
  }
}

export async function getLessonFlashcards(
  courseId: string,
  lessonId: string
): Promise<{ content: FlashcardsContent } | null> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/flashcards`
    );
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(response.statusText);
    }
    return await response.json();
  } catch (e) {
    console.error(`Error getting flashcards ${lessonId}:`, e);
    return null;
  }
}

export async function getLessonQuiz(
  courseId: string,
  lessonId: string
): Promise<{ content: QuizContent } | null> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/quiz`
    );
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(response.statusText);
    }
    return await response.json();
  } catch (e) {
    console.error(`Error getting quiz ${lessonId}:`, e);
    return null;
  }
}

export async function getFlashcardsReviews(
  courseId: string,
  lessonId: string
): Promise<ReviewData | null> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/reviews`
    );
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(response.statusText);
    }
    return await response.json();
  } catch (e) {
    console.error(`Error getting reviews ${lessonId}:`, e);
    return null;
  }
}

export async function saveFlashcardsReviews(
  courseId: string,
  lessonId: string,
  data: ReviewData
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/reviews`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return await response.json();
  } catch (e) {
    console.error("Error saving reviews:", e);
    return { success: false, error: String(e) };
  }
}

export async function getLessonExercises(
  courseId: string,
  lessonId: string
): Promise<{ content: string } | null> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/exercises`
    );
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(response.statusText);
    }
    return await response.json();
  } catch (e) {
    console.error(`Error getting lesson exercises ${lessonId}:`, e);
    return null;
  }
}

// Generate lesson content
export async function generateLesson(
  courseId: string,
  lessonId: string,
  additionalInstructions?: string,
  model?: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          additionalInstructions,
          model,
        }),
      }
    );

    return await response.json();
  } catch (e) {
    console.error("Error generating lesson:", e);
    return { success: false, error: String(e) };
  }
}

export async function generateLessonTests(
  courseId: string,
  lessonId: string,
  additionalInstructions?: string,
  model?: string
): Promise<{ success: boolean; content?: unknown; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/tests/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          additionalInstructions,
          model,
        }),
      }
    );

    return await response.json();
  } catch (e) {
    console.error("Error generating lesson tests:", e);
    return { success: false, error: String(e) };
  }
}

export async function generateLessonExercises(
  courseId: string,
  lessonId: string,
  additionalInstructions?: string,
  model?: string,
  includeContent?: boolean
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/courses/${courseId}/lessons/${lessonId}/exercises/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          additionalInstructions,
          model,
          includeContent,
        }),
      }
    );

    return await response.json();
  } catch (e) {
    console.error("Error generating lesson exercises:", e);
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

import { config } from "dotenv";
import { join, resolve } from "node:path";

// Load .env into process.env for server handlers.
// This is a no-op if variables are already provided by the runtime.
config();

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const APP_NAME = process.env.APP_NAME || "CogniRoom";

export const DATA_PATH = resolve(
  process.cwd(),
  process.env.DATA_PATH || "./data"
);
export const COURSES_DIR = join(DATA_PATH, "courses");
/** @deprecated Use COURSES_DIR instead */
export const ROADMAPS_DIR = COURSES_DIR;

// Helper functions for nested course structure paths
export function getCoursePath(courseId: string): string {
  return join(COURSES_DIR, courseId);
}

export function getCourseFilePath(courseId: string): string {
  return join(getCoursePath(courseId), "course.json");
}

export function getCourseLessonsDir(courseId: string): string {
  return join(getCoursePath(courseId), "lessons");
}

export function getLessonFilePath(courseId: string, lessonId: string): string {
  return join(getCourseLessonsDir(courseId), `${lessonId}.md`);
}

export function getCourseTestsDir(courseId: string): string {
  return join(getCoursePath(courseId), "tests");
}

export function getTestFilePath(courseId: string, lessonId: string): string {
  return join(getCourseTestsDir(courseId), `${lessonId}.json`);
}

export function getCourseExercisesDir(courseId: string): string {
  return join(getCoursePath(courseId), "exercises");
}

export function getExerciseFilePath(
  courseId: string,
  lessonId: string
): string {
  return join(getCourseExercisesDir(courseId), `${lessonId}.md`);
}

// Legacy flat directories (for migration support)
/** @deprecated Use getCourseLessonsDir instead */
export const LESSONS_DIR = join(DATA_PATH, "lessons");
/** @deprecated Use getCourseTestsDir instead */
export const TESTS_DIR = join(DATA_PATH, "tests");
/** @deprecated Use getCourseExercisesDir instead */
export const EXERCISES_DIR = join(DATA_PATH, "exercises");

// Settings directory - stored in project root
export const SETTINGS_DIR = resolve(process.cwd(), ".settings");
export const SETTINGS_FILE = join(SETTINGS_DIR, "settings.json");
export const SETTINGS_HISTORY_FILE = join(SETTINGS_DIR, "history.json");

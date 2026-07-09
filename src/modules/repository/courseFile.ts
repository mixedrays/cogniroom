/**
 * Shared helpers for reading/writing the canonical `course.md` file. Used by
 * both the server route handlers (filesystem StorageApi) and the browser local
 * repository (IndexedDB StorageApi) so completion-flag bookkeeping stays
 * identical across storage modes.
 */

import type { StorageApi } from "@modules/storage/client";
import { storagePaths } from "@modules/storage/paths";
import { getFormatAdapter } from "@modules/content-formats";
import {
  findLessonInCourse,
  setLessonSectionCompletion,
} from "@modules/core";
import type { Course, LessonSection } from "@modules/core";

export async function readCourse(
  api: StorageApi,
  courseId: string
): Promise<Course | null> {
  const response = await api.get<string>(storagePaths.course(courseId));
  if (!response.ok) return null;
  return getFormatAdapter("course").deserialize(await response.text());
}

export async function writeCourse(
  api: StorageApi,
  course: Course
): Promise<void> {
  await api.put(
    storagePaths.course(course.id),
    getFormatAdapter("course").serialize(course)
  );
}

/**
 * Best-effort reset of a lesson section's completion flag in `course.md`
 * (used after deleting the corresponding content). No-op when the course or
 * lesson is missing, mirroring the existing handlers.
 */
export async function resetLessonSectionCompletion(
  api: StorageApi,
  courseId: string,
  lessonId: string,
  section: LessonSection
): Promise<void> {
  const course = await readCourse(api, courseId);
  if (!course) return;
  const found = findLessonInCourse(course, lessonId);
  if (found) {
    setLessonSectionCompletion(found.lesson, section, false);
  }
  course.updatedAt = new Date().toISOString();
  await writeCourse(api, course);
}

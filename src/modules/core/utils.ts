import type {
  Course,
  CourseMetadata,
  Lesson,
  LessonSection,
  Topic,
} from "./types";

/**
 * Locate a lesson and its containing topic within a course. Returns the first
 * match (live references, so callers may mutate the lesson in place), or null
 * when no topic contains the lesson id.
 */
export function findLessonInCourse(
  course: Course,
  lessonId: string
): { topic: Topic; lesson: Lesson } | null {
  for (const topic of course.topics ?? []) {
    const lesson = topic.lessons?.find((l) => l.id === lessonId);
    if (lesson) return { topic, lesson };
  }
  return null;
}

export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50)
    .replace(/-$/, "");
}

export function generateUniqueCourseId(
  title: string,
  existingIds: string[]
): string {
  const slug = toSlug(title) || `course-${Date.now()}`;
  if (!existingIds.includes(slug)) return slug;
  let n = 2;
  while (existingIds.includes(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateUniqueDeckId(
  title: string,
  existingIds: string[]
): string {
  const slug = toSlug(title) || `deck-${Date.now()}`;
  if (!existingIds.includes(slug)) return slug;
  let n = 2;
  while (existingIds.includes(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}

export function isLessonSectionCompleted(
  lesson: Lesson,
  section: LessonSection
): boolean {
  switch (section) {
    case "theory":
      return lesson.theoryCompleted ?? lesson.completed ?? false;
    case "flashcards":
      return lesson.flashcardsCompleted ?? false;
    case "quiz":
      return lesson.quizCompleted ?? false;
    case "exercises":
      return lesson.exercisesCompleted ?? false;
  }
}

export function isLessonFullyCompleted(lesson: Lesson): boolean {
  const theoryDone =
    !lesson.hasContent || isLessonSectionCompleted(lesson, "theory");
  const exercisesDone =
    !lesson.hasExercises || isLessonSectionCompleted(lesson, "exercises");
  return theoryDone && exercisesDone;
}

export function calculateProgress(course: Course): number {
  let totalLessons = 0;
  let completedLessons = 0;

  for (const topic of course.topics) {
    totalLessons += topic.lessons.length;
    completedLessons += topic.lessons.filter(
      (l) => l.theoryCompleted ?? l.completed ?? false
    ).length;
  }

  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
}

export function getCourseMetadata(course: Course): CourseMetadata {
  let lessonCount = 0;
  let completedCount = 0;

  for (const topic of course.topics) {
    lessonCount += topic.lessons.length;
    completedCount += topic.lessons.filter(
      (l) => l.theoryCompleted ?? l.completed ?? false
    ).length;
  }

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    source: course.source,
    topicCount: course.topics.length,
    lessonCount,
    completedCount,
    progress:
      lessonCount === 0 ? 0 : Math.round((completedCount / lessonCount) * 100),
  };
}

/** @deprecated Use getCourseMetadata instead */
export const getRoadmapMetadata = getCourseMetadata;

// Course data types

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  hasContent?: boolean;
  hasFlashcards?: boolean;
  hasQuiz?: boolean;
  hasExercises?: boolean;
  // Section-specific completion tracking
  theoryCompleted?: boolean;
  theoryCompletedAt?: string;
  flashcardsCompleted?: boolean;
  flashcardsCompletedAt?: string;
  quizCompleted?: boolean;
  quizCompletedAt?: string;
  exercisesCompleted?: boolean;
  exercisesCompletedAt?: string;
  /** @deprecated Use theoryCompleted instead */
  completed?: boolean;
  /** @deprecated Use theoryCompletedAt instead */
  completedAt?: string;
}

export type LessonSection = "theory" | "flashcards" | "quiz" | "exercises";

// Helper to check if a lesson section is completed
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

// Helper to check if entire lesson is completed (all available sections)
export function isLessonFullyCompleted(lesson: Lesson): boolean {
  const theoryDone = !lesson.hasContent || isLessonSectionCompleted(lesson, "theory");
  const testsDone =
    (!lesson.hasFlashcards || isLessonSectionCompleted(lesson, "flashcards")) &&
    (!lesson.hasQuiz || isLessonSectionCompleted(lesson, "quiz"));
  const exercisesDone = !lesson.hasExercises || isLessonSectionCompleted(lesson, "exercises");
  return theoryDone && testsDone && exercisesDone;
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  source: "llm" | "import" | "extract";
  sourceUrl?: string;
  topics: Topic[];
}

/** @deprecated Use Course instead */
export type Roadmap = Course;

export interface CourseMetadata {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  source: "llm" | "import" | "extract";
  topicCount: number;
  lessonCount: number;
  completedCount: number;
  progress: number;
}

/** @deprecated Use CourseMetadata instead */
export type RoadmapMetadata = CourseMetadata;

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  knownCount?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
  options: string[];
}

export interface TestsContent {
  version: number;
  flashcards: Flashcard[];
  quizQuestions?: QuizQuestion[];
  legacyMarkdown?: string;
}

// Helper to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to calculate course progress
export function calculateProgress(course: Course): number {
  let totalLessons = 0;
  let completedLessons = 0;

  for (const topic of course.topics) {
    totalLessons += topic.lessons.length;
    completedLessons += topic.lessons.filter((l) =>
      l.theoryCompleted ?? l.completed ?? false
    ).length;
  }

  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
}

// Helper to get course metadata
export function getCourseMetadata(course: Course): CourseMetadata {
  let lessonCount = 0;
  let completedCount = 0;

  for (const topic of course.topics) {
    lessonCount += topic.lessons.length;
    completedCount += topic.lessons.filter((l) =>
      l.theoryCompleted ?? l.completed ?? false
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
